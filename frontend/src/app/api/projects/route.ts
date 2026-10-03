import { NextRequest, NextResponse } from 'next/server';
import { claraDb } from '@/lib/db';
import { Project } from '@/types';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const projects = claraDb.getProjects();
    return NextResponse.json({ success: true, data: projects });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const newProject: Project = await req.json();

    if (!newProject.id || !newProject.name) {
      return NextResponse.json(
        { success: false, error: 'Project ID and Name are required.' },
        { status: 400 }
      );
    }

    claraDb.saveProject(newProject);

    return NextResponse.json({
      success: true,
      data: newProject,
      message: 'Proyek baru berhasil disimpan ke database SQLite.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
