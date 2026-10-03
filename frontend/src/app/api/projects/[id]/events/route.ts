export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { claraDb, makeCtx } from '@/lib/db';
import { ok, readJson, route } from '@/lib/api';
import { addMonitoringEvent } from '@/lib/domain';
import { projectIdFrom, type ProjectParams } from '@/lib/routeParams';

export const GET = route('GET /api/projects/[id]/events', async (_req: NextRequest, ctx: ProjectParams) => ok(claraDb.requireProject(await projectIdFrom(ctx)).events));

export const POST = route('POST /api/projects/[id]/events', async (req: NextRequest, ctx: ProjectParams) => {
  const id = await projectIdFrom(ctx);
  const body = await readJson(req);
  const mctx = makeCtx();
  const { project } = claraDb.mutate(id, (p) => addMonitoringEvent(p, body, mctx));
  return ok(project, 201);
});
