import { NextResponse } from 'next/server';
import { claraDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const users = claraDb.getDemoUsers();
    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
