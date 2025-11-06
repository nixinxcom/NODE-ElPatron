// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const LOCALES = ['es','en','fr'] as const
const DEFAULT_LOCALE = 'en'

// extensiones públicas a ignorar
const PUBLIC_FILE = /\.(?:png|jpg|jpeg|gif|webp|svg|ico|txt|json|xml|css|js|map|mp4|webm|woff2?|ttf|otf)$/i
const IGNORED_PREFIXES = [
  '/_next',
  '/api',
  '/favicon',
  '/icons',
  '/og',
  '/sitemap',
  '/robots.txt',
  '/sw.js',
  '/workbox-',
  '/ads.txt',
  '/manifest.webmanifest',
]

// === tenant por host ===
const DEFAULT_TENANT = process.env.NEXT_PUBLIC_DEFAULT_TENANT || 'nixinx'
const TENANT_BY_HOST: Record<string, string> = {
  'nixinx.com': 'NIXINX',
  'localhost:3000': 'NIXINX',
  'www.nixinx.com': 'NIXINX',

  'patronbarandgrill.com': 'ElPatron',
  'localhost:3001': 'ElPatron',
  'www.patronbarandgrill.com': 'ElPatron',

  'hottacosrestaurant.ca': 'HTWindsor',
  'localhost:3002': 'HTWindsor',
  'www.hottacosrestaurant.ca': 'HTWindsor',

  'hottacosrestaurant.com': 'HTLeamington',
  'localhost:3003': 'HTLeamington',
  'www.hottacosrestaurant.com': 'HTLeamington',
}
function getTenantForHost(req: NextRequest) {
  const host = (req.headers.get('host') || '').toLowerCase()
  return TENANT_BY_HOST[host] || DEFAULT_TENANT
}

// Slugs de tenants conocidos (en minúsculas)
const STATIC_TOP_LEVEL_SLUGS = new Set<string>([
  'nixinx',
  'elpatron',
  'htwindsor',
  'htleamington',
])

// Home por tenant (segmento interno)
const HOME_BY_TENANT: Record<string, string> = {
  NIXINX: 'NIXINX',
  ElPatron: 'ElPatron',
  HTLeamington: 'HTLeamington',
  HTWindsor: 'HTWindsor',
}

// === Firestore REST (tu lógica existente) ===
const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
const SETTINGS_DOC = process.env.NEXT_PUBLIC_SETTINGS_DOC_PATH || 'settings/default'

function pickLocale(req: NextRequest): typeof LOCALES[number] {
  const header = (req.headers.get('accept-language') || '').toLowerCase()
  const langs = header.split(',').map(l => l.trim().split(';')[0].split('-')[0])
  for (const l of langs) if ((LOCALES as readonly string[]).includes(l)) return l as any
  return DEFAULT_LOCALE
}

function isI18nPath(pathname: string) {
  const first = pathname.split('/').filter(Boolean)[0]
  return (LOCALES as readonly string[]).includes(first ?? '')
}

// admin / wip
function isAdminOrWip(pathname: string) {
  const segs = pathname.split('/').filter(Boolean)
  if (!segs.length) return false
  const s1 = segs[1]?.toLowerCase()
  const s2 = segs[2]?.toLowerCase()
  return (s1 === 'admin' || s1 === 'wip' || s2 === 'admin' || s2 === 'wip')
}

function looksLikeAgentApi(pathname: string) {
  if (!pathname.startsWith('/api')) return false
  return /\/api\/(ai(\b|\/)|assistant\b|agent(s)?\b|ai-agents\b)/.test(pathname)
}

async function fetchSettingsDoc(): Promise<any | null> {
  if (!FIREBASE_PROJECT_ID) return null
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${encodeURIComponent(SETTINGS_DOC)}`
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

function readBool(doc: any, path: string[], defaultValue: boolean | null): boolean | null {
  try {
    let node = doc?.fields
    for (let i = 0; i < path.length - 1; i++) {
      node = node?.[path[i]]?.mapValue?.fields
    }
    const last = path[path.length - 1]
    const val = node?.[last]?.booleanValue
    if (typeof val === 'boolean') return val
    return defaultValue
  } catch {
    return defaultValue
  }
}

async function websiteEnabled(): Promise<boolean> {
  const doc = await fetchSettingsDoc()
  const v1 = readBool(doc, ['faculties','website'], null)
  const v2 = readBool(doc, ['website'], null)
  const value = v1 ?? v2
  return value !== false
}

async function agentEnabled(): Promise<boolean> {
  const doc = await fetchSettingsDoc()
  const v1 = readBool(doc, ['agentAI'], null)
  const v2 = readBool(doc, ['agentAI','enabled'], null)
  const value = v1 ?? v2
  return value !== false
}

export async function middleware(req: NextRequest) {
  const { pathname, search, hash } = req.nextUrl

  // normalización /en-US → /en
  const segs = pathname.split('/').filter(Boolean)
  const first = (segs[0] || '').toLowerCase()
  const LONG_TO_SHORT: Record<string, typeof LOCALES[number]> = {
    'en-us': 'en',
    'es-mx': 'es',
    'fr-ca': 'fr',
  }
  if (first in LONG_TO_SHORT) {
    const short = LONG_TO_SHORT[first]
    const rest = segs.slice(1).join('/')
    const url = req.nextUrl.clone()
    url.pathname = `/${short}${rest ? `/${rest}` : ''}`
    url.search = search
    url.hash = hash
    return NextResponse.redirect(url)
  }

  // APIs (incluye kill-switch del agente)
  if (pathname.startsWith('/api')) {
    if (looksLikeAgentApi(pathname)) {
      const on = await agentEnabled()
      if (!on) {
        return new NextResponse(JSON.stringify({ ok: false, error: 'agent_disabled' }), {
          status: 503,
          headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
        })
      }
    }
    return NextResponse.next()
  }

  // estáticos/ignorados
  if (IGNORED_PREFIXES.some(p => pathname.startsWith(p)) || PUBLIC_FILE.test(pathname)) {
    return NextResponse.next()
  }

  // === Rutas con locale visible: control multi-tenant + kill-switch ===
  if (isI18nPath(pathname)) {
    const parts = pathname.split('/').filter(Boolean)
    const locale = parts[0]
    const afterLocale = parts.slice(1)
    const firstAfter = (afterLocale[0] || '').toLowerCase()

    // kill-switch (salvo admin/wip)
    if (!isAdminOrWip(pathname)) {
      const enabled = await websiteEnabled()
      if (!enabled) {
        const url = req.nextUrl.clone()
        url.pathname = `/${locale}/wip`
        url.searchParams.set('from', pathname)
        const res = NextResponse.redirect(url, 307)
        res.headers.set('Cache-Control', 'no-store')
        res.headers.set('X-Robots-Tag', 'noindex, nofollow')
        return res
      }
    }

    const tenant = getTenantForHost(req)
    const tenantLower = tenant.toLowerCase()

    // admin/wip: permitidos tal cual (no forzamos tenant)
    if (isAdminOrWip(pathname)) {
      const reqHeaders = new Headers(req.headers)
      reqHeaders.set('x-tenant', tenant)
      reqHeaders.set('x-locale', locale)
      return NextResponse.next({ request: { headers: reqHeaders } })
    }

    // 1) /{locale} -> rewrite interno a /{locale}/{tenant}
    if (afterLocale.length === 0) {
      const home = HOME_BY_TENANT[tenant as keyof typeof HOME_BY_TENANT] || tenant
      const url = req.nextUrl.clone()
      url.pathname = `/${locale}/${home}`
      const reqHeaders = new Headers(req.headers)
      reqHeaders.set('x-tenant', tenant)
      reqHeaders.set('x-locale', locale)
      return NextResponse.rewrite(url, { request: { headers: reqHeaders } })
    }

    // 2) Si el usuario pone explícitamente el slug del tenant en la URL pública,
    //    lo limpiamos:
    //    /{locale}/ElPatron/...  -> /{locale}/...
    if (firstAfter === tenantLower) {
      const rest = afterLocale.slice(1)
      const url = req.nextUrl.clone()
      url.pathname = rest.length
        ? `/${locale}/${rest.join('/')}`
        : `/${locale}/`
      url.search = search
      url.hash = hash
      return NextResponse.redirect(url, 307)
    }

    // 3) Si intenta usar el slug de OTRO tenant → 404
    const isKnownTenantSlug = STATIC_TOP_LEVEL_SLUGS.has(firstAfter)
    if (isKnownTenantSlug && firstAfter !== tenantLower) {
      const url = req.nextUrl.clone()
      url.pathname = '/404'
      const res = NextResponse.rewrite(url)
      res.headers.set('Cache-Control', 'no-store')
      res.headers.set('X-Robots-Tag', 'noindex, nofollow')
      return res
    }

    // 4) Cualquier otra ruta /{locale}/algo...
    //    Se interpreta como página del tenant actual:
    //    patronbarandgrill.com/es/encuestas
    //      -> internamente /es/ElPatron/encuestas
    //    Si esa página no existe, Next devolverá 404 (lo que quieres).
    const url = req.nextUrl.clone()
    const rest = afterLocale.join('/')
    url.pathname = `/${locale}/${tenant}/${rest}`
    const reqHeaders = new Headers(req.headers)
    reqHeaders.set('x-tenant', tenant)
    reqHeaders.set('x-locale', locale)
    return NextResponse.rewrite(url, { request: { headers: reqHeaders } })
  }

  // === Sin locale visible: decide locale y redirige a /{locale}/… ===
  const locale = pathname === '/' ? pickLocale(req) : DEFAULT_LOCALE

  // kill-switch en destino (para la ruta con locale)
  const candidatePath = `/${locale}${pathname}`
  if (!isAdminOrWip(candidatePath)) {
    const enabled = await websiteEnabled()
    if (!enabled) {
      const url = req.nextUrl.clone()
      url.pathname = `/${locale}/wip`
      url.searchParams.set('from', pathname)
      const res = NextResponse.redirect(url, 307)
      res.headers.set('Cache-Control', 'no-store')
      res.headers.set('X-Robots-Tag', 'noindex, nofollow')
      return res
    }
  }

  const url = req.nextUrl.clone()
  url.pathname = `/${locale}${pathname}`
  url.search = search
  url.hash = hash

  const res = NextResponse.redirect(url)
  res.headers.set('Vary', 'Accept-Language')
  return res
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
}
