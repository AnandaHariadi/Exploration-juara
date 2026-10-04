export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { claraDb, makeCtx } from '@/lib/db';
import { ok, route } from '@/lib/api';
import { confirmBaseline } from '@/lib/domain';
import { projectIdFrom, type ProjectParams } from '@/lib/routeParams';

/** Explicit human confirmation: the reviewed candidate becomes a new baseline version. */
export const POST = route('POST /api/projects/[id]/baseline/confirm', async (_req: NextRequest, ctx: ProjectParams) => {
  const id = await projectIdFrom(ctx);
  const mctx = makeCtx();
  const { project, result } = claraDb.mutate(id, (p) => confirmBaseline(p, mctx));
  return ok(project, 201, `Acuan proyek ${result.label} disetujui.`);
});
