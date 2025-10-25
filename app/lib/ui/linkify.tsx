import React from "react";

// URL | email | teléfono | DIRECCIÓN (ES/EN) con cierre limpio
const re =
  /((?:https?:\/\/)?(?:www\.)?[a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s]*)?)|([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})|(\+?\d[\d\s().-]{7,}\d)|(((?:\d{1,5}\s+[A-Za-zÀ-ÿ0-9.'º°\-]+(?:\s+[A-Za-zÀ-ÿ0-9.'º°\-]+)*\s+(?:Calle|Cl\.?|Avenida|Av\.?|Boulevard|Blvd\.?|Calzada|Calz\.?|Prolongación|Prol\.?|Camino|Cno\.?|Carretera|Carr\.?|Autopista|Aut\.?|Pasaje|Pje\.?|Plaza|Plz\.?|Periférico|Perif\.?|Anillo|Diagonal|Diag\.?|Circuito|Cto\.?|Privada|Priv\.?|Eje|St(?:reet)?|Ave(?:nue)?|Rd|Road|Dr|Drive|Ct|Court|Ln|Lane|Way|Trail|Pl|Place|Pkwy|Parkway|Hwy|Highway)\b(?:\s+\w+)?(?:\s*(?:#|No\.?|Nº|Unit|Suite)\s*\w+)?(?:,\s*[A-Za-zÀ-ÿ.'\- \s]+?){0,3}(?:\s*[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d)?)(?=[,;:!?]|$)|(?:(?:Calle|Cl\.?|Avenida|Av\.?|Boulevard|Blvd\.?|Calzada|Calz\.?|Prolongación|Prol\.?|Camino|Cno\.?|Carretera|Carr\.?|Autopista|Aut\.?|Pasaje|Pje\.?|Plaza|Plz\.?|Periférico|Perif\.?|Anillo|Diagonal|Diag\.?|Circuito|Cto\.?|Privada|Priv\.?|Eje|St(?:reet)?|Ave(?:nue)?|Rd|Road|Dr|Drive|Ct|Court|Ln|Lane|Way|Trail|Pl|Place|Pkwy|Parkway|Hwy|Highway)\s+[A-Za-zÀ-ÿ0-9.'º°\-]+(?:\s+[A-Za-zÀ-ÿ0-9.'º°\-]+)*\s+\d{1,5}(?:\s*(?:#|No\.?|Nº|Unit|Suite)\s*\w+)?(?:,\s*[A-Za-zÀ-ÿ.'\- \s]+?){0,3}(?:\s*[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d)?)(?=[,;:!?]|$)))/gi;

function normalizeUrl(u: string) {
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${u}`;
}
function normalizeTel(t: string) {
  const digits = t.replace(/[^\d+]/g, "");
  return `tel:${digits}`;
}

// Recorta dirección al primer cierre razonable (coma, punto, fin)
function trimAddressSpan(s: string) {
  // corta justo antes del primer delimitador fuerte seguido de espacio/mayúscula o fin
  const m = s.match(/^[^.;:!?]+(?:\.[A-Za-z]\.)*[^.;:!?]*(?=[,;:!?]|$)/);
  if (m) return m[0].trim();
  return s.replace(/[.,;:!?]+$/, "").trim();
}

function mapsQueryHref(addr: string) {
  const a = addr.replace(/[ \t]+/g, " ").trim();
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a)}`;
}

export function renderWithLinks(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    const [match] = m;
    const i = m.index;
    if (i > last) out.push(text.slice(last, i));

    if (m[1]) {
      // URL
      out.push(
        <a key={`${i}-u`} href={normalizeUrl(match)} target="_blank" rel="noopener noreferrer">
          {match}
        </a>
      );
    } else if (m[2]) {
      // Email
      out.push(
        <a key={`${i}-e`} href={`mailto:${match}`}>
          {match}
        </a>
      );
    } else if (m[3]) {
      // Teléfono
      out.push(
        <a key={`${i}-t`} href={normalizeTel(match)}>
          {match}
        </a>
      );
    } else if (m[4]) {
      // Dirección → solo ancla la parte recortada; reinyecta lo demás como texto
      const trimmed = trimAddressSpan(match);
      out.push(
        <a key={`${i}-a`} href={mapsQueryHref(trimmed)} target="_blank" rel="noopener noreferrer">
          {trimmed}
        </a>
      );
      if (trimmed.length < match.length) {
        out.push(match.slice(trimmed.length)); // texto sobrante sin link
      }
    }

    last = i + match.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
