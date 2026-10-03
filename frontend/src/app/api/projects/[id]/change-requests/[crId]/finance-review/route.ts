export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { claraDb, makeCtx } from '@/lib/db';
import { assertId, ok, readJson, route } from '@/lib/api';
import { financeReviewChangeRequest } from '@/lib/domain';
import type { ProjectChildParams } from '@/lib/routeParams';

/** Finance confirms the deterministic impact. Roles: SITI, ADMIN. */
export const POST = route('POST /api/projects/[id]/change-requests/[crId]/finance-review', async (req: NextRequest, ctx: ProjectChildParams<'crId'>) => {
  const { id, crId } = await ctx.params;
  const body = await readJson(req);
  const mctx = makeCtx();
  const { project } = claraDb.mutate(assertId(id, 'ID proyek'), (p) => financeReviewChangeRequest(p, assertId(crId, 'ID permintaan perubahan'), body, mctx));
  return ok(project);
});
