import { NextRequest, NextResponse } from 'next/server';
import { claraDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projects = claraDb.getProjects();

    let found = false;
    for (const p of projects) {
      const alert = p.alerts?.find((a) => a.id === id);
      if (alert) {
        alert.status = 'ACKNOWLEDGED';
        claraDb.saveProject(p);
        found = true;
        break;
      }
    }

    if (!found) {
      return NextResponse.json({ success: false, error: 'Alert not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Alert acknowledged.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
