// app/providers/ThemeProviders.tsx
"use client";

import React from "react";
import StylesRuntimeProvider from "@/app/lib/styles/runtime";
import { useAppContext } from "@/context/AppContext";

type Alias = { light: string; dark: string };

type Props = {
  /** Opcional: si lo pasas, tiene prioridad. Si no, se deriva de Settings (regla de datos). */
  alias?: Alias;
  children: React.ReactNode;
};

export default function ThemeProviders({ alias, children }: Props) {
  const { Settings } = useAppContext();

  // Deriva alias desde Settings (única fuente de verdad), con fallback seguro
  const aliasFromSettings: Alias | undefined = React.useMemo(() => {
    const a = Settings?.website?.theme?.aliases;
    return a && typeof a.light === "string" && typeof a.dark === "string" ? a as Alias : undefined;
  }, [Settings]);

  const effectiveAlias = alias ?? aliasFromSettings;

  return (
    <StylesRuntimeProvider alias={effectiveAlias}>
      {children}
    </StylesRuntimeProvider>
  );
}
