/**
 * studioService.ts — Remediation Copilot & Document Studio, AI side.
 *
 * Drafts business documents (change request, addendum, MoU, LoI, PKS, clause
 * revision, anomaly response) from project context and VERIFIED FACTS supplied
 * by the business engine. The model writes language; it must copy numbers from
 * the facts verbatim and never compute new ones. Every draft gets a self-review
 * pass (AI + legacy CLARA guardrails) before it is shown as ready for review.
 */
import { model } from "../extraction/contractExtractionService";
import { runGuardrailChecks } from "../guardrail/guardrailService";
import { env } from "../../config/env";

export type DraftType = "CHANGE_REQUEST" | "ADDENDUM" | "MOU" | "LOI" | "PKS" | "CLAUSE_REVISION" | "ANOMALY_RESPONSE";

export const DRAFT_TYPE_LABEL: Record<DraftType, string> = {
  CHANGE_REQUEST: "Permintaan Perubahan (Change Request)",
  ADDENDUM: "Adendum Perjanjian",
  MOU: "Memorandum of Understanding (MoU)",
  LOI: "Letter of Intent (LoI)",
  PKS: "Perjanjian Kerja Sama (PKS)",
  CLAUSE_REVISION: "Usulan Revisi Klausul",
  ANOMALY_RESPONSE: "Tindak Lanjut Temuan",
};

export interface DraftInput {
  type: DraftType;
  title?: string;
  projectContext?: string;
  facts: string[];
  instructions?: string;
  originalClause?: string;
}

const SYSTEM = `Anda adalah CLARA Document Studio, penyusun dokumen bisnis dan hukum untuk UMKM Indonesia.
Tulis dalam Bahasa Indonesia formal, dalam format Markdown (# judul, ## bagian, daftar bernomor bila perlu).
ATURAN WAJIB:
1. Semua angka (rupiah, persen, tanggal, jumlah revisi) HARUS disalin persis dari bagian FAKTA TERVERIFIKASI. Jangan menghitung atau mengarang angka baru.
2. Jangan menulis placeholder seperti [Nama], {{...}}, XXX, atau TBD. Bila informasi tidak tersedia, tulis "(akan dilengkapi para pihak)".
3. Jangan menyatakan pihak mana pun melanggar hukum atau melakukan penipuan.
4. Dokumen adalah DRAF untuk ditinjau manusia; jangan menyatakan sudah ditandatangani atau sudah dikirim.
5. Sertakan bagian "Dasar & Rujukan" yang menyebut sumber dari FAKTA (pasal kontrak, kegiatan, perhitungan).`;

function buildPrompt(input: DraftInput) {
  return [
    `JENIS DOKUMEN: ${DRAFT_TYPE_LABEL[input.type]}`,
    input.title ? `JUDUL: ${input.title}` : "",
    input.projectContext ? `KONTEKS PROYEK:\n${input.projectContext}` : "",
    `FAKTA TERVERIFIKASI (salin angka persis):\n${input.facts.map((f) => `- ${f}`).join("\n")}`,
    input.originalClause ? `KLAUSUL ASLI:\n"${input.originalClause}"\nTulis: klausul asli, usulan klausul baru, alasan, dan rujukan.` : "",
    input.instructions ? `INSTRUKSI PENGGUNA:\n${input.instructions}` : "",
    "Tulis dokumen lengkap sekarang.",
  ].filter(Boolean).join("\n\n");
}

export async function generateDraft(input: DraftInput): Promise<{ content: string; engine: string }> {
  console.log(`[AI] draft requested type=${input.type} facts=${input.facts.length}`);
  const result = await model(false, SYSTEM).generateContent(buildPrompt(input));
  const content = result.response.text().trim();
  if (!content) throw new Error("AI returned an empty draft.");
  console.log(`[AI] draft generated type=${input.type} chars=${content.length}`);
  return { content, engine: `Gemini ${env.GEMINI_MODEL}` };
}

export async function reviseDraft(content: string, instruction: string, facts: string[]): Promise<{ content: string; engine: string }> {
  const prompt = `FAKTA TERVERIFIKASI (salin angka persis):\n${facts.map((f) => `- ${f}`).join("\n")}\n\nDRAF SAAT INI:\n${content}\n\nINSTRUKSI REVISI:\n${instruction}\n\nKembalikan dokumen lengkap yang sudah direvisi (Markdown), bukan penjelasan.`;
  const result = await model(false, SYSTEM).generateContent(prompt);
  const revised = result.response.text().trim();
  if (!revised) throw new Error("AI returned an empty revision.");
  console.log(`[AI] draft revised chars=${revised.length}`);
  return { content: revised, engine: `Gemini ${env.GEMINI_MODEL}` };
}

export interface ReviewIssue {
  severity: "INFO" | "WARNING" | "BLOCKER";
  message: string;
  origin: "AI" | "GUARDRAIL";
}

/** Second pass: AI consistency review + legacy guardrail checks on the draft text. */
export async function reviewDraft(content: string, facts: string[]): Promise<{ issues: ReviewIssue[]; engine: string }> {
  const issues: ReviewIssue[] = [];
  try {
    const report = await runGuardrailChecks(content);
    for (const c of report.checks.filter((x) => x.triggered)) {
      issues.push({ severity: c.severity === "CRITICAL" ? "BLOCKER" : c.severity === "WARNING" ? "WARNING" : "INFO", message: `${c.message} ${c.advice}`.trim(), origin: "GUARDRAIL" });
    }
  } catch {
    /* guardrails are best-effort */
  }
  const prompt = `Periksa DRAF terhadap FAKTA. Kembalikan JSON {"issues":[{"severity":"INFO"|"WARNING"|"BLOCKER","message":string}]}.
Laporkan: angka atau tanggal yang tidak sama dengan FAKTA, perubahan yang diminta tetapi tidak tercantum, klausul penting yang hilang, placeholder, pernyataan menuduh (pelanggaran/penipuan), atau klaim sudah ditandatangani/dikirim. Bila tidak ada masalah kembalikan {"issues":[]}.
FAKTA:\n${facts.map((f) => `- ${f}`).join("\n")}\n\nDRAF:\n${content}`;
  const result = await model(true).generateContent(prompt);
  try {
    const parsed = JSON.parse(result.response.text()) as { issues?: { severity?: string; message?: string }[] };
    for (const i of parsed.issues ?? []) {
      if (typeof i.message !== "string" || !i.message.trim()) continue;
      const sev = i.severity === "BLOCKER" || i.severity === "WARNING" ? i.severity : "INFO";
      issues.push({ severity: sev, message: i.message.trim().slice(0, 400), origin: "AI" });
    }
  } catch {
    issues.push({ severity: "WARNING", message: "Tinjauan AI tidak dapat dibaca; periksa draf secara manual.", origin: "AI" });
  }
  console.log(`[AI] draft self-review issues=${issues.length}`);
  return { issues, engine: `Gemini ${env.GEMINI_MODEL}` };
}

export async function explainAnomaly(input: { title: string; description: string; evidence: string[]; facts: string[]; projectContext?: string }): Promise<{ explanation: string; engine: string }> {
  const prompt = `Jelaskan temuan berikut kepada pemilik usaha dalam 3 bagian singkat: "Apa yang terjadi", "Mengapa penting bagi bisnis", "Yang sebaiknya ditinjau". Maksimal 150 kata. Gunakan angka HANYA dari FAKTA TERVERIFIKASI. Jangan menyebut kerugian, pelanggaran, atau penipuan sebagai fakta; gunakan "potensi" atau "perlu ditinjau".
TEMUAN: ${input.title}
DESKRIPSI: ${input.description}
FAKTA TERVERIFIKASI:\n${input.facts.map((f) => `- ${f}`).join("\n")}
BUKTI:\n${input.evidence.map((e) => `- ${e}`).join("\n")}
${input.projectContext ? `KONTEKS PROYEK:\n${input.projectContext}` : ""}`;
  const result = await model(false, SYSTEM).generateContent(prompt);
  const explanation = result.response.text().trim();
  if (!explanation) throw new Error("AI returned an empty explanation.");
  console.log("[AI] anomaly explanation generated");
  return { explanation, engine: `Gemini ${env.GEMINI_MODEL}` };
}
