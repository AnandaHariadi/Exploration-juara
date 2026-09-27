import { NextRequest, NextResponse } from "next/server";
import { payInstallment } from "@/db/repository";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const method = body.method || "QRIS";

    const result = payInstallment(id, method);
    if (!result.success) {
      return NextResponse.json({ error: "Termin tidak ditemukan atau sudah lunas." }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Pembayaran berhasil diverifikasi via simulasi Xendit Webhook.",
      invoice: result.invoice,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Gagal memproses pembayaran" }, { status: 500 });
  }
}
