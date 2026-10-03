import { NextRequest, NextResponse } from 'next/server';
import { claraDb } from '@/lib/db';
import { UserPersonaId } from '@/types';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const activePersona = claraDb.getActivePersona();
    return NextResponse.json({
      success: true,
      data: {
        activePersonaId: activePersona,
        mode: 'demo',
        label: 'Mode Demo CLARA',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const persona = body.personaId as UserPersonaId;

    if (!['BUDI', 'SITI', 'HENDRA', 'ADMIN'].includes(persona)) {
      return NextResponse.json(
        { success: false, error: 'Invalid persona ID. Must be BUDI, SITI, HENDRA, or ADMIN.' },
        { status: 400 }
      );
    }

    claraDb.setActivePersona(persona);

    return NextResponse.json({
      success: true,
      data: {
        activePersonaId: persona,
        mode: 'demo',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
