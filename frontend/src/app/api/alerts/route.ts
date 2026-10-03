import { NextResponse } from 'next/server';
import { claraDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const alerts = claraDb.getAllAlerts();
    return NextResponse.json({ success: true, data: alerts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
