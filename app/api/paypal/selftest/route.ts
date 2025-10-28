// app/api/paypal/selftest/route.ts
import { NextResponse } from "next/server";
import { paypalAuthTest, paypalEnvSummary } from "@/app/lib/paypal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const env = paypalEnvSummary();
  const test = await paypalAuthTest();
  return NextResponse.json({ ...env, ...test }, { status: 200 });
}
