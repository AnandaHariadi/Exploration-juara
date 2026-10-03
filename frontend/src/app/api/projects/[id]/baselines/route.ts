export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { claraDb } from '@/lib/db';
import { ok, route } from '@/lib/api';
import { projectIdFrom, type ProjectParams } from '@/lib/routeParams';

export const GET = route('GET /api/projects/[id]/baselines', async (_req: NextRequest, ctx: ProjectParams) => {
  const project = claraDb.requireProject(await projectIdFrom(ctx));
  return ok([...project.baselines].sort((a, b) => b.version - a.version));
});
