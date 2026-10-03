import { NextRequest, NextResponse } from 'next/server';
import { claraDb } from '@/lib/db';
import { ProjectEvent, USER_PERSONAS } from '@/types';

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
    const activeUser = USER_PERSONAS[activePersonaId] || USER_PERSONAS.BUDI;

    if (body.type === 'MILESTONE_COMPLETED') {
      if (!body.milestoneId) {
        return NextResponse.json(
          { success: false, error: 'Pilih milestone yang diselesaikan (milestoneId wajib diisi).' },
          { status: 400 }
        );
      }
      const target = project.agreementBaseline?.milestones?.find((m) => m.id === body.milestoneId);
      if (!target) {
        return NextResponse.json({ success: false, error: 'Milestone tidak ditemukan pada acuan proyek.' }, { status: 404 });
      }
      if (target.status === 'COMPLETED') {
        return NextResponse.json(
          { success: false, error: 'Milestone ini sudah ditandai selesai sebelumnya.' },
          { status: 409 }
        );
      }
    }

    const newEvent: ProjectEvent = {
      id: `EVT-${Date.now()}`,
      projectId: id,
      type: body.type || 'REVISION_LOGGED',
      title: body.title,
      description: body.description,
      date: body.date || new Date().toISOString().split('T')[0],
      author: `${activeUser.name} (${activeUser.roleTitle.split(' ')[0]})`,
      metadata: body.metadata,
    };

    project.events = project.events || [];
    project.events.unshift(newEvent);

    // If milestone completed
    if (body.type === 'MILESTONE_COMPLETED' && body.milestoneId) {
      const milestone = project.agreementBaseline?.milestones?.find((m) => m.id === body.milestoneId);
      if (milestone) {
        milestone.status = 'COMPLETED';
        milestone.completionDate = newEvent.date;
      }

      // Recalculate billableValue
      const completedMilestonesValue = (project.agreementBaseline?.milestones || [])
        .filter((m) => m.status === 'COMPLETED')
        .reduce((sum, m) => sum + m.value, 0);

      project.billableValue = completedMilestonesValue;
    }

    // If revision logged, increment activeRevisionCount
    if (body.type === 'REVISION_LOGGED') {
      project.activeRevisionCount = (project.activeRevisionCount || 0) + 1;
    }

    claraDb.saveProject(project);

    return NextResponse.json({
      success: true,
      data: project,
      message: 'Event proyek berhasil dicatat ke SQLite.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
