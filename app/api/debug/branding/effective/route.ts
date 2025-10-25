import { NextResponse, type NextRequest } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { FbDB } from "@/app/lib/services/firebase";
import { toShortLocale, DEFAULT_LOCALE_SHORT } from '@/app/lib/i18n/locale';

// SETTINGS (solo TSX)
import * as settingsSeedTsx from "@/seeds/settings";
import { getSettingsEffective } from "@/complements/data/settingsFS";

// BRANDING (solo TSX)
import * as brandingSeedTsx from "@/seeds/branding";
import { getBrandingEffectivePWA as getBrandingEffective } from "@/complements/data/brandingFS";

// STYLES (solo TSX)
import * as stylesSeedTsx from "@/seeds/styles";
import { getStylesEffective } from "@/complements/data/stylesFS";

// Evita cacheado del handler durante dev/SSR
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const scope = (url.searchParams.get("scope") as "settings" | "branding" | "styles") || "branding";
  const locale = toShortLocale(url.searchParams.get("locale") || DEFAULT_LOCALE_SHORT);

  try {
    if (scope === "settings") {
      const fsGlobal = await getDoc(doc(FbDB, "settings", "default"))
        .then((s) => (s.exists() ? s.data() : undefined));

      // getSettingsEffective ahora acepta locale para resolver FM en settings
      const effective = await getSettingsEffective(undefined, locale);

      return NextResponse.json({
        scope,
        locale,
        seedTsx: (settingsSeedTsx as any).default ?? settingsSeedTsx,
        fsGlobal,
        effective,
      });
    }

    if (scope === "branding") {
      const fsGlobal = await getDoc(doc(FbDB, "branding", "default"))
        .then((s) => (s.exists() ? s.data() : undefined));

      // ÚNICA colección i18n (doc por locale)
      const I18N_COLL = process.env.NEXT_PUBLIC_I18N_COLL || "i18n_global";

      const fsI18n = await getDoc(doc(FbDB, I18N_COLL, locale))
        .then((s) => (s.exists() ? s.data() : undefined));

      const effective = await getBrandingEffective(locale);

      return NextResponse.json({
        scope,
        locale,
        seedTsx: (brandingSeedTsx as any).default ?? brandingSeedTsx,
        fsGlobal,
        fsI18n,
        effective,
      });
    }

    if (scope === "styles") {
      const fsGlobal = await getDoc(doc(FbDB, "styles", "default"))
        .then((s) => (s.exists() ? s.data() : undefined));
      const effective = await getStylesEffective();

      return NextResponse.json({
        scope,
        seedTsx: (stylesSeedTsx as any).default ?? stylesSeedTsx,
        fsGlobal,
        effective,
      });
    }

    return NextResponse.json({ error: "scope inválido" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}