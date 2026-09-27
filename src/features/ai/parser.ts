import { InvoiceIntent } from "./types";

export function parseNaturalLanguageInvoice(text: string): InvoiceIntent {
  const lower = text.toLowerCase();
  
  // 1. Ekstrak Klien
  let clientName: string | null = null;
  const clientMatch = text.match(/(?:ke|klien|untuk|kepada)\s+([A-Za-z0-9\s._-]+?)(?=\s+(?:untuk|buat|jasa|sebesar|nominal|dp|termin|seharga|\d|,|$))/i);
  if (clientMatch) {
    clientName = clientMatch[1].trim();
  } else {
    // Fallback jika tidak ada kata 'ke'
    const fallbackWords = text.split(" ");
    if (fallbackWords.length > 2) {
      clientName = "Klien";
    }
  }

  // 2. Kategori Klien & Tone
  let clientCategory: "campus" | "agency" | "corporate" | "general" = "general";
  let tone: "casual_campus" | "professional_b2b" | "formal_corporate" = "professional_b2b";
  
  if (lower.includes("himatifa") || lower.includes("himpunan") || lower.includes("bem") || lower.includes("ukm") || lower.includes("kampus") || lower.includes("upn")) {
    clientCategory = "campus";
    tone = "casual_campus";
  } else if (lower.includes("cv") || lower.includes("pt") || lower.includes("agency") || lower.includes("organizer") || lower.includes("hosting") || lower.includes("studio")) {
    clientCategory = "agency";
    tone = "professional_b2b";
  } else if (lower.includes("pelindo") || lower.includes("pertamina") || lower.includes("petrokimia") || lower.includes("bumn")) {
    clientCategory = "corporate";
    tone = "formal_corporate";
  }

  // 3. Ekstrak Nominal Total
  let totalAmountIdr: number | null = null;
  // Contoh: 100k, 1.5jt, 2 juta, 500000, 500 ribu, 3,5jt
  const amountMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|jt|juta|mio|m)?\b/i);
  if (amountMatch) {
    let num = parseFloat(amountMatch[1].replace(",", "."));
    const unit = (amountMatch[2] || "").toLowerCase();
    
    if (unit === "k" || unit === "rb" || unit === "ribu") {
      num = num * 1000;
    } else if (unit === "jt" || unit === "juta" || unit === "mio" || unit === "m") {
      num = num * 1000000;
    }
    totalAmountIdr = Math.round(num);
  }

  // 4. Ekstrak Deskripsi Pekerjaan
  let description: string | null = null;
  const descMatch = text.match(/(?:untuk|buat|jasa|pengerjaan|pembuatan)\s+([A-Za-z0-9\s._-]+?)(?=\s*(?:,|\.|dp|termin|sebesar|\d+k|\d+jt|$))/i);
  if (descMatch) {
    description = descMatch[1].trim();
    // Capitalize first letter
    description = description.charAt(0).toUpperCase() + description.slice(1);
  } else {
    description = "Jasa Layanan Freelance";
  }

  // 5. Ekstrak Skema & DP/Termin
  let scheme: "full" | "dp" | "installment" | "unknown" = "full";
  let dpPercentage = 0;
  
  const dpMatch = text.match(/dp\s*(\d+)%/i);
  if (dpMatch) {
    scheme = "dp";
    dpPercentage = parseInt(dpMatch[1], 10);
  } else if (lower.includes("dp")) {
    scheme = "dp";
    dpPercentage = 50; // default DP 50%
  } else if (lower.includes("termin") || lower.includes("tahap") || lower.includes("milestone")) {
    scheme = "installment";
  }

  // 6. Hitung Nominal Installments
  const installments: Array<{
    label: string;
    percentage: number;
    amountIdr: number;
    dueDate?: string;
  }> = [];

  const total = totalAmountIdr || 0;

  if (scheme === "dp" && dpPercentage > 0 && dpPercentage < 100) {
    const dpAmount = Math.round((total * dpPercentage) / 100);
    const finalAmount = total - dpAmount;
    
    installments.push({
      label: `Termin 1 (DP ${dpPercentage}%)`,
      percentage: dpPercentage,
      amountIdr: dpAmount,
      dueDate: "Saat ini (Invoice Diterbitkan)",
    });

    installments.push({
      label: `Termin 2 (Pelunasan ${100 - dpPercentage}%)`,
      percentage: 100 - dpPercentage,
      amountIdr: finalAmount,
      dueDate: "14 hari setelah proyek selesai",
    });
  } else if (scheme === "installment") {
    const half = Math.round(total / 2);
    installments.push({
      label: "Termin 1 (Uang Muka 50%)",
      percentage: 50,
      amountIdr: half,
      dueDate: "Saat ini",
    });
    installments.push({
      label: "Termin 2 (Pelunasan 50%)",
      percentage: 50,
      amountIdr: total - half,
      dueDate: "Saat serah terima pekerjaan",
    });
  } else {
    installments.push({
      label: "Pelunasan Penuh (100%)",
      percentage: 100,
      amountIdr: total,
      dueDate: "Jatuh tempo 7 hari",
    });
  }

  // 7. Draft Pesan WhatsApp berdasarkan Tone
  let suggestedMessage = "";
  const clientDisplay = clientName || "Rekan";
  const formattedNominal = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(total);
  const dpDisplay = installments.length > 1 ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(installments[0].amountIdr) : formattedNominal;

  if (tone === "casual_campus") {
    suggestedMessage = `Halo rekan panitia ${clientDisplay}! 👋 Terlampir invoice untuk ${description} sebesar ${formattedNominal} (DP Termin 1: ${dpDisplay}). Detail tagihan dan pembayaran via QRIS bisa dicek di: {{INVOICE_LINK}}. Sukses dan semangat terus buat acaranya! 🙌`;
  } else if (tone === "formal_corporate") {
    suggestedMessage = `Yth. Manajemen ${clientDisplay}, bersama ini kami sampaikan tagihan resmi untuk ${description} dengan nilai ${formattedNominal}. Dokumen invoice dan saluran pembayaran resmi dapat diakses melalui tautan berikut: {{INVOICE_LINK}}. Atas perhatian dan kerja samanya kami ucapkan terima kasih.`;
  } else {
    suggestedMessage = `Halo Tim ${clientDisplay}, berikut kami lampirkan invoice untuk ${description} senilai ${formattedNominal} (Termin 1: ${dpDisplay}). Rincian pekerjaan dan opsi pembayaran dapat diakses melalui tautan resmi berikut: {{INVOICE_LINK}}. Terima kasih atas kerjasamanya! 🙏`;
  }

  return {
    clientName,
    clientCategory,
    description,
    totalAmountIdr,
    scheme,
    dpPercentage: dpPercentage > 0 ? dpPercentage : undefined,
    installments,
    tone,
    suggestedMessage,
    ambiguities: [],
  };
}
