export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { claraDb, makeCtx } from '@/lib/db';
import { assertId, ok, readJson, route } from '@/lib/api';
import { recordClientApproval } from '@/lib/domain';
import type { ProjectChildParams } from '@/lib/routeParams';

/** Client approval evidence: { decision: APPROVED | REJECTED, reference, documentId? }. APPROVED creates the next baseline version. */
export const POST = route('POST /api/projects/[id]/change-requests/[crId]/client-approval', async (req: NextRequest, ctx: ProjectChildParams<'crId'>) => {
  const { id, crId } = await ctx.params;
  const body = await readJson(req);
  const mctx = makeCtx();
  const { project } = claraDb.mutate(assertId(id, 'ID proyek'), (p) => recordClientApproval(p, assertId(crId, 'ID permintaan perubahan'), body, mctx));
  return ok(project);
});
