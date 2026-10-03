"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pdfService_1 = require("../services/drafter/pdfService");
const markdownDraft = `
# MoU Partnership
## Perjanjian Kerja Sama

Pihak Pertama: PT A
Pihak Kedua: PT B

**Ruang Lingkup**: Distribusi produk ABC.
**Nilai**: Rp 1.000.000
**Durasi**: 1 Tahun

Demikian perjanjian ini dibuat.
`;
try {
    const base64Pdf = (0, pdfService_1.generateDraftPdf)(markdownDraft);
    console.log("PDF generated successfully!");
    console.log("Base64 Length:", base64Pdf.length);
    // Verify it's a PDF
    const buffer = Buffer.from(base64Pdf, "base64");
    const header = buffer.toString("latin1", 0, 8);
    console.log("Header verify:", header === "%PDF-1.4" ? "PASS" : "FAIL (" + header + ")");
}
catch (e) {
    console.error("PDF generation failed:", e);
    process.exit(1);
}
//# sourceMappingURL=testPdf.js.map