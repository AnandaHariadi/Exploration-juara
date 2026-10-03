export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { ok, route } from '@/lib/api';
import { aiHealth } from '@/lib/ai';

export const GET = route('GET /api/ai/health', async () => ok(await aiHealth()));
