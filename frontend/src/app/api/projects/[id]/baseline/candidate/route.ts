export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { claraDb } from '@/lib/db';
import { ok, readJson, route } from '@/lib/api';
import { updateCandidate, validateProjectCandidate } from '@/lib/domain';
import { projectIdFrom, type ProjectParams } from '@/lib/routeParams';

export const GET = route('GET /api/projects/[id]/baseline/candidate', async (_req: NextRequest, ctx: ProjectParams) => {
  const project = claraDb.requireProject(await projectIdFrom(ctx));
  const candidate = project.extraction;
  return ok({ candidate, validation: candidate && candidate.status === 'READY' ? validateProjectCandidate(project) : [] });
});

/** Save human corrections. Does not activate anything. */
export const PUT = route('PUT /api/projects/[id]/baseline/candidate', async (req: NextRequest, ctx: ProjectParams) => {
  const id = await projectIdFrom(ctx);
  const body = await readJson(req);
  const { project } = claraDb.mutate(id, (p) => updateCandidate(p, body));
  return ok({ project, validation: project.extraction ? validateProjectCandidate(project) : [] });
});
