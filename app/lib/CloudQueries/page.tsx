import type { Metadata } from "next";
import { buildMetadata } from "@/app/lib/seo/meta";
import { pageMeta } from "@/app/lib/seo/pages";
import CloudQueriesPage  from "./CloudQueriesPage"
import { Suspense } from "react";

// ⬇ Esto le da metadata a la home usando la config central
export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(pageMeta.home);
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CloudQueriesPage  />
    </Suspense>
  );
}