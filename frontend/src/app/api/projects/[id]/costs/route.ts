import { NextRequest, NextResponse } from 'next/server';
import { claraDb } from '@/lib/db';
import { ActualCostItem, USER_PERSONAS } from '@/types';

export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = claraDb.getProject(id);

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found.' }, { status: 404 });
    }

    const body = await req.json();
    const activePersonaId = claraDb.getActivePersona();
    const activeUser = USER_PERSONAS[activePersonaId] || USER_PERSONAS.SITI;

    const newCost: ActualCostItem = {
      id: `CST-${Date.now()}`,
      projectId: id,
      date: body.date || new Date().toISOString().split('T')[0],
      category: body.category || 'DEVELOPMENT',
      description: body.description || 'Pengeluaran operasional proyek',
      amount: Number(body.amount) || 0,
      invoiceRef: body.invoiceRef,
      submittedBy: activeUser.name,
    };

    project.actualCosts = project.actualCosts || [];
    project.actualCosts.unshift(newCost);

    // Recalculate total actualCost
    project.actualCost = project.actualCosts.reduce((sum, c) => sum + (c.amount || 0), 0);

    claraDb.saveProject(project);

    return NextResponse.json({
      success: true,
      data: project,
      message: 'Biaya riil proyek berhasil dicatat ke SQLite.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
