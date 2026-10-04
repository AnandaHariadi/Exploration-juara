// Document Guardian — the one owner of AI document orchestration.
//
// Every uploaded document is analyzed automatically (background, explicit
// states). Contracts before the baseline become a CANDIDATE for human review;
// invoices, addenda and approvals after the baseline become evidence that the
// deterministic engine cross-checks on every reconcile. Generated drafts are
// never re-analyzed, so there is no feedback loop.

import type { DocumentAnalysis, DocumentFinding, ExtractionCandidate, Project, ProjectDocument } from '@/types';
import { EMPTY_TERMS } from '@/types';
import { baselineAvailability } from './baseline';
import { badRequest, conflict, HttpError } from './api';
import { claraDb, makeCtx } from './db';
import { findDocument, latestDocument, supplementCandidate } from './domain';
import { getDocumentFile, readDocumentFile } from './files';
import { parseRabBuffer } from './rab';
import { manualCandidate, sampleCandidate } from './samples';
import { aiAnalyzeDocument, type NormalizedAnalysis } from './ai';
import { idr } from './engine';

export type ExtractionMode = 'AI' | 'SAMPLE' | 'MANUAL';

/** A PROCESSING marker older than this is treated as abandoned (e.g. server restart). */
const STALE_PROCESSING_MS = 5 * 60 * 1000;

const isRunning = (doc: ProjectDocument) => doc.status === 'PROCESSING' && Date.now() - Date.parse(doc.statusAt ?? doc.uploadedAt) < STALE_PROCESSING_MS;

function rabFromProject(project: Project): ExtractionCandidate['rab'] {
  const doc = latestDocument(project, 'RAB');
  if (!doc) return { items: [], total: null, warnings: ['RAB belum diunggah. Isi item RAB secara manual sebelum menyetujui acuan.'] };
  const file = readDocumentFile(project.id, doc.id);
  if (!file) return { items: [], total: null, sourceFile: doc.fileName, warnings: ['Berkas RAB tidak ditemukan di penyimpanan. Unggah ulang RAB.'] };
  try {
    const parsed = parseRabBuffer(file, doc.fileName);
    return { items: parsed.items, total: parsed.total, sourceFile: doc.fileName, warnings: parsed.warnings };
  } catch (error) {
    return { items: [], total: null, sourceFile: doc.fileName, warnings: [`RAB tidak dapat dibaca: ${error instanceof Error ? error.message : 'format tidak dikenali'}`] };
  }
}

function findingsFrom(result: NormalizedAnalysis): DocumentFinding[] {
  return result.risks.map((r, i) => ({
    id: `F${i + 1}`,
    title: r.title,
    detail: r.detail,
    severity: r.severity,
    basis: 'AI_FINDING' as const,
    origin: r.origin,
    source: r.source,
    legalBasis: r.legalBasis,
  }));
}

function toAnalysis(result: NormalizedAnalysis): DocumentAnalysis {
  return {
    analyzedAt: new Date().toISOString(),
    engine: result.extractionMeta.engine,
    detectedType: result.documentType,
    confidence: result.confidence,
    summary: result.summary,
    findings: findingsFrom(result),
    warnings: result.warnings,
    invoice: result.invoice ?? undefined,
    contract: { contractValue: result.contract.contractValue, deadline: result.contract.deadline, revisionLimit: result.contract.revisionLimit, contractNumber: result.contract.contractNumber || null },
    approval: result.approval ?? undefined,
    sources: result.sources,
    pages: result.extractionMeta.pages,
  };
}

function candidateFrom(project: Project, result: NormalizedAnalysis, rab: ExtractionCandidate['rab'], startedAt: string): ExtractionCandidate {
  return {
    status: 'READY',
    source: 'AI',
    startedAt,
    completedAt: new Date().toISOString(),
    confidence: result.confidence,
    contract: { ...result.contract, title: result.contract.title || project.name, clientName: result.contract.clientName || project.client },
    milestones: result.milestones,
    rab,
    sources: result.sources,
    terms: result.terms,
    risks: result.risks.map(({ origin: _origin, ...r }) => r),
    warnings: result.warnings,
    editedFields: [],
    extractionMeta: result.extractionMeta,
  };
}

const aiKind = (doc: ProjectDocument) => (doc.kind === 'INVOICE' ? 'INVOICE' : doc.kind === 'ADDENDUM' ? 'ADDENDUM' : doc.kind === 'CONTRACT' ? 'CONTRACT' : 'OTHER');

/**
 * Mark a document PROCESSING (synchronously, so double clicks are rejected) and
 * return the async job. Callers either await it or let it run in the background.
 */
export function startDocumentAnalysis(projectId: string, documentId: string): Promise<Project> {
  const ctx = makeCtx();
  const started = claraDb.mutate(projectId, (project) => {
    const doc = findDocument(project, documentId);
    if (isRunning(doc)) throw conflict('Dokumen ini sedang dianalisis. Tunggu hingga selesai.', 'DOCUMENT_PROCESSING');
    const preBaseline = project.baselines.length === 0;
    const active = project.baselines.find((version) => version.status === 'ACTIVE');
    if (doc.kind === 'CONTRACT' && active && baselineAvailability(active).agreement) throw conflict('Kesepakatan sudah menjadi acuan. Unggah adendum untuk perubahan.', 'BASELINE_LOCKED');
    doc.status = 'PROCESSING';
    doc.statusAt = ctx.now;
    doc.error = undefined;
    if (doc.kind === 'CONTRACT') {
      const placeholder = active ? supplementCandidate(project, ctx) : manualCandidate(project.client, project.name, ctx.now, { items: [], total: null, warnings: [] });
      project.extraction = { ...placeholder, status: 'PROCESSING', source: 'AI', completedAt: undefined, warnings: [] };
    }
    return { doc: { ...doc }, preBaseline };
  });
  const { doc } = started.result;
  return runAnalysis(projectId, doc, ctx.now);
}

async function runAnalysis(projectId: string, doc: ProjectDocument, startedAt: string): Promise<Project> {
  try {
    if (doc.kind === 'RAB') {
      const file = (await getDocumentFile(projectId, doc.id)) ?? readDocumentFile(projectId, doc.id);
      if (!file) throw new HttpError(404, 'FILE_MISSING', 'Berkas RAB tidak ditemukan. Unggah ulang.');
      const parsed = parseRabBuffer(file, doc.fileName);
      return claraDb.mutate(projectId, (project) => {
        const target = findDocument(project, doc.id);
        const active = project.baselines.find((version) => version.status === 'ACTIVE');
        const supplement = active && !baselineAvailability(active).budget;
        target.status = supplement ? 'NEEDS_REVIEW' : active ? 'APPROVED' : 'ANALYZED';
        target.statusAt = new Date().toISOString();
        target.analysis = {
          analyzedAt: new Date().toISOString(),
          engine: 'Parser RAB CLARA (deterministik, tanpa AI)',
          detectedType: 'RAB',
          confidence: null,
          summary: `${parsed.items.length} item RAB · total ${idr(parsed.total)}.`,
          findings: parsed.warnings.map((w, i) => ({ id: `W${i + 1}`, title: 'Catatan pembacaan RAB', detail: w, severity: 'LOW', basis: 'VERIFIED_CALCULATION', origin: 'ENGINE' })),
          warnings: parsed.warnings,
        };
        // Keep an unconfirmed candidate in sync with the latest RAB.
        if (supplement) {
          const candidate = supplementCandidate(project, makeCtx());
          candidate.rab = { items: parsed.items, total: parsed.total, sourceFile: doc.fileName, warnings: parsed.warnings };
          project.extraction = candidate;
        } else if (!active && project.extraction?.status === 'READY') {
          project.extraction.rab = rabFromProject(project);
        } else if (!active && !project.extraction) {
          project.extraction = manualCandidate(project.client, project.name, new Date().toISOString(), rabFromProject(project));
          project.extraction.warnings = parsed.warnings;
        }
      }).project;
    }

    const file = (await getDocumentFile(projectId, doc.id)) ?? readDocumentFile(projectId, doc.id);
    if (!file) throw new HttpError(404, 'FILE_MISSING', 'Berkas dokumen tidak ditemukan di penyimpanan. Unggah ulang.');
    const result = await aiAnalyzeDocument(file, doc.fileName, doc.mimeType, doc.id, aiKind(doc));
    const finished = claraDb.mutate(projectId, (project) => {
      const target = findDocument(project, doc.id);
      if (target.status !== 'PROCESSING') return; // superseded by a reset or another run
      target.analysis = toAnalysis(result);
      target.statusAt = new Date().toISOString();
      if (target.kind === 'CONTRACT') {
        target.status = 'NEEDS_REVIEW';
        const active = project.baselines.find((version) => version.status === 'ACTIVE');
        const rab = active ? supplementCandidate(project, makeCtx()).rab : rabFromProject(project);
        project.extraction = candidateFrom(project, result, rab, startedAt);
        project.events.unshift({
          id: makeCtx().nextId('EVT'),
          projectId,
          type: 'EXTRACTION_COMPLETED',
          title: 'CLARA selesai menganalisis kontrak — menunggu tinjauan',
          description: `${result.extractionMeta.engine} · ${result.milestones.length} termin · ${result.risks.length} temuan · ${result.warnings.length} catatan.`,
          date: target.statusAt.slice(0, 10),
          author: 'CLARA Document Guardian',
          createdAt: target.statusAt,
        });
      } else {
        target.status = target.kind === 'CLIENT_APPROVAL' || target.kind === 'SUPPORTING' ? 'ANALYZED' : 'NEEDS_REVIEW';
        project.events.unshift({
          id: makeCtx().nextId('EVT'),
          projectId,
          type: 'EXTRACTION_COMPLETED',
          title: `CLARA menganalisis ${target.fileName}`,
          description: result.summary || `Terdeteksi sebagai ${result.documentType}.`,
          date: target.statusAt.slice(0, 10),
          author: 'CLARA Document Guardian',
          createdAt: target.statusAt,
        });
      }
    }).project;
    console.log(`[AI] anomaly analysis completed project=${projectId} document=${doc.id} openAlerts=${finished.metrics.openAlerts}`);
    return finished;
  } catch (error) {
    const httpError = error instanceof HttpError ? error : new HttpError(500, 'ANALYSIS_FAILED', `Analisis dokumen gagal: ${error instanceof Error ? error.message : 'kesalahan tidak dikenal'}`);
    if (!(error instanceof HttpError)) console.error('[AI] analysis failed:', error instanceof Error ? error.message : error);
    claraDb.mutate(projectId, (project) => {
      const target = project.documents.find((d) => d.id === doc.id);
      if (target?.status === 'PROCESSING') {
        target.status = 'FAILED';
        target.statusAt = new Date().toISOString();
        target.error = { code: httpError.code, message: httpError.message };
      }
      if (doc.kind === 'CONTRACT' && project.extraction?.status === 'PROCESSING') {
        project.extraction = { ...project.extraction, status: 'FAILED', completedAt: new Date().toISOString(), error: { code: httpError.code, message: httpError.message } };
      }
    });
    throw httpError;
  }
}

/** Fire-and-forget variant for upload triggers. Failure is persisted on the document, never swallowed silently. */
export function analyzeInBackground(projectId: string, documentId: string) {
  try {
    startDocumentAnalysis(projectId, documentId).catch(() => undefined);
  } catch (error) {
    console.error('[AI] could not start analysis:', error instanceof Error ? error.message : error);
  }
}

/**
 * Baseline-candidate entry points used by the setup screen:
 *  AI     — (re)analyze the latest contract with AI;
 *  SAMPLE — labelled sample data for the sample contract (no AI);
 *  MANUAL — empty form, every value typed by the user.
 */
export async function runExtraction(projectId: string, mode: ExtractionMode): Promise<Project> {
  const project = claraDb.requireProject(projectId);
  const active = project.baselines.find((version) => version.status === 'ACTIVE');
  if (active && baselineAvailability(active).agreement && baselineAvailability(active).budget) throw conflict('Kedua acuan sudah disetujui. Perubahan berikutnya melalui permintaan perubahan.', 'BASELINE_LOCKED');
  const contract = latestDocument(project, 'CONTRACT');
  if (mode === 'AI') {
    if (!contract) throw badRequest('Unggah berkas kontrak terlebih dahulu.', 'CONTRACT_REQUIRED');
    return startDocumentAnalysis(projectId, contract.id);
  }
  if (mode === 'SAMPLE' && (active || !contract?.isSample)) throw badRequest('Data contoh hanya tersedia sebelum acuan V1 disetujui.', 'NOT_SAMPLE');
  if (contract && isRunning(contract)) throw conflict('Analisis dokumen sedang berjalan. Tunggu hingga selesai.', 'EXTRACTION_IN_PROGRESS');
  const ctx = makeCtx();
  return claraDb.mutate(projectId, (p) => {
    const rab = rabFromProject(p);
    p.extraction = mode === 'SAMPLE' ? { ...sampleCandidate(contract!.id, ctx.now), rab } : active ? supplementCandidate(p, ctx) : manualCandidate(p.client, p.name, ctx.now, rab);
    if (active && !baselineAvailability(active).budget) p.extraction.rab = rab;
    if (mode === 'MANUAL') p.extraction.terms = { ...EMPTY_TERMS };
    p.events.unshift({
      id: ctx.nextId('EVT'),
      projectId,
      type: 'EXTRACTION_COMPLETED',
      title: mode === 'SAMPLE' ? 'Data contoh dimuat — menunggu tinjauan' : 'Isian manual dibuka',
      description: 'Belum menjadi acuan aktif sampai disetujui.',
      date: ctx.now.slice(0, 10),
      author: ctx.actor.label,
      createdAt: ctx.now,
    });
  }).project;
}
