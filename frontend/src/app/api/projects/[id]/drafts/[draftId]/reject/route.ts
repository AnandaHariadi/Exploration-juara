export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { claraDb, makeCtx } from '@/lib/db';
import { assertId, ok, readJson, route } from '@/lib/api';
import { rejectDraft } from '@/lib/domain';
import type { ProjectChildParams } from '@/lib/routeParams';

/** Reject a draft (kept in history). */
export const POST = route('POST /api/projects/[id]/drafts/[draftId]/reject', async (req: NextRequest, ctx: ProjectChildParams<'draftId'>) => {
  const { id, draftId } = await ctx.params;
  const body = await readJson(req);
  void body;
  const mctx = makeCtx();
  const { project } = claraDb.mutate(assertId(id, 'ID proyek'), (p) => rejectDraft(p, assertId(draftId, 'ID draf'), body, mctx));
  return ok(project);
});
