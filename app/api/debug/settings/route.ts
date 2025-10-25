// app/api/debug/settings/route.ts
import { NextResponse } from 'next/server';
import { getSettingsEffective } from '@/complements/data/settingsFS';

export async function GET() {
  const s = await getSettingsEffective();
  return NextResponse.json({ effective: s, avatar: s?.agentAI?.avatar });
}
