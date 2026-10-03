export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { claraDb } from '@/lib/db';
import { assertId, ok, route } from '@/lib/api';
import { acknowledgeAlert } from '@/lib/domain';

export const POST = route('POST /api/alerts/[id]/acknowledge', async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const alertId = assertId((await ctx.params).id, 'ID peringatan');
  const owner = claraDb.findAlertProject(alertId);
  const { project } = claraDb.mutate(owner.id, (p) => acknowledgeAlert(p, alertId));
  return ok(project.alerts.find((a) => a.id === alertId));
});
