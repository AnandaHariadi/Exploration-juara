// Server-side document storage. Paths are built only from validated IDs; user
// file names never become filesystem paths.

import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
export const UPLOAD_DIR = path.join(dataDir, 'uploads');
export const SAMPLES_DIR = path.join(dataDir, 'samples');

export const SAMPLE_CONTRACT_FILE = 'Kontrak-PKS-ASL-2026-089.pdf';
export const SAMPLE_RAB_FILE = 'RAB-ASL-2026-089.csv';

/** Labelled demo documents downloadable from /api/demo/samples/[key]. */
export const SAMPLE_FILES = {
  contract: { name: SAMPLE_CONTRACT_FILE, type: 'application/pdf', label: 'Kontrak PKS contoh' },
  rab: { name: SAMPLE_RAB_FILE, type: 'text/csv', label: 'RAB contoh (CSV)' },
  'invoice-uat': { name: 'Invoice-ASL-UAT.pdf', type: 'application/pdf', label: 'Invoice termin UAT (sesuai kontrak)' },
  'invoice-tambahan': { name: 'Invoice-ASL-Tambahan.pdf', type: 'application/pdf', label: 'Invoice pekerjaan tambahan (mengandung anomali)' },
  'persetujuan-klien': { name: 'Persetujuan-Klien-CR-ASL.pdf', type: 'application/pdf', label: 'Surat persetujuan klien untuk perubahan' },
} as const;
export type SampleKey = keyof typeof SAMPLE_FILES;

export const MAX_CONTRACT_BYTES = 10 * 1024 * 1024;
export const MAX_RAB_BYTES = 2 * 1024 * 1024;

export const CONTRACT_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};
export const RAB_TYPES: Record<string, string> = { csv: 'text/csv' };

const SAFE_ID = /^[A-Za-z0-9_-]{1,80}$/;

function documentPath(projectId: string, documentId: string): string {
  if (!SAFE_ID.test(projectId) || !SAFE_ID.test(documentId)) throw new Error('ID dokumen tidak valid.');
  return path.join(UPLOAD_DIR, projectId, `${documentId}.bin`);
}

export function saveDocumentFile(projectId: string, documentId: string, data: Buffer): void {
  const target = documentPath(projectId, documentId);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, data);
}

export function readDocumentFile(projectId: string, documentId: string): Buffer | null {
  const target = documentPath(projectId, documentId);
  return fs.existsSync(target) ? fs.readFileSync(target) : null;
}

export function readSample(fileName: string): Buffer {
  if (!Object.values(SAMPLE_FILES).some((f) => f.name === fileName)) throw new Error('Unknown sample file.');
  return fs.readFileSync(path.join(SAMPLES_DIR, fileName));
}

export function clearUploads(): void {
  fs.rmSync(UPLOAD_DIR, { recursive: true, force: true });
}

export function extensionOf(fileName: string): string {
  return fileName.toLowerCase().split('.').pop() ?? '';
}
