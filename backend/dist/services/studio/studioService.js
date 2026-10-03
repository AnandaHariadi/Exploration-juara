"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DRAFT_TYPE_LABEL = void 0;
exports.generateDraft = generateDraft;
exports.reviseDraft = reviseDraft;
exports.reviewDraft = reviewDraft;
exports.explainAnomaly = explainAnomaly;
/**
 * studioService.ts — Remediation Copilot & Document Studio, AI side.
 *
 * Drafts business documents (change request, addendum, MoU, LoI, PKS, clause
 * revision, anomaly response) from project context and VERIFIED FACTS supplied
 * by the business engine. The model writes language; it must copy numbers from
 * the facts verbatim and never compute new ones. Every draft gets a self-review
 * pass (AI + legacy CLARA guardrails) before it is shown as ready for review.
 */
const contractExtractionService_1 = require("../extraction/contractExtractionService");
const guardrailService_1 = require("../guardrail/guardrailService");
const env_1 = require("../../config/env");
exports.DRAFT_TYPE_LABEL = {
    CHANGE_REQUEST: "Permintaan Perubahan (Change Request)",
    ADDENDUM: "Adendum Perjanjian",
    MOU: "Memorandum of Understanding (MoU)",
    LOI: "Letter of Intent (LoI)",
    PKS: "Perjanjian Kerja Sama (PKS)",
    CLAUSE_REVISION: "Usulan Revisi Klausul",
    ANOMALY_RESPONSE: "Tindak Lanjut Temuan",
};
const SYSTEM = `Anda adalah CLARA Document Studio, penyusun dokumen bisnis dan hukum untuk UMKM Indonesia.
Tulis dalam Bahasa Indonesia formal, dalam format Markdown (# judul, ## bagian, daftar bernomor bila perlu).
ATURAN WAJIB:
1. Semua angka (rupiah, persen, tanggal, jumlah revisi) HARUS disalin persis dari bagian FAKTA TERVERIFIKASI. Jangan menghitung atau mengarang angka baru.
2. Jangan menulis placeholder seperti [Nama], {{...}}, XXX, atau TBD. Bila informasi tidak tersedia, tulis "(akan dilengkapi para pihak)".
3. Jangan menyatakan pihak mana pun melanggar hukum atau melakukan penipuan.
4. Dokumen adalah DRAF untuk ditinjau manusia; jangan menyatakan sudah ditandatangani atau sudah dikirim.
5. Sertakan bagian "Dasar & Rujukan" yang menyebut sumber dari FAKTA (pasal kontrak, kegiatan, perhitungan).`;
function buildPrompt(input) {
    return [
        `JENIS DOKUMEN: ${exports.DRAFT_TYPE_LABEL[input.type]}`,
        input.title ? `JUDUL: ${input.title}` : "",
        input.projectContext ? `KONTEKS PROYEK:\n${input.projectContext}` : "",
        `FAKTA TERVERIFIKASI (salin angka persis):\n${input.facts.map((f) => `- ${f}`).join("\n")}`,
        input.originalClause ? `KLAUSUL ASLI:\n"${input.originalClause}"\nTulis: klausul asli, usulan klausul baru, alasan, dan rujukan.` : "",
        input.instructions ? `INSTRUKSI PENGGUNA:\n${input.instructions}` : "",
        "Tulis dokumen lengkap sekarang.",
    ].filter(Boolean).join("\n\n");
}
async function generateDraft(input) {
    console.log(`[AI] draft requested type=${input.type} facts=${input.facts.length}`);
    const result = await (0, contractExtractionService_1.model)(false, SYSTEM).generateContent(buildPrompt(input));
    const content = result.response.text().trim();
    if (!content)
        throw new Error("AI returned an empty draft.");
    console.log(`[AI] draft generated type=${input.type} chars=${content.length}`);
    return { content, engine: `Gemini ${env_1.env.GEMINI_MODEL}` };
}
async function reviseDraft(content, instruction, facts) {
    const prompt = `FAKTA TERVERIFIKASI (salin angka persis):\n${facts.map((f) => `- ${f}`).join("\n")}\n\nDRAF SAAT INI:\n${content}\n\nINSTRUKSI REVISI:\n${instruction}\n\nKembalikan dokumen lengkap yang sudah direvisi (Markdown), bukan penjelasan.`;
    const result = await (0, contractExtractionService_1.model)(false, SYSTEM).generateContent(prompt);
    const revised = result.response.text().trim();
    if (!revised)
        throw new Error("AI returned an empty revision.");
    console.log(`[AI] draft revised chars=${revised.length}`);
    return { content: revised, engine: `Gemini ${env_1.env.GEMINI_MODEL}` };
}
/** Second pass: AI consistency review + legacy guardrail checks on the draft text. */
async function reviewDraft(content, facts) {
    const issues = [];
    try {
        const report = await (0, guardrailService_1.runGuardrailChecks)(content);
        for (const c of report.checks.filter((x) => x.triggered)) {
            issues.push({ severity: c.severity === "CRITICAL" ? "BLOCKER" : c.severity === "WARNING" ? "WARNING" : "INFO", message: `${c.message} ${c.advice}`.trim(), origin: "GUARDRAIL" });
        }
    }
    catch {
        /* guardrails are best-effort */
    }
    const prompt = `Periksa DRAF terhadap FAKTA. Kembalikan JSON {"issues":[{"severity":"INFO"|"WARNING"|"BLOCKER","message":string}]}.
Laporkan: angka atau tanggal yang tidak sama dengan FAKTA, perubahan yang diminta tetapi tidak tercantum, klausul penting yang hilang, placeholder, pernyataan menuduh (pelanggaran/penipuan), atau klaim sudah ditandatangani/dikirim. Bila tidak ada masalah kembalikan {"issues":[]}.
FAKTA:\n${facts.map((f) => `- ${f}`).join("\n")}\n\nDRAF:\n${content}`;
    const result = await (0, contractExtractionService_1.model)(true).generateContent(prompt);
    try {
        const parsed = JSON.parse(result.response.text());
        for (const i of parsed.issues ?? []) {
            if (typeof i.message !== "string" || !i.message.trim())
                continue;
            const sev = i.severity === "BLOCKER" || i.severity === "WARNING" ? i.severity : "INFO";
            issues.push({ severity: sev, message: i.message.trim().slice(0, 400), origin: "AI" });
        }
    }
    catch {
        issues.push({ severity: "WARNING", message: "Tinjauan AI tidak dapat dibaca; periksa draf secara manual.", origin: "AI" });
    }
    console.log(`[AI] draft self-review issues=${issues.length}`);
    return { issues, engine: `Gemini ${env_1.env.GEMINI_MODEL}` };
}
async function explainAnomaly(input) {
    const prompt = `Jelaskan temuan berikut kepada pemilik usaha dalam 3 bagian singkat: "Apa yang terjadi", "Mengapa penting bagi bisnis", "Yang sebaiknya ditinjau". Maksimal 150 kata. Gunakan angka HANYA dari FAKTA TERVERIFIKASI. Jangan menyebut kerugian, pelanggaran, atau penipuan sebagai fakta; gunakan "potensi" atau "perlu ditinjau".
TEMUAN: ${input.title}
DESKRIPSI: ${input.description}
FAKTA TERVERIFIKASI:\n${input.facts.map((f) => `- ${f}`).join("\n")}
BUKTI:\n${input.evidence.map((e) => `- ${e}`).join("\n")}
${input.projectContext ? `KONTEKS PROYEK:\n${input.projectContext}` : ""}`;
    const result = await (0, contractExtractionService_1.model)(false, SYSTEM).generateContent(prompt);
    const explanation = result.response.text().trim();
    if (!explanation)
        throw new Error("AI returned an empty explanation.");
    console.log("[AI] anomaly explanation generated");
    return { explanation, engine: `Gemini ${env_1.env.GEMINI_MODEL}` };
}
//# sourceMappingURL=studioService.js.map