'use client';
import { useSearchParams } from 'next/navigation';

export default function Wip() {
  const sp = useSearchParams();
  const from = sp.get('from') || '/';

  // (Opcional) Timer 0s “por si acaso”
  // useEffect(() => { const t = setTimeout(() => router.replace(`/wip`), 0); return () => clearTimeout(t); }, []);

  return (
    <main className="min-h-dvh grid place-items-center p-8">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-semibold">Sitio en construcción</h1>
        <p className="opacity-80 text-sm">
          Estamos trabajando. Vuelve pronto.
        </p>
        <p className="opacity-60 text-xs">Intentaste visitar: <code>{from}</code></p>
      </div>
    </main>
  );
}
