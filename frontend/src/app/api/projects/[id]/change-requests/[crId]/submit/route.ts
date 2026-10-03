export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { claraDb, makeCtx } from '@/lib/db';
import { assertId, ok, readJson, route } from '@/lib/api';
import { submitChangeRequest } from '@/lib/domain';
import type { ProjectChildParams } from '@/lib/routeParams';

/** PIC submits (or resubmits after rejection). Roles: BUDI, ADMIN. */
export const POST = route('POST /api/projects/[id]/change-requests/[crId]/submit', async (req: NextRequest, ctx: ProjectChildParams<'crId'>) => {
  const { id, crId } = await ctx.params;
  await readJson(req);
  const mctx = makeCtx();
  const { project } = claraDb.mutate(assertId(id, 'ID proyek'), (p) => submitChangeRequest(p, assertId(crId, 'ID permintaan perubahan'), mctx));
  return ok(project);
});
