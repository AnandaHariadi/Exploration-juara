export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { claraDb, makeCtx } from '@/lib/db';
import { assertId, ok, readJson, route } from '@/lib/api';
import { decideDocument } from '@/lib/domain';
import type { ProjectChildParams } from '@/lib/routeParams';

/** Human decision on an analyzed document: { decision: APPROVED | REJECTED, note }. Rejected documents stop producing findings. */
export const POST = route('POST /api/projects/[id]/documents/[docId]/decision', async (req: NextRequest, ctx: ProjectChildParams<'docId'>) => {
  const { id, docId } = await ctx.params;
  const body = await readJson(req);
  const mctx = makeCtx();
  const { project } = claraDb.mutate(assertId(id, 'ID proyek'), (p) => decideDocument(p, assertId(docId, 'ID dokumen'), body, mctx));
  return ok(project);
});
