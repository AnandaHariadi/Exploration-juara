import { NextRequest, NextResponse } from 'next/server';
import { claraDb } from '@/lib/db';
import { ChangeRequest } from '@/types';

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
    const crCount = (project.changeRequests || []).length + 1;
    const match = (project.baselineVersion || 'V1.0').match(/^V?(\d+)/i);
    const currentVerNumber = match ? parseInt(match[1], 10) : 1;
    const nextVer = `V${currentVerNumber + 1}.0`;

    const newCR: ChangeRequest = {
      id: `CR-${Date.now()}`,
      projectId: id,
      crNumber: body.crNumber || `CR/${project.id}/${crCount.toString().padStart(3, '0')}`,
      title: body.title,
      description: body.description,
      reason: body.reason || 'Permintaan penambahan fitur di luar kesepakatan awal',
      additionalScope: Array.isArray(body.additionalScope) ? body.additionalScope : [body.additionalScope || 'Scope Tambahan'],
      additionalValue: Number(body.additionalValue) || 0,
      deadlineExtensionDays: Number(body.deadlineExtensionDays) || 0,
      status: 'PENDING',
      createdAt: new Date().toISOString().split('T')[0],
      resultingBaselineVersion: nextVer,
    };

    project.changeRequests = project.changeRequests || [];
    project.changeRequests.unshift(newCR);

    claraDb.saveProject(project);

    return NextResponse.json({
      success: true,
      data: project,
      changeRequest: newCR,
      message: 'Permintaan perubahan (Change Request) berhasil diajukan ke SQLite.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
