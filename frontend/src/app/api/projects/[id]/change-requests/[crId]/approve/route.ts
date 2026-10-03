import { NextRequest, NextResponse } from 'next/server';
import { claraDb } from '@/lib/db';
import { USER_PERSONAS } from '@/types';

export const runtime = 'nodejs';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; crId: string }> }
) {
  try {
    const { id, crId } = await params;
    const project = claraDb.getProject(id);

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found.' }, { status: 404 });
    }

    const cr = project.changeRequests?.find((c) => c.id === crId);
    if (!cr) {
      return NextResponse.json({ success: false, error: 'Change request not found.' }, { status: 404 });
    }

    if (cr.status !== 'PENDING') {
      return NextResponse.json(
        {
          success: false,
          error:
            cr.status === 'APPROVED'
              ? 'Permintaan perubahan ini sudah disetujui sebelumnya. Persetujuan ulang dicegah.'
              : `Permintaan perubahan berstatus ${cr.status} dan tidak dapat disetujui.`,
        },
        { status: 409 }
      );
    }

    const activePersonaId = claraDb.getActivePersona();
    const approver = USER_PERSONAS[activePersonaId] || USER_PERSONAS.HENDRA;

    cr.status = 'APPROVED';
    cr.approvedAt = new Date().toISOString().split('T')[0];

    // Bump baseline version
    const newVersion = cr.resultingBaselineVersion || 'V2.0';
    project.baselineVersion = newVersion;

    // Add additional value to contractValue
    if (cr.additionalValue > 0) {
      project.contractValue += cr.additionalValue;
      if (project.agreementBaseline) {
        project.agreementBaseline.contractValue += cr.additionalValue;
      }
    }

    // Append scopes if any
    if (cr.additionalScope && cr.additionalScope.length > 0) {
      cr.additionalScope.forEach((scopeTitle, idx) => {
        project.agreementBaseline?.scopeItems.push({
          id: `SCP-CR-${Date.now().toString().slice(-4)}-${idx + 1}`,
          title: scopeTitle,
          description: `Disahkan melalui adendum resmi ${cr.crNumber}`,
          category: 'CORE_FEATURE',
          status: 'APPROVED_CHANGE',
        });
      });
    }

    // Extend deadline if any
    if (cr.deadlineExtensionDays > 0 && project.endDate) {
      const currentEnd = new Date(project.endDate);
      currentEnd.setDate(currentEnd.getDate() + cr.deadlineExtensionDays);
      project.endDate = currentEnd.toISOString().split('T')[0];
      if (project.agreementBaseline) {
        project.agreementBaseline.deadline = project.endDate;
      }
    }

    // Log event
    project.events = project.events || [];
    project.events.unshift({
      id: `EVT-${Date.now()}`,
      projectId: id,
      type: 'CHANGE_REQUEST_APPROVED',
      title: `Adendum Disetujui: ${cr.crNumber} (${newVersion})`,
      description: `Perubahan scope resmi disahkan oleh ${approver.name} (${approver.roleTitle}). Baseline naik menjadi ${newVersion}.`,
      date: new Date().toISOString().split('T')[0],
      author: `${approver.name} (${approver.roleTitle.split(' ')[0]})`,
    });

    claraDb.saveProject(project);

    return NextResponse.json({
      success: true,
      data: project,
      message: `Change request disetujui. Acuan proyek dinaikkan ke ${newVersion}.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
