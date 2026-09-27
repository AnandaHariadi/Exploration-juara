import { NextRequest, NextResponse } from "next/server";
import { getInvoices, createInvoiceFromDraft, getFinancialMetrics } from "@/db/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const invoices = getInvoices();
    const metrics = getFinancialMetrics();
    return NextResponse.json({ success: true, invoices, metrics });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Gagal mengambil data invoice" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const invoice = createInvoiceFromDraft(body);
    return NextResponse.json({ success: true, invoice });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Gagal membuat invoice" }, { status: 500 });
  }
}
