export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { claraDb } from '@/lib/db';
import { ok, route } from '@/lib/api';

export const GET = route('GET /api/alerts', async () => ok(claraDb.getAllAlerts()));
