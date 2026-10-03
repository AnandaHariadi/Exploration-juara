export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { claraDb } from '@/lib/db';
import { ok, route } from '@/lib/api';
import { projectIdFrom, type ProjectParams } from '@/lib/routeParams';

export const GET = route('GET /api/projects/[id]/summary', async (_req: NextRequest, ctx: ProjectParams) => {
  const p = claraDb.requireProject(await projectIdFrom(ctx));
  return ok({ projectId: p.id, name: p.name, client: p.client, status: p.status, ...p.metrics });
});
