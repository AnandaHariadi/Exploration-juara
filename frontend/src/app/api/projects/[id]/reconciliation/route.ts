export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { claraDb } from '@/lib/db';
import { ok, route } from '@/lib/api';
import { projectIdFrom, type ProjectParams } from '@/lib/routeParams';

const view = (p: ReturnType<typeof claraDb.requireProject>) => ({ projectId: p.id, baselineVersion: p.metrics.baselineVersion, checks: p.reconciliation, metrics: p.metrics, alerts: p.alerts });

export const GET = route('GET /api/projects/[id]/reconciliation', async (_req: NextRequest, ctx: ProjectParams) => ok(view(claraDb.requireProject(await projectIdFrom(ctx)))));

/** Force a recompute (normally it runs after every mutation). */
export const POST = route('POST /api/projects/[id]/reconciliation', async (_req: NextRequest, ctx: ProjectParams) => {
  const id = await projectIdFrom(ctx);
  return ok(view(claraDb.mutate(id, () => undefined).project));
});
