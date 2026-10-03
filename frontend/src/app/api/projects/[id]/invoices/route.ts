import { NextRequest, NextResponse } from 'next/server';
import { claraDb } from '@/lib/db';
import { InvoiceItem, USER_PERSONAS } from '@/types';

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
    const actor = USER_PERSONAS[claraDb.getActivePersona()] || USER_PERSONAS.SITI;
    const milestoneId = body.milestoneId;
    if (!milestoneId) {
      return NextResponse.json({ success: false, error: 'milestoneId wajib diisi.' }, { status: 400 });
    }

    const milestone = project.agreementBaseline?.milestones?.find((m) => m.id === milestoneId);

    if (!milestone) {
      return NextResponse.json({ success: false, error: 'Milestone not found in agreement baseline.' }, { status: 404 });
    }

    if (milestone.status !== 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'Milestone belum selesai diverifikasi, sehingga belum siap ditagih.' },
        { status: 409 }
      );
    }

    const alreadyInvoiced =
      milestone.billingStatus !== 'UNBILLED' ||
      (project.invoices || []).some((inv) => inv.milestoneId === milestone.id && inv.status !== 'DRAFT');
    if (alreadyInvoiced) {
      return NextResponse.json(
        { success: false, error: 'Milestone ini sudah ditagihkan. Tagihan ganda dicegah.' },
        { status: 409 }
      );
    }

    const invCount = (project.invoices || []).length + 1;
    const invNumber = `INV/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${project.id}-${invCount.toString().padStart(3, '0')}`;

    const newInvoice: InvoiceItem = {
      id: `INV-${Date.now()}`,
      invoiceNumber: invNumber,
      projectId: id,
      milestoneId: milestone.id,
      milestoneTitle: milestone.title,
      amount: milestone.value,
      status: 'SENT',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    };

    project.invoices = project.invoices || [];
    project.invoices.unshift(newInvoice);

    // Update milestone billing status
    milestone.billingStatus = 'INVOICED';
    milestone.invoiceId = newInvoice.id;

    // Recalculate billedValue
    project.billedValue = project.invoices
      .filter((inv) => inv.status !== 'DRAFT')
      .reduce((sum, inv) => sum + inv.amount, 0);

    // Log invoice event
    project.events = project.events || [];
    project.events.unshift({
      id: `EVT-${Date.now()}`,
      projectId: id,
      type: 'INVOICE_SENT',
      title: `Faktur Resmi Diterbitkan: ${invNumber}`,
      description: `Invoice termin ${milestone.title} senilai Rp ${milestone.value.toLocaleString('id-ID')} telah diterbitkan ke klien.`,
      date: newInvoice.issueDate,
      author: `${actor.name} (${actor.roleTitle.split(' ')[0]})`,
    });

    claraDb.saveProject(project);

    return NextResponse.json({
      success: true,
      data: project,
      invoice: newInvoice,
      message: 'Faktur invoice berhasil diterbitkan dan dicatat ke SQLite.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
