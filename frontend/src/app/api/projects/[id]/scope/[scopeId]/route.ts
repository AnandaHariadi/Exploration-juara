export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { claraDb, makeCtx } from '@/lib/db';
import { assertId, ok, readJson, route } from '@/lib/api';
import { reviewScope } from '@/lib/domain';
import type { ProjectChildParams } from '@/lib/routeParams';

/** Human review of a task flagged as possible scope deviation. */
export const PATCH = route('PATCH /api/projects/[id]/scope/[scopeId]', async (req: NextRequest, ctx: ProjectChildParams<'scopeId'>) => {
  const { id, scopeId } = await ctx.params;
  const body = await readJson(req);
  const mctx = makeCtx();
  const { project } = claraDb.mutate(assertId(id, 'ID proyek'), (p) => reviewScope(p, assertId(scopeId, 'ID pekerjaan'), body, mctx));
  return ok(project);
});
