export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { claraDb, makeCtx } from '@/lib/db';
import { assertId, ok, readJson, route } from '@/lib/api';
import { decideChangeRequest } from '@/lib/domain';
import type { ProjectChildParams } from '@/lib/routeParams';

/** Internal decision: { decision: APPROVE | REJECT, note }. Roles: HENDRA, ADMIN. Baseline unchanged. */
export const POST = route('POST /api/projects/[id]/change-requests/[crId]/decision', async (req: NextRequest, ctx: ProjectChildParams<'crId'>) => {
  const { id, crId } = await ctx.params;
  const body = await readJson(req);
  const mctx = makeCtx();
  const { project } = claraDb.mutate(assertId(id, 'ID proyek'), (p) => decideChangeRequest(p, assertId(crId, 'ID permintaan perubahan'), body, mctx));
  return ok(project);
});
