// Verified project facts handed to the AI. Built only from confirmed baseline
// data and engine metrics, so the AI explains numbers it did not calculate.

import type { Project } from '@/types';
import { formatDay, idr } from './engine';

/** Plain-text summary of confirmed project data, sent as grounding context. */
export function projectContext(p: Project): string {
  const a = p.agreementBaseline;
  if (!p.metrics.hasBaseline) return `Proyek ${p.name} (${p.client}) belum memiliki acuan yang disetujui.`;
  const contractDoc = p.documents.find((d) => d.kind === 'CONTRACT');
  return [
    `Proyek: ${p.name} · Klien: ${p.client} · Nomor kontrak: ${a.contractNumber || '-'} · Acuan aktif: ${p.baselineVersion}`,
    `Nilai kontrak: ${idr(a.contractValue)} · Mulai: ${formatDay(a.startDate)} · Tenggat: ${formatDay(a.deadline)} · Batas revisi: ${a.revisionLimit}`,
    `Ketentuan pembayaran: ${a.paymentTerms || '-'}`,
    `Termin: ${a.milestones.map((m) => `${m.title} ${m.percentage}% (${idr(m.value)}) syarat: ${m.trigger ?? '-'}; status ${m.status}`).join(' | ')}`,
    `Ruang lingkup: ${a.scopeItems.map((s) => `${s.title}${s.status !== 'MATCH' ? ` [${s.status}]` : ''}`).join('; ')}`,
    `Klausul lain: ${a.clausesSummary.map((c) => c.description).join(' ') || '-'}`,
    ...Object.entries(a.sources ?? {}).map(([field, s]) => `Kutipan ${field}${s.page ? ` (hal. ${s.page})` : ''}: "${s.snippet}"`),
    `Kondisi saat ini: progres ${p.metrics.progress}%, biaya aktual ${idr(p.metrics.actualCost)} dari RAB ${idr(p.metrics.plannedCost)}, revisi ${p.metrics.actualRevisions}/${p.metrics.includedRevisions}, belum ditagih ${idr(p.metrics.unbilledValue)}.`,
    contractDoc ? `Dokumen sumber: ${contractDoc.fileName}` : '',
  ].filter(Boolean).join('\n');
}

/** Deterministic fact lines (numbers formatted exactly as drafts must quote them). */
export function baselineFacts(p: Project): string[] {
  const a = p.agreementBaseline;
  const m = p.metrics;
  const t = a.terms;
  const facts = [
    `Para pihak: ${p.client} (klien) dan pelaksana proyek ${p.name}`,
    `Nomor kontrak: ${a.contractNumber || '(tidak tercatat)'}`,
    `Acuan aktif: ${p.baselineVersion}`,
    `Nilai kontrak acuan ${p.baselineVersion}: ${idr(a.contractValue)}`,
    `Tenggat acuan ${p.baselineVersion}: ${formatDay(a.deadline)}`,
    `Batas revisi acuan ${p.baselineVersion}: ${a.revisionLimit} putaran`,
    `Revisi tercatat: ${m.actualRevisions} putaran`,
    `Progres pekerjaan: ${m.progress}%`,
    `Rencana biaya (RAB): ${idr(m.plannedCost)}; biaya aktual: ${idr(m.actualCost)}`,
    `Siap ditagih: ${idr(m.billableValue)}; sudah ditagih: ${idr(m.billedValue)}; belum ditagih: ${idr(m.unbilledValue)}`,
  ];
  if (t?.hourlyRate) facts.push(`Tarif pekerjaan tambahan menurut kontrak: ${idr(t.hourlyRate)} per jam`);
  if (t?.revisionUnitPrice) facts.push(`Biaya revisi tambahan menurut kontrak: ${idr(t.revisionUnitPrice)} per putaran`);
  if (t?.revisionExtensionDays) facts.push(`Tambahan waktu per adendum revisi menurut kontrak: ${t.revisionExtensionDays} hari`);
  if (t?.penaltyPerDayPercent) facts.push(`Denda keterlambatan: ${t.penaltyPerDayPercent.toLocaleString('id-ID')}% per hari, maksimal ${t.penaltyCapPercent ?? '-'}% nilai kontrak`);
  return facts;
}
