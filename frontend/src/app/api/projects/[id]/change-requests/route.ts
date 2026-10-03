export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { claraDb, makeCtx } from '@/lib/db';
import { ok, readJson, route } from '@/lib/api';
import { createChangeRequest } from '@/lib/domain';
import { projectIdFrom, type ProjectParams } from '@/lib/routeParams';

export const GET = route('GET /api/projects/[id]/change-requests', async (_req: NextRequest, ctx: ProjectParams) => ok(claraDb.requireProject(await projectIdFrom(ctx)).changeRequests));

export const POST = route('POST /api/projects/[id]/change-requests', async (req: NextRequest, ctx: ProjectParams) => {
  const id = await projectIdFrom(ctx);
  const body = await readJson(req);
  const mctx = makeCtx();
  const { project } = claraDb.mutate(id, (p) => createChangeRequest(p, body, mctx));
  return ok(project, 201);
});
