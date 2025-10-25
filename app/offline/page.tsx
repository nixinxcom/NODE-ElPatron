"use client";
import Link from "next/link";
import { FormattedMessage, useIntl } from "react-intl";
import FM from "@/complements/i18n/FM";

export default function OfflinePage() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-6 text-center">
      <div>
        <h1 className="text-2xl font-semibold mb-2">
          <FM id="offline.title" defaultMessage="Estás sin conexión" />
        </h1>
        <p className="mb-6 opacity-80">
          <FM id="offline.description" defaultMessage="Algunas funciones requieren internet. Intenta de nuevo cuando tengas señal." />
        </p>
        <div className="flex items-center gap-3 justify-center">
          <button onClick={() => location.reload()} className="px-4 py-2 rounded-md bg-black text-white">
            <FM id="offline.retry" defaultMessage="Reintentar" />
          </button>
          <Link href="/menus" className="px-4 py-2 rounded-md border">
            <FM id="offline.menu" defaultMessage="Ver menú" />
          </Link>
        </div>
      </div>
    </main>
  );
}