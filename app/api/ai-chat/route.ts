// app/api/ai-chat/route.ts
import "server-only";

import { headers as nextHeaders, cookies as nextCookies } from "next/headers";

/**
 * Chat AAI genérico (sin hardcodes de industria).
 * - Fuente de verdad: RDD LIVE vía /api/out/rdd/*
 * - Intenciones: hours | contact | address | order | socials | products/menu/services | events | general
 * - Respuesta humana determinística para intenciones claras usando SOLO branding.json
 * - Fallback LLM para preguntas complejas (compat Chat Completions / Responses API)
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------- Tipos ----------
type Short = "es" | "en" | "fr";
type Topic =
  | "hours"
  | "contact"
  | "socials"
  | "menu"
  | "products"
  | "services"
  | "address"
  | "order"
  | "events"
  | "general";

type Block =
  | { type: "cta-row"; items: Array<{ label: string; href: string }> }
  | { type: "video"; title?: string; embedUrl: string; thumb?: string }
  | { type: "products"; items: Array<{ title: string; image?: string; href?: string; price?: string }> }
  | { type: "events"; items: Array<{ title: string; date?: string; description?: string; href?: string; videoUrl?: string }> }
  | { type: "hours"; today?: string; weekly?: Array<{ day: string; value: string }> };

// ---------- Locale ----------
// ---------- Locale ----------
const toShort = (l?: string | null): Short => {
  const v = (l || "").toLowerCase();
  if (v.startsWith("es")) return "es";
  if (v.startsWith("fr")) return "fr";
  return "en";
};

// usa lo que ya setea la app: body -> cookies -> headers -> .env
async function resolveAppLocale(
  bodyLocale?: string,
  supported: Short[] = ["es", "en", "fr"],
  fallback: Short = "en"
): Promise<Short> {
  // En algunas versiones, next/headers devuelve Promise
  const H = await (nextHeaders() as any);
  const C = await (nextCookies() as any);

  const getHeader = (name: string) =>
    typeof H?.get === "function" ? H.get(name) : undefined;
  const getCookie = (name: string) =>
    typeof C?.get === "function" ? C.get(name)?.value : undefined;

  const pickShort = (val?: string | null): Short | null => {
    const v = (val || "").toLowerCase();
    if (v.startsWith("es")) return "es";
    if (v.startsWith("fr")) return "fr";
    if (v.startsWith("en")) return "en";
    return null;
  };

  // intenta tomar el prefijo de locale de la URL que originó la llamada ("/es/...","/en/...")
  const refShort = (() => {
    const href = getHeader("referer");
    if (!href) return undefined;
    try {
      const seg = new URL(href).pathname.split("/").filter(Boolean)[0];
      return pickShort(seg) ?? undefined;
    } catch { return undefined; }
  })();

  const candidates: Array<string | undefined | null> = [
    bodyLocale,                                        // AiComp body
    getHeader("x-locale") || getHeader("x-app-locale"),// header explícito
    getCookie("locale") || getCookie("NEXT_LOCALE"),   // cookies i18n
    refShort,                                          // prefijo del referer
    getHeader("accept-language"),
    process.env.NEXT_PUBLIC_DEFAULT_LOCALE
  ];


  for (const c of candidates) {
    const s = pickShort(c);
    if (s && supported.includes(s)) return s;
  }
  return supported.includes(fallback) ? fallback : (supported[0] ?? "en");
}

// ---------- Self-origin & fetch ----------
function originFromReq(req: Request) {
  const u = new URL(req.url);
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? u.host;
  const proto = req.headers.get("x-forwarded-proto") ?? u.protocol.replace(":", "");
  return `${proto}://${host}`;
}
async function getJson(url: string, ttlSec = 0) {
  const init = ttlSec > 0 ? { next: { revalidate: ttlSec } as const } : { cache: "no-store" as const };
  const r = await fetch(url, init);
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return r.json();
}
async function loadSettingsLive(req: Request) {
  const base = originFromReq(req);
  const data = await getJson(`${base}/api/out/rdd/settings`, 0);
  return data?.settings ?? data ?? {};
}
async function loadBrandingLive(req: Request, short: Short) {
  const base = originFromReq(req);
  const data = await getJson(`${base}/api/out/rdd/branding/${short}`, 0);
  return data?.branding ?? data ?? {};
}
async function loadDictLive(req: Request, short: Short) {
  const base = originFromReq(req);
  const data = await getJson(`${base}/api/out/rdd/i18n/${short}`, 0);
  return data?.dict ?? data ?? {};
}

// ---------- Clasificación de intención (agnóstica) ----------
const classify = (m = ""): Topic => {
  const t = m.toLowerCase();
  if (/(hour|open|close|cerr|horario|schedule)/.test(t)) return "hours";
  if (/(phone|tel|call|llamar|contact|correo|email)/.test(t)) return "contact";
  if (/(address|direc|ubic|map|cómo llegar|how to get|adresse|itinéraire)/.test(t)) return "address";
  if (/(order|pedido|delivery|env[ií]o|pick.?up|recoger|compra|commande)/.test(t)) return "order";
  if (/(social|instagram|facebook|tiktok|yt|youtube|redes)/.test(t)) return "socials";
  if (/(event|evento|promoc|special|festival|holiday)/.test(t)) return "events";
  if (/(menu|cat[aá]logo|products?|servicios?|service)/.test(t)) {
    if (/servicio|service/i.test(t)) return "services";
    return "products";
  }
  return "general";
};

// --- detección simple del idioma del mensaje del usuario ---
function detectUserLang(text: string): Short | null {
  const t = (text || "").toLowerCase();
  if (!t) return null;
  // heurísticas ligeras (no dependen del negocio)
  const es = /[áéíóúñ¿¡]|\b(hola|gracias|por favor|horario|cerrado|abierto)\b/;
  const fr = /[àâçéèêëîïôûùüÿœæ]|\b(bonjour|merci|horaire|fermé|ouvert)\b/;
  if (fr.test(t)) return "fr";
  if (es.test(t)) return "es";
  return "en";
}

function hintToTopic(h?: string | null): Topic | undefined {
  if (!h) return undefined;
  const s = String(h).toLowerCase();
  if (/(^|\.)(schedule|hour|hours)(\.|$)/.test(s)) return "hours";
  if (/(^|\.)(company\.contact|contact|phone|email)(\.|$)/.test(s)) return "contact";
  if (/(^|\.)(address|map|maps|ubic|direc)(\.|$)/.test(s)) return "address";
  if (/(^|\.)(social|socials)(\.|$)/.test(s)) return "socials";
  if (/(^|\.)(platforms|order|menu|delivery|pickup)(\.|$)/.test(s)) return "menu";
  if (/(^|\.)(products?)(\.|$)/.test(s)) return "products";
  if (/(^|\.)(services?)(\.|$)/.test(s)) return "services";
  if (/(^|\.)(events?)(\.|$)/.test(s)) return "events";
  return undefined;
}
function pathsToTopic(ps?: unknown): Topic | undefined {
  if (!Array.isArray(ps)) return undefined;
  for (const p of ps) {
    const t = hintToTopic(p as string);
    if (t) return t;
  }
  return undefined;
}

// ---------- Pickers tolerantes desde branding ----------
// ---------- Pickers tolerantes desde branding ----------
const pick = {
  id: (b: any) => ({
    brandName: b?.company?.brandName ?? b?.company?.legalName ?? null,
    website: b?.company?.contact?.website ?? b?.company?.website ?? b?.links?.website ?? null,
  }),

  // Horarios: acepta schedule u hours, en raíz o dentro de company
  hours: (b: any) =>
    b?.hours ??
    b?.schedule ??
    b?.company?.hours ??
    b?.company?.schedule ??
    null,

  // Contacto: normaliza a { phones: string[], email?: string, site?: string }
  contact: (b: any) => {
    const c = b?.company?.contact ?? b?.contact ?? {};
    const phonesRaw =
      c?.phones ??
      (c?.phone ? [c.phone] : undefined) ??
      b?.company?.phones ??
      b?.contact?.phones;

    const phones = Array.isArray(phonesRaw)
      ? phonesRaw.filter(Boolean)
      : phonesRaw
      ? [String(phonesRaw)]
      : null;

    const email =
      c?.email ??
      b?.company?.email ??
      b?.contact?.email ??
      null;

    const site =
      c?.website ??
      b?.company?.website ??
      b?.links?.website ??
      null;

    return { phones, email, site };
  },

  // Socials: raíz, links.socials o dentro de company.contact.socials
  socials: (b: any) =>
    b?.socials ??
    b?.links?.socials ??
    b?.company?.contact?.socials ??
    null,

  // Dirección + Maps: raíz, company.contact.address o company.address
  address: (b: any) => {
    const a = b?.address ?? b?.company?.contact?.address ?? b?.company?.address;
    const maps =
      b?.links?.maps ??
      b?.company?.contact?.mapsUrl ??
      a?.mapsUrl ??
      null;
    return { address: a, maps };
  },

  // Pedido/Plataformas: ordering.website | links.order | company.contact.order + platforms
  order: (b: any) => {
    const website =
      b?.ordering?.website ??
      b?.links?.order ??
      b?.company?.contact?.order ??
      null;

    const appsRaw =
      b?.ordering?.apps ??
      b?.platforms ??
      null;

    let apps: Array<{ name: string; url: string }> | null = null;

    if (Array.isArray(appsRaw)) {
      apps = appsRaw
        .map((a: any) =>
          a?.url && a?.name ? { name: String(a.name), url: String(a.url) } : null
        )
        .filter(Boolean) as any;
    } else if (appsRaw && typeof appsRaw === "object") {
      // platforms como objeto { uber: "url", doordash: "url", ... }
      apps = Object.entries(appsRaw)
        .filter(([, url]) => !!url)
        .map(([name, url]) => ({ name, url: String(url) }));
    }

    return { website, apps };
  },

  // Menú/Catálogo: acepta varios formatos conocidos
  menu: (b: any) => {
    if (Array.isArray(b?.menu)) return b.menu;
    if (Array.isArray(b?.menu?.items)) return b.menu.items;
    if (Array.isArray(b?.menu?.sections)) {
      const items: any[] = [];
      for (const sec of b.menu.sections) {
        if (Array.isArray(sec?.items)) items.push(...sec.items);
      }
      return items;
    }
    return null;
  },

  // Productos/Servicios: prioriza arrays directos; si no hay, usa menú
  products: (b: any) =>
    (Array.isArray(b?.products) && b.products) ||
    (Array.isArray(b?.services) && b.services) ||
    pick.menu(b) ||
    null,

  // Eventos: raíz o company.events o more.Events
  events: (b: any) =>
    b?.events ??
    b?.company?.events ??
    b?.more?.Events ??
    null,

  // Persona
  agentPersona: (b: any, s: any) =>
    s?.agentAI?.persona ||
    b?.agent?.persona ||
    null,
};

// ---------- Bloques enriquecidos ----------
const ytEmbed = (url?: string | null) => {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/i);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
};

function normalizeHours(hours: any, locale: Short): { today?: string; weekly?: Array<{ day: string; value: string }> } {
  if (!hours) return {};
  const L = (s: string) => s?.toString?.() ?? "";

  // Array de objetos
  if (Array.isArray(hours) && hours.length && (hours[0].day || (hours[0].open && hours[0].close))) {
    const weekly = hours.map((h: any) => ({ day: L(h.day ?? ""), value: [h.open, h.close].filter(Boolean).join("–") }));
    const todayIdx = new Date().getDay(); // 0=Sun
    const map = ["sun","mon","tue","wed","thu","fri","sat"];
    const todayDay = map[todayIdx];
    const today = weekly.find(w => w.day.toLowerCase().startsWith(todayDay))?.value;
    return {
      today: today ? (locale==="es" ? `Hoy: ${today}` : locale==="fr" ? `Aujourd'hui : ${today}` : `Today: ${today}`) : undefined,
      weekly
    };
  }

  // Objeto con llaves por día
  const keys = ["mon","tue","wed","thu","fri","sat","sun"];
  if (typeof hours === "object") {
    const get = (k: string) => hours[k] ?? hours[k.toUpperCase()] ?? hours[k[0].toUpperCase()+k.slice(1)] ?? null;
    const weekly = keys.map(k => ({ day: k, value: L(get(k) ?? "")})).filter(x => x.value);
    const idx = new Date().getDay(); // 0=Sun
    const todayKey = keys[(idx + 6) % 7]; // map 0->sun
    const tval = L(get(todayKey) ?? "");
    return {
      today: tval ? (locale==="es" ? `Hoy: ${tval}` : locale==="fr" ? `Aujourd'hui : ${tval}` : `Today: ${tval}`) : undefined,
      weekly
    };
  }

  if (typeof hours === "string") return { today: hours };
  return {};
}

function buildBlocksByTopic(b: any, topic: Topic, locale: Short): Block[] {
  const blocks: Block[] = [];

  if (topic === "hours") {
    const h = normalizeHours(pick.hours(b), locale);
    blocks.push({ type: "hours", today: h.today, weekly: h.weekly });
  }

  // Productos/Servicios/Menu → products
  if (topic === "products" || topic === "menu" || topic === "services") {
    const top = pickTopItems(b, "", 3);
    if (top.length) blocks.push({ type: "products", items: top });
  }

  // Eventos (+video si hay)
  if (topic === "events") {
    const events = pick.events(b);
    if (Array.isArray(events) && events.length) {
      const items = events.slice(0, 4).map((e: any) => ({
        title: e?.title ?? "Event",
        date: e?.date ?? e?.when ?? undefined,
        description: e?.description ?? undefined,
        href: e?.url ?? e?.href ?? undefined,
        videoUrl: e?.videoUrl ?? undefined,
      }));
      blocks.push({ type: "events", items });
      const v1 = ytEmbed(events.find((e: any) => e?.videoUrl)?.videoUrl) || ytEmbed(b?.company?.videoUrl);
      if (v1) blocks.push({ type: "video", title: items[0]?.title, embedUrl: v1 });
    }
  }

  // Fila de CTAs según datos reales
  const ctas: Array<{ label: string; href: string }> = [];
  const contact = pick.contact(b);
  const addr = pick.address(b);
  const ord = pick.order(b);
  const socials = pick.socials(b);

  if (contact?.phones?.[0]) ctas.push({ label: `📞 ${contact.phones[0]}`, href: `tel:${contact.phones[0]}` });
  if (contact?.email) ctas.push({ label: `✉️ ${contact.email}`, href: `mailto:${contact.email}` });
  if (contact?.site) ctas.push({ label: "🌐 Website", href: contact.site });
  if (addr?.maps) ctas.push({ label: "🗺️ Maps", href: addr.maps });
  if (ord?.website) ctas.push({ label: "🛒 Online", href: ord.website });
  if (Array.isArray(ord?.apps)) for (const app of ord!.apps) if (app?.url && app?.name) ctas.push({ label: `🛵 ${app.name}`, href: app.url });
  if (socials) for (const [name, url] of Object.entries(socials)) if (url) ctas.push({ label: `# ${name}`, href: String(url) });
  if (ctas.length) blocks.push({ type: "cta-row", items: ctas });

  return blocks;
}

// ---------- Catálogo genérico y ranking ----------
type CatalogItem = {
  title?: string;
  name?: string;
  description?: string;
  desc?: string;
  tags?: string[];
  url?: string;
  href?: string;
  image?: string;
  photo?: string;
  img?: string;
  price?: string | number;
  rating?: number;
  popularity?: number;
  bestseller?: boolean;
};

function getCatalog(branding: any): CatalogItem[] {
  if (Array.isArray(branding?.products)) return branding.products;
  if (Array.isArray(branding?.services)) return branding.services;
  const menu = pick.menu(branding);
  if (Array.isArray(menu)) return menu;
  return [];
}

function itemText(i: CatalogItem) {
  const title = i.title ?? i.name ?? "";
  const desc  = i.description ?? i.desc ?? "";
  const tags  = Array.isArray(i.tags) ? i.tags.join(" ") : "";
  return `${title} ${desc} ${tags}`.toLowerCase();
}

function tokenize(text: string) {
  return (text.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/g, " "))
    .split(/\s+/)
    .filter(w => w.length >= 3 && !stopwords.has(w));
}
const stopwords = new Set([
  // ES
  "para","por","con","sin","los","las","del","una","unos","unas","que","como","cuando","donde","de","la","el","y","o","en","es","son",
  // EN
  "the","and","for","with","without","your","you","from","this","that","what","when","where","how","are","is","to","of","a","an",
  // FR
  "le","la","les","des","du","de","un","une","et","pour","avec","sans","est","sont","que","quand","ou","où","dans","au","aux"
]);

function baseScore(i: CatalogItem) {
  let s = 0;
  if (i.bestseller) s += 5;
  if (typeof i.rating === "number") s += Math.min(5, i.rating);
  if (typeof i.popularity === "number") s += Math.min(5, i.popularity);
  return s;
}

function scoreItem(i: CatalogItem, qTokens: string[]) {
  if (!qTokens.length) return baseScore(i);
  const text = itemText(i);
  let hit = 0;
  for (const t of qTokens) if (text.includes(t)) hit++;
  return hit * 10 + baseScore(i);
}

function pickTopItems(branding: any, userText: string, limit = 3) {
  const items = getCatalog(branding);
  if (!items.length) return [];
  const qTokens = tokenize(userText || "");
  const ranked = [...items]
    .map(i => ({ i, s: scoreItem(i, qTokens) }))
    .sort((a,b)=> b.s - a.s)
    .slice(0, limit)
    .map(({i}) => ({
      title: i.title ?? i.name ?? "Item",
      image: i.image ?? i.photo ?? i.img ?? undefined,
      href:  i.url ?? i.href ?? undefined,
      price: i.price ? String(i.price) : undefined,
    }));
  return ranked;
}

// ---------- Redactor humano genérico (por tema, usando solo branding) ----------
function composeAnswer(opts: {
  locale: Short,
  topic: Topic,
  branding: any,
  userMessage?: string
}) {
  const { locale, topic, branding, userMessage } = opts;
  const brand = pick.id(branding);
  const addr = pick.address(branding);
  const ord  = pick.order(branding);
  const socials = pick.socials(branding);

  const join = (arr: string[]) => arr.filter(Boolean).join(locale==="fr" ? " · " : " · ");

  if (topic === "hours") {
    const h = normalizeHours(pick.hours(branding), locale);
    const head =
      h.today ? h.today :
      locale==="es" ? "Estos son nuestros horarios:" :
      locale==="fr" ? "Voici nos horaires :" :
                      "These are our hours:";
    const tail = join([
      ord?.website && (locale==="es" ? "🛒 Pedido online" : locale==="fr" ? "🛒 Commande en ligne" : "🛒 Order online"),
      addr?.maps   && (locale==="es" ? "🗺️ Cómo llegar"  : locale==="fr" ? "🗺️ Itinéraire"       : "🗺️ Directions"),
    ].filter(Boolean) as string[]);
    return [head, tail && (locale==="es" ? `Accesos: ${tail}` : locale==="fr" ? `Accès : ${tail}` : `Quick links: ${tail}`)]
      .filter(Boolean).join("\n\n");
  }

  if (topic === "contact") {
    const c = pick.contact(branding);
    const lines = [
      c?.phones?.[0] && (locale==="es" ? `📞 Tel: ${c.phones[0]}` : locale==="fr" ? `📞 Tél : ${c.phones[0]}` : `📞 Phone: ${c.phones[0]}`),
      c?.email && `✉️ ${c.email}`,
      c?.site  && `🌐 ${c.site}`,
    ].filter(Boolean) as string[];
    const head =
      locale==="es" ? "Aquí tienes nuestros datos de contacto:" :
      locale==="fr" ? "Voici nos coordonnées :" :
                      "Here are our contact details:";
    return [head, ...lines].join("\n");
  }

  if (topic === "address") {
    const line = addr?.address?.formatted || addr?.address?.line || brand.website || "";
    const maps = addr?.maps ? (locale==="es" ? "🗺️ Ver en Maps" : locale==="fr" ? "🗺️ Voir sur Maps" : "🗺️ View on Maps") : "";
    const head =
      locale==="es" ? `Estamos en ${line}` :
      locale==="fr" ? `Nous sommes à ${line}` :
                      `We are at ${line}`;
    return [head, addr?.maps ? `[${maps}](${addr.maps})` : ""].filter(Boolean).join("\n\n");
  }

  if (topic === "socials") {
    const names = socials ? Object.keys(socials) : [];
    const head =
      locale==="es" ? "Estamos en redes:" :
      locale==="fr" ? "Nous sommes sur les réseaux :" :
                      "Find us on social:";
    const list = names.length ? names.map(n => `# ${n}`).join(" · ") : "";
    return [head, list].filter(Boolean).join("\n\n");
  }

  if (topic === "order") {
    const lines = [
      ord?.website && (locale==="es" ? `🛒 Compra aquí: ${ord.website}` : locale==="fr" ? `🛒 Commandez ici : ${ord.website}` : `🛒 Order here: ${ord.website}`),
      ...(Array.isArray(ord?.apps) ? ord!.apps.filter((a:any)=>a?.url&&a?.name).map((a:any)=>`🛵 ${a.name}: ${a.url}`) : [])
    ].filter(Boolean) as string[];
    const head =
      locale==="es" ? "Opciones de pedido:" :
      locale==="fr" ? "Options de commande :" :
                      "Ordering options:";
    return [head, ...lines].join("\n");
  }

  if (topic === "products" || topic === "menu" || topic === "services") {
    const top = pickTopItems(branding, userMessage || "", 3);
    if (top.length) {
      const names = top.map(i => i.title);
      const list = names.map(n => `• **${n}**`).join("\n");
      const ask =
        locale==="es" ? "¿Te paso más opciones o algo similar?" :
        locale==="fr" ? "Tu veux plus d'options ou quelque chose de similaire ?" :
                        "Want more options or something similar?";
      const head =
        locale==="es" ? "Aquí van algunas opciones populares:" :
        locale==="fr" ? "Voici quelques options populaires :" :
                        "Here are a few popular picks:";
      return [head, list, ask].join("\n");
    }
    return locale==="es" ? "Aún no veo ítems en el catálogo de la RDD. ¿Prefieres horarios o contacto?"
         : locale==="fr" ? "Je ne vois pas encore d'éléments de catalogue. Tu veux les horaires ou le contact ?"
                         : "I don't see catalog items yet. Would you like hours or contact instead?";
  }

  if (topic === "events") {
    const evs = pick.events(branding);
    if (Array.isArray(evs) && evs.length) {
      const next = evs[0];
      const line =
        locale==="es" ? `Próximo evento: **${next?.title || ""}**${next?.date ? ` — ${next.date}` : ""}` :
        locale==="fr" ? `Prochain événement : **${next?.title || ""}**${next?.date ? ` — ${next.date}` : ""}` :
                        `Next event: **${next?.title || ""}**${next?.date ? ` — ${next.date}` : ""}`;
      return [line, next?.description || ""].filter(Boolean).join("\n\n");
    }
    return locale==="es" ? "Estamos preparando el calendario de eventos 😊"
         : locale==="fr" ? "Nous préparons le calendrier des événements 😊"
                         : "We're preparing the events calendar 😊";
  }

  // General
  const hello =
    locale==="es" ? `Soy tu asistente de ${brand.brandName || "la empresa"}. ¿Qué necesitas hoy?` :
    locale==="fr" ? `Je suis l'assistant de ${brand.brandName || "l'entreprise"}. De quoi as-tu besoin ?` :
                    `I'm the assistant for ${brand.brandName || "the business"}. How can I help today?`;
  return hello;
}

// ---------- Tokens helper ----------
const compact = (obj: any, max = 1200) => {
  const s = JSON.stringify(obj ?? {}, (k, v) => (v === null || v === undefined || v === "" ? undefined : v));
  return s.length > max ? s.slice(0, max) + " …" : s;
};

// ---------- LLM (Settings-driven, sin hardcode de modelo) ----------
type ApiMode = "auto" | "chat" | "responses";
function pickApiMode(settings: any, model: string): ApiMode {
  const s = (settings?.agentAI?.apiMode as ApiMode) || "auto";
  if (s !== "auto") return s;
  if (/(^|\b)(gpt-4\.1|o4|omni)/i.test(model)) return "responses";
  return "chat";
}
async function callChatCompletions(model: string, system: string, user: string, temperature: number, maxTokens: number) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, temperature, max_tokens: maxTokens, messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ] }),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(t || `HTTP ${r.status}`);
  const j = JSON.parse(t);
  return j?.choices?.[0]?.message?.content || "";
}
async function callResponses(model: string, system: string, user: string, temperature: number, maxOutputTokens: number) {
  const r = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, input: `${system}\n\n---\n${user}`, temperature, max_output_tokens: maxOutputTokens }),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(t || `HTTP ${r.status}`);
  const j = JSON.parse(t);
  return j?.output_text || j?.choices?.[0]?.message?.content || "";
}
async function askLLMCompat(opts: { settings:any; model:string; system:string; user:string; temperature:number; }) {
  const { settings, model, system, user, temperature } = opts;
  if (!process.env.OPENAI_API_KEY) return "(LLM offline)";
  const api = pickApiMode(settings, model);
  const maxTokensChat = Number(settings?.agentAI?.maxTokens ?? settings?.agentAI?.max_tokens ?? 500) || 500;
  const maxOutputTokens = Number(settings?.agentAI?.maxOutputTokens ?? settings?.agentAI?.max_output_tokens ?? maxTokensChat) || 500;

  if (api === "chat") return await callChatCompletions(model, system, user, temperature, maxTokensChat);
  if (api === "responses") return await callResponses(model, system, user, temperature, maxOutputTokens);

  try {
    return await callChatCompletions(model, system, user, temperature, maxTokensChat);
  } catch (e: any) {
    const m = String(e?.message || "").toLowerCase();
    const hint = m.includes("responses") || m.includes("max_output_tokens") || m.includes("unsupported parameter");
    if (!hint) throw e;
    return await callResponses(model, system, user, temperature, maxOutputTokens);
  }
}

// ---------- Handler ----------
type AIPayload = { userMessage: string; locale?: string; contextHint?: Topic; };

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AIPayload;

    // 1) Carga settings primero para conocer locales soportados
    const settings = await loadSettingsLive(req);
    const supportedList = (settings?.website?.i18n?.supported as string[]) ?? ["es", "en", "fr"];
    const supported = supportedList.map(s => toShort(s)) as Short[];

    const envDefault = process.env.NEXT_PUBLIC_DEFAULT_LOCALE;
    const fallback = (envDefault ? toShort(envDefault) : "en") as Short;

    // 2) Resuelve el locale que ya maneja la app
    let short = await resolveAppLocale(body?.locale, supported, fallback);

    // Si el usuario escribe en otro idioma soportado, respétalo
    const detected = detectUserLang(body?.userMessage || "");
    if (detected && supported.includes(detected)) {
      short = detected as Short;
    }

    // 3) Con ese locale, carga RDD live
    const hintTopic =
      pathsToTopic((body as any)?.paths) ||
      hintToTopic((body as any)?.contextHint);
    const topic: Topic = hintTopic || classify(body.userMessage || "");

    const branding = await loadBrandingLive(req, short);
    await loadDictLive(req, short);

    // Bloques por tema (determinísticos)
    let blocks = buildBlocksByTopic(branding, topic, short);
    if (topic === "products" || topic === "menu" || topic === "services") {
      const top = pickTopItems(branding, body.userMessage || "", 3);
      if (top.length) blocks = [{ type: "products", items: top } as any, ...blocks];
    }

    // 1) Si hay atajo o la intención es clara → respuesta humana determinística (sin LLM)
    const simpleTopics: Topic[] = ["hours","contact","address","order","socials","products","menu","services","events"];
    if (body.contextHint || simpleTopics.includes(topic)) {
      const message = composeAnswer({ locale: short, topic, branding, userMessage: body.userMessage || "" });
      return new Response(JSON.stringify({ ok: true, topic, message, blocks }), { headers: { "Content-Type": "application/json" } });
    }

    // 2) Pregunta compleja → LLM con slice mínimo
    const slice =
      topic === "hours"    ? { hours: pick.hours(branding) } :
      topic === "contact"  ? { contact: pick.contact(branding) } :
      topic === "socials"  ? { socials: pick.socials(branding) } :
      topic === "menu"     ? { catalog: getCatalog(branding) } :
      topic === "products" ? { catalog: getCatalog(branding) } :
      topic === "services" ? { catalog: getCatalog(branding) } :
      topic === "address"  ? { address: pick.address(branding) } :
      topic === "order"    ? { order: pick.order(branding) } :
      topic === "events"   ? { events: pick.events(branding) } :
      { id: pick.id(branding) };

    const persona = pick.agentPersona(branding, settings) || (
      short==="es" ? "amable, claro y útil" :
      short==="fr" ? "chaleureux, clair et utile" :
                     "warm, clear and helpful"
    );

    const system = [
      `You are a ${persona} assistant for a business.`,
      `Use ONLY the factual context provided (RDD). Do not invent promotions, prices, or unavailable services.`,
      `If something is unknown, say it briefly and suggest a safe next step.`,
      `Respond in ${short}. Prefer short paragraphs or bullet points. Use Markdown links when relevant.`,
      `Never output raw JSON to the user.`,
    ].join(" ");

    const user = [
      `User: """${body.userMessage || ""}"""`,
      `Context: ${compact({ topic, slice })}`,
    ].join("\n");

    const model = settings?.agentAI?.model || settings?.agentAI?.llmModel || "gpt-4o-mini";
    const temperature = Number(settings?.agentAI?.temperature ?? 0.4);
    const content = await askLLMCompat({ settings, model, system, user, temperature });

    return new Response(JSON.stringify({ ok: true, topic, message: content, blocks }), { headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: String(e?.message || e) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
