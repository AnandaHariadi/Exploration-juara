import React from 'react';
import type { Alert, DocumentKind, DocumentStatus, DraftType, FindingBasis, GeneratedDocument } from '@/types';

export const alertTypeLabels: Record<Alert['type'], string> = {
  BILLING_VARIANCE: 'Tagihan',
  BUDGET_VARIANCE: 'Anggaran',
  SCOPE_VARIANCE: 'Ruang lingkup',
  REVISION_LIMIT: 'Revisi',
  DEADLINE_RISK: 'Tenggat',
  CONTRACT_RISK: 'Risiko kontrak',
  FINANCIAL_ANOMALY: 'Anomali keuangan',
  DOCUMENT_INCONSISTENCY: 'Inkonsistensi dokumen',
  POTENTIAL_IRREGULARITY: 'Pola perlu investigasi',
};

export const alertStatusLabels: Record<Alert['status'], string> = {
  NEW: 'Baru',
  ACKNOWLEDGED: 'Sudah dibaca · belum selesai',
  RESOLVED: 'Selesai',
  SUPERSEDED: 'Dijelaskan perubahan resmi',
};

const basisStyle: Record<FindingBasis, { label: string; className: string; title: string }> = {
  VERIFIED_CALCULATION: { label: 'Perhitungan terverifikasi', className: 'border-emerald-200 bg-emerald-50 text-emerald-800', title: 'Dihitung mesin rekonsiliasi dari data yang dikonfirmasi.' },
  AI_FINDING: { label: 'Temuan AI', className: 'border-indigo-200 bg-indigo-50 text-indigo-700', title: 'Interpretasi AI atas dokumen — perlu tinjauan manusia.' },
  USER_CONFIRMED: { label: 'Dicatat pengguna', className: 'border-zinc-200 bg-zinc-100 text-zinc-700', title: 'Berdasarkan data yang dicatat pengguna.' },
};

export function BasisBadge({ basis }: { basis: FindingBasis }) {
  const s = basisStyle[basis];
  return <span title={s.title} className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${s.className}`}>{s.label}</span>;
}

export const documentKindLabel: Record<DocumentKind, string> = {
  CONTRACT: 'Kontrak',
  RAB: 'RAB',
  INVOICE: 'Invoice',
  ADDENDUM: 'Adendum',
  CLIENT_APPROVAL: 'Bukti persetujuan klien',
  SUPPORTING: 'Dokumen pendukung',
};

const docStatus: Record<DocumentStatus, { label: string; className: string }> = {
  UPLOADED: { label: 'Diunggah', className: 'bg-zinc-100 text-zinc-700' },
  PROCESSING: { label: 'Sedang dianalisis', className: 'bg-blue-50 text-blue-700' },
  ANALYZED: { label: 'Dianalisis', className: 'bg-emerald-50 text-emerald-700' },
  NEEDS_REVIEW: { label: 'Perlu ditinjau', className: 'bg-amber-50 text-amber-800' },
  APPROVED: { label: 'Diterima', className: 'bg-emerald-100 text-emerald-800' },
  REJECTED: { label: 'Ditolak', className: 'bg-red-50 text-red-700' },
  FAILED: { label: 'Analisis gagal', className: 'bg-red-100 text-red-800' },
};

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  const s = docStatus[status];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.className}`}>{s.label}</span>;
}

export const draftTypeLabel: Record<DraftType, string> = {
  CHANGE_REQUEST: 'Permintaan perubahan',
  ADDENDUM: 'Adendum',
  MOU: 'MoU',
  LOI: 'LoI',
  PKS: 'PKS',
  CLAUSE_REVISION: 'Revisi klausul',
  ANOMALY_RESPONSE: 'Tindak lanjut temuan',
};

export const draftStatus: Record<GeneratedDocument['status'], { label: string; className: string }> = {
  NEEDS_FIX: { label: 'Perlu perbaikan', className: 'bg-amber-50 text-amber-800 border-amber-200' },
  READY_FOR_REVIEW: { label: 'Siap ditinjau manusia', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  APPROVED: { label: 'Disetujui · siap dikirim', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  EXPORTED: { label: 'Diekspor untuk dikirim', className: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  REJECTED: { label: 'Ditolak', className: 'bg-red-50 text-red-700 border-red-200' },
};
