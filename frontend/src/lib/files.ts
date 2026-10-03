// Server-side document storage. Paths are built only from validated IDs; user
// file names never become filesystem paths.

import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
export const UPLOAD_DIR = path.join(dataDir, 'uploads');
export const SAMPLES_DIR = path.join(dataDir, 'samples');

export const SAMPLE_CONTRACT_FILE = 'Kontrak-PKS-ASL-2026-089.pdf';
export const SAMPLE_RAB_FILE = 'RAB-ASL-2026-089.csv';

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

export function readSample(fileName: typeof SAMPLE_CONTRACT_FILE | typeof SAMPLE_RAB_FILE): Buffer {
  return fs.readFileSync(path.join(SAMPLES_DIR, fileName));
}

export function clearUploads(): void {
  fs.rmSync(UPLOAD_DIR, { recursive: true, force: true });
}

export function extensionOf(fileName: string): string {
  return fileName.toLowerCase().split('.').pop() ?? '';
}
