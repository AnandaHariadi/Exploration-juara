import { NextRequest, NextResponse } from "next/server";
import { getInvoiceByToken } from "@/db/repository";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const data = getInvoiceByToken(token);
    if (!data) {
      return NextResponse.json({ error: "Invoice tidak ditemukan." }, { status: 404 });
    }
    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Gagal memuat invoice" }, { status: 500 });
  }
}
