// Document → baseline candidate orchestration. The result is always a
// candidate for human review; nothing here creates or changes a baseline.

import type { ExtractionCandidate, Project } from '@/types';
import { badRequest, conflict, HttpError } from './api';
import { claraDb, makeCtx } from './db';
import { latestDocument } from './domain';
import { readDocumentFile } from './files';
import { parseRabCsv } from './rab';
import { manualCandidate, sampleCandidate } from './samples';
import { aiExtractContract } from './ai';

export type ExtractionMode = 'AI' | 'SAMPLE' | 'MANUAL';

/** A PROCESSING marker older than this is treated as abandoned (e.g. server restart). */
const STALE_PROCESSING_MS = 5 * 60 * 1000;

function rabFromProject(project: Project): ExtractionCandidate['rab'] {
  const doc = latestDocument(project, 'RAB');
  if (!doc) return { items: [], total: null, warnings: ['RAB belum diunggah. Isi item RAB secara manual sebelum menyetujui acuan.'] };
  const file = readDocumentFile(project.id, doc.id);
  if (!file) return { items: [], total: null, sourceFile: doc.fileName, warnings: ['Berkas RAB tidak ditemukan di penyimpanan. Unggah ulang RAB.'] };
  try {
    const parsed = parseRabCsv(file.toString('utf8'));
    return { items: parsed.items, total: parsed.total, sourceFile: doc.fileName, warnings: parsed.warnings };
  } catch (error) {
    return { items: [], total: null, sourceFile: doc.fileName, warnings: [`RAB tidak dapat dibaca: ${error instanceof Error ? error.message : 'format tidak dikenali'}`] };
  }
}

export async function runExtraction(projectId: string, mode: ExtractionMode): Promise<Project> {
  const ctx = makeCtx();
  const started = claraDb.mutate(projectId, (project) => {
    if (project.baselines.length > 0) throw conflict('Acuan proyek sudah disetujui. Perubahan berikutnya melalui permintaan perubahan.', 'BASELINE_LOCKED');
    const running = project.extraction?.status === 'PROCESSING' && Date.now() - Date.parse(project.extraction.startedAt) < STALE_PROCESSING_MS;
    if (running) throw conflict('Analisis dokumen sedang berjalan. Tunggu hingga selesai.', 'EXTRACTION_IN_PROGRESS');
    const contract = latestDocument(project, 'CONTRACT');
    if (mode !== 'MANUAL' && !contract) throw badRequest('Unggah berkas kontrak terlebih dahulu.', 'CONTRACT_REQUIRED');
    if (mode === 'SAMPLE' && !contract?.isSample) throw badRequest('Data contoh hanya tersedia untuk berkas contoh. Gunakan analisis AI untuk berkas Anda.', 'NOT_SAMPLE');
    const placeholder = manualCandidate(project.client, project.name, ctx.now, { items: [], total: null, warnings: [] });
    project.extraction = { ...placeholder, status: 'PROCESSING', source: mode, completedAt: undefined, warnings: [] };
    return { contract, rab: rabFromProject(project) };
  });
  const { contract, rab } = started.result;

  let candidate: ExtractionCandidate;
  try {
    if (mode === 'MANUAL') {
      candidate = manualCandidate(started.project.client, started.project.name, ctx.now, rab);
    } else if (mode === 'SAMPLE') {
      candidate = sampleCandidate(contract!.id, ctx.now);
      candidate.rab = rab;
    } else {
      const file = readDocumentFile(projectId, contract!.id);
      if (!file) throw new HttpError(404, 'FILE_MISSING', 'Berkas kontrak tidak ditemukan di penyimpanan. Unggah ulang kontrak.');
      const result = await aiExtractContract(file, contract!.fileName, contract!.mimeType, contract!.id);
      candidate = {
        status: 'READY',
        source: 'AI',
        startedAt: ctx.now,
        completedAt: new Date().toISOString(),
        confidence: result.confidence,
        contract: {
          ...result.contract,
          title: result.contract.title || started.project.name,
          clientName: result.contract.clientName || started.project.client,
        },
        milestones: result.milestones,
        rab,
        sources: result.sources,
        risks: result.risks,
        warnings: [...(result.documentType === 'NOT_CONTRACT' ? ['Dokumen mungkin bukan kontrak. Periksa hasil dengan teliti.'] : []), ...result.warnings],
        editedFields: [],
        extractionMeta: result.extractionMeta,
      };
    }
  } catch (error) {
    const httpError = error instanceof HttpError ? error : new HttpError(500, 'EXTRACTION_FAILED', 'Analisis dokumen gagal. Coba lagi.');
    if (!(error instanceof HttpError)) console.error('[AI] extraction orchestration failed:', error instanceof Error ? error.message : error);
    claraDb.mutate(projectId, (project) => {
      if (project.extraction?.status === 'PROCESSING') {
        project.extraction = { ...project.extraction, status: 'FAILED', completedAt: new Date().toISOString(), error: { code: httpError.code, message: httpError.message } };
      }
    });
    throw httpError;
  }

  const finished = claraDb.mutate(projectId, (project) => {
    project.extraction = candidate;
    project.events.unshift({
      id: ctx.nextId('EVT'),
      projectId,
      type: 'EXTRACTION_COMPLETED',
      title: mode === 'AI' ? 'Analisis AI selesai — menunggu tinjauan' : mode === 'SAMPLE' ? 'Data contoh dimuat — menunggu tinjauan' : 'Isian manual dibuka',
      description: mode === 'AI' ? `${candidate.extractionMeta?.engine ?? 'CLARA AI'} · ${candidate.warnings.length} catatan untuk ditinjau.` : 'Belum menjadi acuan aktif sampai disetujui.',
      date: ctx.now.slice(0, 10),
      author: ctx.actor.label,
      createdAt: ctx.now,
    });
  });
  return finished.project;
}
