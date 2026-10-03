export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { claraDb } from '@/lib/db';
import { ok, readJson, route } from '@/lib/api';
import { updateProjectInfo } from '@/lib/domain';
import { projectIdFrom, type ProjectParams } from '@/lib/routeParams';

export const GET = route('GET /api/projects/[id]', async (_req: NextRequest, ctx: ProjectParams) => ok(claraDb.requireProject(await projectIdFrom(ctx))));

export const PATCH = route('PATCH /api/projects/[id]', async (req: NextRequest, ctx: ProjectParams) => {
  const id = await projectIdFrom(ctx);
  const body = await readJson(req);
  return ok(claraDb.mutate(id, (p) => updateProjectInfo(p, body)).project);
});

export const DELETE = route('DELETE /api/projects/[id]', async (_req: NextRequest, ctx: ProjectParams) => {
  const id = await projectIdFrom(ctx);
  claraDb.deleteProject(id);
  return ok({ id }, 200, 'Proyek dihapus.');
});
