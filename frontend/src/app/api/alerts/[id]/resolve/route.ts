export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { claraDb, makeCtx } from '@/lib/db';
import { assertId, ok, readJson, route } from '@/lib/api';
import { resolveAlert } from '@/lib/domain';

export const POST = route('POST /api/alerts/[id]/resolve', async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const alertId = assertId((await ctx.params).id, 'ID peringatan');
  const body = await readJson(req);
  const owner = claraDb.findAlertProject(alertId);
  const mctx = makeCtx();
  const { project } = claraDb.mutate(owner.id, (p) => resolveAlert(p, alertId, body, mctx));
  return ok(project.alerts.find((a) => a.id === alertId));
});
