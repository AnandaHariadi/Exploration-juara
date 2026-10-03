// Labelled demo sample. Used only when the user explicitly picks "data contoh"
// instead of AI analysis. Every quoted snippet below is verbatim text from the
// sample PDF (data/samples/kontrak-demo.json), so its page references are real.

import spec from '../../data/samples/kontrak-demo.json';
import type { ExtractionCandidate, SourceRef } from '@/types';
import { EMPTY_TERMS } from '@/types';
import { parseRabCsv } from './rab';
import { readSample, SAMPLE_RAB_FILE, SAMPLE_CONTRACT_FILE } from './files';

function find(page: number, startsWith: string): string {
  const line = spec.pages[page - 1].find((l) => l.startsWith(startsWith));
  if (!line) throw new Error(`Sample snippet not found: ${startsWith}`);
  return line;
}

export function sampleCandidate(contractDocId: string, now: string): ExtractionCandidate {
  const ref = (page: number, startsWith: string): SourceRef => ({ documentId: contractDocId, page, snippet: find(page, startsWith), verified: true });
  const rab = parseRabCsv(readSample(SAMPLE_RAB_FILE).toString('utf8'));
  return {
    status: 'READY',
    source: 'SAMPLE',
    startedAt: now,
    completedAt: now,
    confidence: null,
    contract: {
      contractNumber: 'PKS/ASL/2026/089',
      title: 'Pengembangan Sistem Manajemen Armada',
      clientName: 'PT Astra Sahabat Logistik',
      contractValue: 120_000_000,
      startDate: '2026-08-01',
      deadline: '2026-11-30',
      revisionLimit: 3,
      paymentTerms: '25% setelah UAT diterima, 50% setelah go-live, 25% setelah masa garansi 30 hari. Tagihan dibayar maksimal 14 hari.',
      scope: ['Modul pelacakan armada berbasis GPS', 'Integrasi data telematika pengemudi', 'Dashboard dispatcher logistik', 'Pelatihan pengguna dan dokumentasi sistem'],
      obligations: ['Setiap tagihan dibayar paling lambat 14 hari kalender sejak invoice diterima.'],
      penalties: ['Denda keterlambatan 0,1% per hari, maksimal 5% dari nilai kontrak.'],
    },
    milestones: [
      { id: 'MLS-1', title: 'UAT diterima', percentage: 25, trigger: 'UAT diterima dan Berita Acara UAT ditandatangani', targetDate: null, source: ref(2, '4.1') },
      { id: 'MLS-2', title: 'Go-live produksi', percentage: 50, trigger: 'Sistem go-live di lingkungan produksi', targetDate: null, source: ref(2, '4.2') },
      { id: 'MLS-3', title: 'Akhir masa garansi', percentage: 25, trigger: 'Masa garansi 30 hari berakhir', targetDate: null, source: ref(2, '4.3') },
    ],
    rab: { items: rab.items, total: rab.total, sourceFile: SAMPLE_RAB_FILE, warnings: rab.warnings },
    terms: { hourlyRate: 500_000, revisionUnitPrice: 2_000_000, revisionExtensionDays: 5, penaltyPerDayPercent: 0.1, penaltyCapPercent: 5, paymentDueDays: 14 },
    sources: {
      hourlyRate: ref(3, 'Pekerjaan tambahan di luar'),
      revisionUnitPrice: ref(2, 'Setiap putaran revisi tambahan'),
      revisionExtensionDays: ref(2, 'Setiap adendum revisi'),
      penalty: ref(3, 'Keterlambatan penyelesaian'),
      contractNumber: ref(1, 'Nomor:'),
      contractValue: ref(1, 'Nilai kontrak keseluruhan'),
      startDate: ref(2, 'Pekerjaan dimulai'),
      deadline: ref(2, 'Pekerjaan dimulai'),
      revisionLimit: ref(2, 'Nilai kontrak sudah termasuk maksimal 3'),
      scope: ref(1, 'PIHAK KEDUA akan mengerjakan'),
    },
    risks: [
      {
        title: 'Denda keterlambatan',
        severity: 'MEDIUM',
        detail: 'Paparan maksimum 5% dari nilai kontrak (Rp6.000.000) bila pekerjaan terlambat. Ini paparan, bukan kerugian.',
        source: ref(3, 'Keterlambatan penyelesaian'),
      },
    ],
    warnings: ['Data contoh: nilai diisi dari dokumen contoh tanpa analisis AI. Periksa dan setujui secara manual.'],
    editedFields: [],
    extractionMeta: { sourceFile: SAMPLE_CONTRACT_FILE, pages: spec.pages.length, processedAt: now, engine: 'Data contoh (tanpa AI)', documentId: contractDocId },
  };
}

/** Empty candidate for fully manual entry when no AI result is wanted. */
export function manualCandidate(clientName: string, title: string, now: string, rabTotal: { items: ExtractionCandidate['rab']['items']; total: number | null; sourceFile?: string; warnings: string[] }): ExtractionCandidate {
  return {
    status: 'READY',
    source: 'MANUAL',
    startedAt: now,
    completedAt: now,
    confidence: null,
    contract: { contractNumber: '', title, clientName, contractValue: null, startDate: null, deadline: null, revisionLimit: null, paymentTerms: '', scope: [], obligations: [], penalties: [] },
    milestones: [],
    rab: rabTotal,
    sources: {},
    terms: { ...EMPTY_TERMS },
    risks: [],
    warnings: ['Isian manual: tidak ada dokumen yang dianalisis. Semua nilai berasal dari input pengguna.'],
    editedFields: [],
  };
}
