export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { notFound, route } from '@/lib/api';
import { readSample, SAMPLE_FILES } from '@/lib/files';

const SAMPLES = SAMPLE_FILES;

/** Download a labelled demo document (contract, RAB, invoices, client approval letter). */
export const GET = route('GET /api/demo/samples/[file]', async (_req, ctx: { params: Promise<{ file: string }> }) => {
  const { file } = await ctx.params;
  const sample = SAMPLES[file as keyof typeof SAMPLES];
  if (!sample) throw notFound('Berkas contoh tidak ditemukan.');
  return new NextResponse(new Uint8Array(readSample(sample.name)), {
    headers: { 'Content-Type': sample.type, 'Content-Disposition': `attachment; filename="${sample.name}"` },
  });
});
