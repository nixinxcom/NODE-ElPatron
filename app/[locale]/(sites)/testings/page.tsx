import { Suspense } from "react";
import AdSenseCard from "./AdSenseCard";

export default async function Page(
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;
  return (
    <Suspense fallback={null}>
      <AdSenseCard locale={locale} />
    </Suspense>
  );
}