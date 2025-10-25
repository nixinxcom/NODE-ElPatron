// app/lib/styles/aliases.ts
import { loadSettingsSSR } from "@/app/lib/settings/server";

/** Lee Settings (seed+FS) y devuelve alias para los slots light/dark */
export async function resolveThemeAliasesServer(): Promise<{ light: string; dark: string }> {
  const settings = await loadSettingsSSR(); // mismo patrón que branding/server.ts
  // 1) Preferir theme.aliases si existe
  const fromAliases = settings?.theme?.aliases;
  if (fromAliases?.light || fromAliases?.dark) {
    return {
      light: fromAliases?.light || "light",
      dark:  fromAliases?.dark  || "dark",
    };
  }
  // 2) O usar seasonLight/seasonDark si es tu convención
  const seasonLight = settings?.theme?.seasonLight;
  const seasonDark  = settings?.theme?.seasonDark;
  return {
    light: seasonLight || "light",
    dark:  seasonDark  || "dark",
  };
}
