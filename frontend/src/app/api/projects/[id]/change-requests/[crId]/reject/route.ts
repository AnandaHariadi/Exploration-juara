export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { claraDb, makeCtx } from '@/lib/db';
import { assertId, ok, readJson, route } from '@/lib/api';
import { rejectChangeRequest } from '@/lib/domain';
import type { ProjectChildParams } from '@/lib/routeParams';

export const POST = route('POST /api/projects/[id]/change-requests/[crId]/reject', async (req: NextRequest, ctx: ProjectChildParams<'crId'>) => {
  const { id, crId: rawCrId } = await ctx.params;
  const crId = assertId(rawCrId, 'ID permintaan perubahan');
  const body = await readJson(req);
  void body;
  const mctx = makeCtx();
  const { project } = claraDb.mutate(assertId(id, 'ID proyek'), (p) => rejectChangeRequest(p, crId, body, mctx));
  return ok(project);
});
