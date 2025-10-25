// complements/hooks/useEvents.ts
import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { FbDB } from "@/app/lib/services/firebase";

export interface EventItem {
  id: string;
  titulo: string;
  img: string;
  video?: string;
  fecha?: string;   // YYYY-MM-DD
  orden?: number;
  activo?: boolean;
}

// Helpers mínimos (no tocan estilos)
function todayInTZ(tz = "America/Toronto") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(new Date())
    .reduce<Record<string, string>>((a, p: any) => {
      a[p.type] = p.value;
      return a;
    }, {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

// placeholder 1x1 transparente para evitar src=""
const IMG_PLACEHOLDER =
  "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEA";

function pickImage(raw: any): string {
  if (raw?.img) return String(raw.img);
  if (raw?.coverUrl) return String(raw.coverUrl);
  const m = Array.isArray(raw?.media)
    ? raw.media.find((x: any) => x?.contentType?.startsWith("image/"))
    : null;
  if (m) {
    if (Array.isArray(m.resized) && m.resized.length) {
      const webp = m.resized.find((v: any) => v?.url?.endsWith(".webp"));
      return (webp?.url || m.resized[0]?.url || IMG_PLACEHOLDER) as string;
    }
    return String(m.url || IMG_PLACEHOLDER);
  }
  return IMG_PLACEHOLDER;
}

function pickVideo(raw: any): string | undefined {
  if (raw?.video) return String(raw.video);
  if (raw?.externalVideoUrl) return String(raw.externalVideoUrl);
  const m = Array.isArray(raw?.media)
    ? raw.media.find((x: any) => x?.contentType?.startsWith("video/"))
    : null;
  return m?.url ? String(m.url) : undefined;
}

export function useEvents() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const col = collection(FbDB, "events");
    const todayStr = todayInTZ();

    // Suscribimos a tres campos posibles y unimos resultados:
    //   - date >= hoy
    //   - fecha >= hoy
    //   - dateEnd >= hoy  (para eventos que duran hasta esa fecha)
    const unsubs: Array<() => void> = [];
    const byId = new Map<string, any>();

    const apply = () => {
      // Normaliza y ordena por la fecha más temprana disponible
      const rows = Array.from(byId.values()).map((raw: any) => {
        const fecha =
          (raw?.fecha as string) ??
          (raw?.date as string) ??
          (raw?.dateStart as string) ??
          undefined;

        const titulo =
          (raw?.titulo as string) ??
          (raw?.title as string) ??
          (raw?.artist as string) ?? // a veces guardas 'artist'
          (raw?.slug as string) ??
          "Evento";

        const item: EventItem = {
          id: raw.__id,
          titulo,
          img: pickImage(raw),
          video: pickVideo(raw),
          fecha,
          orden: raw?.orden,
          activo: raw?.activo,
        };
        return item;
      });

      rows.sort((a, b) => (a.fecha || "").localeCompare(b.fecha || ""));
      setEvents(rows);
      setLoading(false);
    };

    const addSnap = (snap: any) => {
      snap.forEach((d: any) => {
        const data = d.data();
        byId.set(d.id, { __id: d.id, ...data });
      });
      apply();
    };

    try {
      // date >= hoy
      unsubs.push(
        onSnapshot(
          query(col, where("date", ">=", todayStr), orderBy("date", "asc")),
          (s) => addSnap(s),
          (err) => setError(err.message)
        )
      );
    } catch {}

    try {
      // fecha >= hoy (por compatibilidad)
      unsubs.push(
        onSnapshot(
          query(col, where("fecha", ">=", todayStr), orderBy("fecha", "asc")),
          (s) => addSnap(s),
          (err) => setError(err.message)
        )
      );
    } catch {}

    try {
      // dateEnd >= hoy (eventos vigentes aunque ya hayan iniciado)
      unsubs.push(
        onSnapshot(
          query(col, where("dateEnd", ">=", todayStr), orderBy("dateEnd", "asc")),
          (s) => addSnap(s),
          (err) => setError(err.message)
        )
      );
    } catch {}

    return () => {
      unsubs.forEach((u) => u && u());
    };
  }, []);

  return { events, loading, error };
}
