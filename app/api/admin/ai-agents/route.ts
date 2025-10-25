// app/api/admin/ai-agents/route.ts
export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { handleGETCore, handlePUTCore, ENV_AGENT_ID } from './[agentId]/route';

export async function GET(req: NextRequest) {
  return handleGETCore(req, ENV_AGENT_ID);
}

export async function PUT(req: NextRequest) {
  return handlePUTCore(req, ENV_AGENT_ID);
}
