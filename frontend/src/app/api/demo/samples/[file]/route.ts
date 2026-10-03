export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { notFound, route } from '@/lib/api';
import { readSample, SAMPLE_CONTRACT_FILE, SAMPLE_RAB_FILE } from '@/lib/files';

const SAMPLES = { contract: { name: SAMPLE_CONTRACT_FILE, type: 'application/pdf' }, rab: { name: SAMPLE_RAB_FILE, type: 'text/csv' } } as const;

/** Download the labelled sample contract (PDF) or RAB (CSV). */
export const GET = route('GET /api/demo/samples/[file]', async (_req, ctx: { params: Promise<{ file: string }> }) => {
  const { file } = await ctx.params;
  const sample = SAMPLES[file as keyof typeof SAMPLES];
  if (!sample) throw notFound('Berkas contoh tidak ditemukan.');
  return new NextResponse(new Uint8Array(readSample(sample.name)), {
    headers: { 'Content-Type': sample.type, 'Content-Disposition': `attachment; filename="${sample.name}"` },
  });
});
