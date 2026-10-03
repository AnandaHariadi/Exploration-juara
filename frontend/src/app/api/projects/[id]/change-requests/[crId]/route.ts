export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { claraDb, makeCtx } from '@/lib/db';
import { assertId, ok, readJson, route } from '@/lib/api';
import { updateChangeRequest } from '@/lib/domain';
import type { ProjectChildParams } from '@/lib/routeParams';

/** PIC edits a draft or rejected change request before (re)submitting. */
export const PATCH = route('PATCH /api/projects/[id]/change-requests/[crId]', async (req: NextRequest, ctx: ProjectChildParams<'crId'>) => {
  const { id, crId } = await ctx.params;
  const body = await readJson(req);
  const mctx = makeCtx();
  const { project } = claraDb.mutate(assertId(id, 'ID proyek'), (p) => updateChangeRequest(p, assertId(crId, 'ID permintaan perubahan'), body, mctx));
  return ok(project);
});
