export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { claraDb } from '@/lib/db';
import { ok, route } from '@/lib/api';

/** Restore the deterministic demo dataset. Idempotent: every call yields the same state. */
export const POST = route('POST /api/demo/reset', async () => {
  claraDb.resetDemoData();
  return ok(claraDb.portfolioSummary(), 200, 'Data demo dikembalikan ke kondisi awal.');
});
