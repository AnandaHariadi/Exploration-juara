export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { claraDb } from '@/lib/db';
import { ok, route } from '@/lib/api';
import { DEMO_PERSONA_COOKIE } from '@/lib/demoPersona';

/** Restore the deterministic demo dataset. Idempotent: every call yields the same state. */
export const POST = route('POST /api/demo/reset', async () => {
  claraDb.resetDemoData();
  const response = ok(claraDb.portfolioSummary(), 200, 'Data demo dikembalikan ke kondisi awal.');
  response.cookies.set(DEMO_PERSONA_COOKIE, 'BUDI', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
});
