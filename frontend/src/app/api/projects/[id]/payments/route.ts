import { NextRequest, NextResponse } from 'next/server';
import { claraDb } from '@/lib/db';
import { USER_PERSONAS } from '@/types';

export const runtime = 'nodejs';

/**
 * Catat pembayaran lunas atas satu invoice.
 * Pembayaran parsial belum didukung oleh model data demo, sehingga nominal
 * (bila dikirim) harus sama dengan nilai invoice.
 */
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
    if (!body.invoiceId) {
      return NextResponse.json({ success: false, error: 'invoiceId wajib diisi.' }, { status: 400 });
    }

    const invoice = (project.invoices || []).find((inv) => inv.id === body.invoiceId);
    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice tidak ditemukan pada proyek ini.' }, { status: 404 });
    }

    if (invoice.status === 'PAID') {
      return NextResponse.json(
        { success: false, error: 'Invoice ini sudah tercatat lunas. Pembayaran ganda dicegah.' },
        { status: 409 }
      );
    }

    if (invoice.status === 'DRAFT') {
      return NextResponse.json(
        { success: false, error: 'Invoice masih draft dan belum dikirim, sehingga belum dapat dibayar.' },
        { status: 409 }
      );
    }

    if (body.amount !== undefined && Number(body.amount) !== invoice.amount) {
      return NextResponse.json(
        {
          success: false,
          error: `Nominal pembayaran harus sama dengan nilai invoice (Rp ${invoice.amount.toLocaleString('id-ID')}). Pembayaran parsial belum didukung.`,
        },
        { status: 400 }
      );
    }

    const actor = USER_PERSONAS[claraDb.getActivePersona()] || USER_PERSONAS.SITI;
    const paymentDate = body.paymentDate || new Date().toISOString().split('T')[0];

    invoice.status = 'PAID';
    invoice.paymentDate = paymentDate;

    const milestone = project.agreementBaseline?.milestones?.find((m) => m.id === invoice.milestoneId);
    if (milestone) milestone.billingStatus = 'PAID';

    // Sudah dibayar = jumlah invoice berstatus lunas
    project.paidValue = (project.invoices || [])
      .filter((inv) => inv.status === 'PAID')
      .reduce((sum, inv) => sum + inv.amount, 0);

    project.events = project.events || [];
    project.events.unshift({
      id: `EVT-${Date.now()}`,
      projectId: id,
      type: 'PAYMENT_RECEIVED',
      title: `Pembayaran Diterima: ${invoice.invoiceNumber}`,
      description: `Kas masuk Rp ${invoice.amount.toLocaleString('id-ID')} untuk ${invoice.milestoneTitle || 'invoice'} tercatat lunas.`,
      date: paymentDate,
      author: `${actor.name} (${actor.roleTitle.split(' ')[0]})`,
    });

    claraDb.saveProject(project);

    return NextResponse.json({
      success: true,
      data: project,
      message: 'Pembayaran berhasil dicatat. Invoice berstatus lunas.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
