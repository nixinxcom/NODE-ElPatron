"use client";
import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

declare global { interface Window { dataLayer: any[] } }

export default function GTMProvider({ children }: { children?: React.ReactNode }) {
  const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!GTM_ID || typeof window === "undefined") return;

    // Construye la URL de página
    const qs = searchParams?.toString();
    const page_path = (pathname || "/") + (qs ? `?${qs}` : "");

    // Evita duplicados en la misma ruta
    if (lastPathRef.current === page_path) return;
    lastPathRef.current = page_path;

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "page_view",
      page_path,
      page_location: window.location.href,
      page_title: document?.title || "",
    });
  }, [pathname, searchParams, GTM_ID]);

  return <>{children}</>;
}