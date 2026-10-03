export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { claraDb } from '@/lib/db';
import { ok, oneOf, readJson, route } from '@/lib/api';

const session = () => ({ activePersonaId: claraDb.getActivePersona(), mode: 'demo', label: 'Mode Demo CLARA' });

export const GET = route('GET /api/demo/session', async () => ok(session()));

export const POST = route('POST /api/demo/session', async (req: NextRequest) => {
  const body = await readJson(req);
  claraDb.setActivePersona(oneOf(body, 'personaId', ['BUDI', 'SITI', 'HENDRA', 'ADMIN'] as const));
  return ok(session());
});
