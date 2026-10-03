export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { claraDb, makeCtx } from '@/lib/db';
import { assertId, ok, route } from '@/lib/api';
import { recordInvoiceFromDocument } from '@/lib/domain';
import type { ProjectChildParams } from '@/lib/routeParams';

/** Record an analyzed invoice document as a project invoice (human action; entitlement rules apply). */
export const POST = route('POST /api/projects/[id]/documents/[docId]/record-invoice', async (_req: NextRequest, ctx: ProjectChildParams<'docId'>) => {
  const { id, docId } = await ctx.params;
  const mctx = makeCtx();
  const { project } = claraDb.mutate(assertId(id, 'ID proyek'), (p) => recordInvoiceFromDocument(p, assertId(docId, 'ID dokumen'), mctx));
  return ok(project, 201, 'Invoice dicatat dari dokumen.');
});
