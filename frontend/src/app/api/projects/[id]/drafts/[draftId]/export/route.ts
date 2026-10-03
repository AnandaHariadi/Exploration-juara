export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { claraDb, makeCtx } from '@/lib/db';
import { assertId, conflict, route } from '@/lib/api';
import { findDraft, markDraftExported } from '@/lib/domain';
import { aiRenderPdf } from '@/lib/ai';
import type { ProjectChildParams } from '@/lib/routeParams';

/**
 * Export an APPROVED draft for sending. Returns a PDF (legacy CLARA renderer)
 * or, if the AI service is down, the Markdown text. CLARA does not deliver it.
 */
export const POST = route('POST /api/projects/[id]/drafts/[draftId]/export', async (_req: NextRequest, ctx: ProjectChildParams<'draftId'>) => {
  const { id, draftId } = await ctx.params;
  const projectId = assertId(id, 'ID proyek');
  const draft = findDraft(claraDb.requireProject(projectId), assertId(draftId, 'ID draf'));
  if (draft.status !== 'APPROVED' && draft.status !== 'EXPORTED') throw conflict('Hanya draf yang sudah disetujui manusia yang dapat diekspor untuk dikirim.', 'APPROVAL_REQUIRED');
  const safeName = draft.title.replace(/[^A-Za-z0-9 _-]/g, '').replace(/\s+/g, '-').slice(0, 60) || 'draf';
  let body: Uint8Array;
  let type = 'application/pdf';
  let name = `${safeName}.pdf`;
  try {
    body = new Uint8Array(await aiRenderPdf(draft.content));
  } catch {
    body = new TextEncoder().encode(draft.content);
    type = 'text/markdown; charset=utf-8';
    name = `${safeName}.md`;
  }
  const mctx = makeCtx();
  claraDb.mutate(projectId, (p) => markDraftExported(p, draft.id, mctx));
  return new NextResponse(body, { headers: { 'Content-Type': type, 'Content-Disposition': `attachment; filename="${name}"` } });
});
