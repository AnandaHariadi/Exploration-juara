import { NextRequest, NextResponse } from "next/server";
import { parseNaturalLanguageInvoice } from "@/features/ai/parser";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = body.prompt;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt percakapan wajib diisi." },
        { status: 400 }
      );
    }

    // Eksekusi parsing (bisa via Gemini API jika key diset, atau parser cerdas terstruktur)
    const result = parseNaturalLanguageInvoice(prompt);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Gagal memproses pesan AI." },
      { status: 500 }
    );
  }
}
