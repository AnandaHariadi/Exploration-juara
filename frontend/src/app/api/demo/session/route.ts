export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { claraDb } from '@/lib/db';
import { ok, oneOf, readJson, route } from '@/lib/api';
import { currentDemoPersona, DEMO_PERSONA_COOKIE } from '@/lib/demoPersona';

const session = () => ({ activePersonaId: currentDemoPersona(), mode: 'demo', label: 'Mode Demo CLARA' });

export const GET = route('GET /api/demo/session', async () => {
  await claraDb.pullFromSupabase();
  return ok(session());
});

export const POST = route('POST /api/demo/session', async (req: NextRequest) => {
  const body = await readJson(req);
  const personaId = oneOf(body, 'personaId', ['BUDI', 'SITI', 'HENDRA', 'ADMIN'] as const);
  const response = ok({ ...session(), activePersonaId: personaId });
  response.cookies.set(DEMO_PERSONA_COOKIE, personaId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
});
