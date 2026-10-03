export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { claraDb } from '@/lib/db';
import { assertId, notFound, route } from '@/lib/api';
import { readDocumentFile } from '@/lib/files';
import type { ProjectChildParams } from '@/lib/routeParams';

/** Stream a stored document inline so evidence links (#page=N) open the source. */
export const GET = route('GET /api/projects/[id]/documents/[docId]', async (_req: NextRequest, ctx: ProjectChildParams<'docId'>) => {
  const { id, docId } = await ctx.params;
  const project = claraDb.requireProject(assertId(id, 'ID proyek'));
  const doc = project.documents.find((d) => d.id === assertId(docId, 'ID dokumen'));
  if (!doc) throw notFound('Dokumen tidak ditemukan.');
  const data = readDocumentFile(project.id, doc.id);
  if (!data) throw notFound('Berkas dokumen tidak ditemukan di penyimpanan.', 'FILE_MISSING');
  return new NextResponse(new Uint8Array(data), {
    headers: {
      'Content-Type': doc.mimeType === 'text/csv' ? 'text/plain; charset=utf-8' : doc.mimeType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(doc.fileName)}"`,
      'X-Content-Type-Options': 'nosniff',
    },
  });
});
