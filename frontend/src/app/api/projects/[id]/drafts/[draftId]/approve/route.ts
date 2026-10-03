export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { claraDb, makeCtx } from '@/lib/db';
import { assertId, ok, readJson, route } from '@/lib/api';
import { approveDraft } from '@/lib/domain';
import type { ProjectChildParams } from '@/lib/routeParams';

/** Human approval: the draft becomes ready to send. Nothing is sent automatically. */
export const POST = route('POST /api/projects/[id]/drafts/[draftId]/approve', async (req: NextRequest, ctx: ProjectChildParams<'draftId'>) => {
  const { id, draftId } = await ctx.params;
  const body = await readJson(req);
  void body;
  const mctx = makeCtx();
  const { project } = claraDb.mutate(assertId(id, 'ID proyek'), (p) => approveDraft(p, assertId(draftId, 'ID draf'), mctx));
  return ok(project);
});
