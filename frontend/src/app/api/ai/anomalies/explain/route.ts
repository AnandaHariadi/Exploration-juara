export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { ok, readJson, route, str } from '@/lib/api';
import { explainAlert } from '@/lib/remediation';

/** Plain-language explanation of an alert. Numbers come from the engine, never from the AI. */
export const POST = route('POST /api/ai/anomalies/explain', async (req: NextRequest) => {
  const body = await readJson(req);
  return ok(await explainAlert(str(body, 'alertId', { required: true, max: 160 })));
});
