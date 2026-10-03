import { NextRequest, NextResponse } from 'next/server';
import { claraDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    let withSeed = true;
    try {
      const body = await req.json();
      if (body && body.withSeed === false) withSeed = false;
    } catch {
      // Body is optional; default reset restores the sample project
    }

    claraDb.resetDemoData(withSeed);

    return NextResponse.json({
      success: true,
      message: withSeed
        ? 'Data demo berhasil direset ke proyek contoh terverifikasi.'
        : 'Data demo berhasil dikosongkan untuk pengujian baru.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
