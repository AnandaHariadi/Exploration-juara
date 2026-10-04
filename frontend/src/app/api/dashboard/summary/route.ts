export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { claraDb } from '@/lib/db';
import { ok, route } from '@/lib/api';

export const GET = route('GET /api/dashboard/summary', async () => {
  await claraDb.pullFromSupabase();
  return ok(claraDb.portfolioSummary());
});
