'use client';

import React from 'react';
import { Bot, ExternalLink, FileText, Loader2, RefreshCw, Upload } from 'lucide-react';
import type { Alert, DocumentKind, Project } from '@/types';
import { dataClient, documentUrl } from '@/services/dataClient';
import { formatDate, formatRupiah, isOpenAlert } from '@/lib/utils';
import { baselineAvailability } from '@/lib/baseline';
import { btn, EmptyState, inputClass, labelClass, Panel, SourceQuote } from '@/components/shared/ui';
import { BasisBadge, documentKindLabel, DocumentStatusBadge } from '@/components/shared/labels';
import { DraftCard } from './DraftCard';
import { AccessibleDialog } from '@/components/shared/AccessibleDialog';

type Run = <T>(action: () => Promise<T>, success: string | ((r: T) => string)) => Promise<T | undefined>;

const SAMPLES = [
  { key: 'invoice-uat', label: 'Invoice termin UAT', hint: 'sesuai kontrak' },
  { key: 'invoice-tambahan', label: 'Invoice pekerjaan tambahan', hint: 'mengandung anomali' },
  { key: 'persetujuan-klien', label: 'Surat persetujuan klien', hint: 'bukti untuk perubahan' },
];

/** Document Intelligence: every document, its analysis state, findings, evidence and next actions. */
export function DocumentsTab({ project, run, onOpenAlert }: { project: Project; run: Run; onOpenAlert: (alert: Alert) => void }) {
  const active = project.baselines.find((version) => version.status === 'ACTIVE');
  const available = active ? baselineAvailability(active) : null;
  const uploadKinds: DocumentKind[] = [...(!available?.agreement ? ['CONTRACT' as const] : []), ...(!available?.budget ? ['RAB' as const] : []), 'INVOICE', 'ADDENDUM', 'CLIENT_APPROVAL', 'SUPPORTING'];
  const [kind, setKind] = React.useState<DocumentKind>('INVOICE');
  const selectedKind = uploadKinds.includes(kind) ? kind : 'INVOICE';
  const [busy, setBusy] = React.useState<string | null>(null);
  const [selectedDocId, setSelectedDocId] = React.useState<string | null>(null);
  const act = async (key: string, action: () => Promise<unknown>, text: string) => {
    setBusy(key);
    await run(action, text);
    setBusy(null);
  };
  const docs = [...project.documents].reverse();

  return (
    <div className="space-y-5">
      <Panel
        title="Dokumen & analisis CLARA"
        description="Unggah berkas untuk diperiksa. Kesepakatan atau RAB yang melengkapi acuan perlu ditinjau dan disetujui di tab Acuan proyek."
      >
        <div className="flex flex-wrap items-end gap-3 rounded-xl bg-zinc-50 p-4">
          <div>
            <label htmlFor="doc-kind" className={labelClass}>Jenis dokumen</label>
            <select id="doc-kind" value={selectedKind} onChange={(e) => setKind(e.target.value as DocumentKind)} className={inputClass}>
              {uploadKinds.map((k) => <option key={k} value={k}>{documentKindLabel[k]}</option>)}
            </select>
          </div>
          <label className={`${btn.primary} relative cursor-pointer`}>
            {busy === 'upload' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {busy === 'upload' ? 'Mengunggah…' : 'Unggah & analisis otomatis'}
            <input type="file" className="sr-only" accept={selectedKind === 'RAB' ? '.csv,.xlsx,.xls' : '.pdf,.png,.jpg,.jpeg,.webp'} disabled={busy !== null} onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ''; if (file) void act('upload', () => dataClient.uploadDocument(project.id, selectedKind, file), selectedKind === 'RAB' ? `${file.name} diunggah. Jumlah biaya dibaca oleh sistem.` : `${file.name} diunggah. CLARA sedang menganalisis.`); }} />
          </label>
          <p className="text-xs text-zinc-500">{selectedKind === 'RAB' ? 'CSV, XLSX, XLS · maks. 5 MB' : 'PDF, JPG, PNG, WebP · maks. 10 MB'}</p>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-xs text-zinc-500">Dokumen contoh (demo):</span>
          {SAMPLES.map((s) => (
            <button key={s.key} type="button" disabled={busy !== null} onClick={() => void act(s.key, () => dataClient.attachSampleDocuments(project.id, [s.key]), `${s.label} dilampirkan. CLARA sedang menganalisis.`)} className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-900 hover:bg-orange-100 disabled:opacity-50">
              {busy === s.key ? 'Melampirkan…' : `${s.label} · ${s.hint}`}
            </button>
          ))}
        </div>
      </Panel>

      {docs.length === 0 ? (
        <EmptyState title="Belum ada dokumen">Unggah dokumen di atas untuk memulai pemeriksaan.</EmptyState>
      ) : (<>
        <Panel title="Daftar dokumen" description="Lihat status dan temuan lebih dulu; buka rincian untuk memeriksa hasil atau mengambil tindakan.">
          <div className="overflow-x-auto rounded-xl border border-zinc-200"><table className="w-full min-w-[900px] border-collapse text-left text-sm"><thead className="bg-zinc-50"><tr><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 font-semibold">Dokumen</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 font-semibold">Jenis</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 font-semibold">Status</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 font-semibold">Hasil singkat</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 text-right font-semibold">Peringatan terbuka</th><th scope="col" className="border-b border-zinc-200 px-4 py-3 font-semibold">Rincian</th></tr></thead><tbody className="divide-y divide-zinc-200">{docs.map((doc) => {
            const relatedOpen = project.alerts.filter((alert) => alert.sourceDocumentId === doc.id && isOpenAlert(alert)).length;
            return <tr key={doc.id} className="hover:bg-zinc-50"><td className="border-r border-zinc-200 px-4 py-3"><strong className="break-all text-zinc-900">{doc.fileName}</strong><span className="mt-1 block text-xs text-zinc-500">Diunggah {formatDate(doc.uploadedAt)}{doc.isSample ? ' · data contoh' : ''}</span></td><td className="border-r border-zinc-200 px-4 py-3">{documentKindLabel[doc.kind]}</td><td className="border-r border-zinc-200 px-4 py-3"><DocumentStatusBadge status={doc.status} /></td><td className="border-r border-zinc-200 px-4 py-3 text-zinc-700"><span className="line-clamp-2 max-w-md">{doc.status === 'FAILED' ? doc.error?.message ?? 'Analisis gagal' : doc.status === 'PROCESSING' ? 'Sedang dibaca' : doc.analysis?.summary ?? 'Belum ada hasil analisis'}</span></td><td className={`border-r border-zinc-200 px-4 py-3 text-right tabular-nums ${relatedOpen > 0 ? 'font-semibold text-red-700' : ''}`}>{relatedOpen}</td><td className="px-4 py-3"><button type="button" onClick={() => setSelectedDocId(doc.id)} className="font-semibold text-red-700 hover:underline">Lihat rincian</button></td></tr>;
          })}</tbody></table></div>
        </Panel>
        {docs.filter((doc) => doc.id === selectedDocId).map((doc) => {
          const a = doc.analysis;
          const related = project.alerts.filter((x) => x.sourceDocumentId === doc.id);
          const open = related.filter(isOpenAlert);
          const inv = a?.invoice;
          const matched = inv?.matchedMilestoneId ? project.agreementBaseline.milestones.find((m) => m.id === inv.matchedMilestoneId) : undefined;
          return (
            <AccessibleDialog key={doc.id} titleId="document-detail-title" onClose={() => setSelectedDocId(null)}>
            <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-zinc-200 pb-3"><h2 id="document-detail-title" className="text-lg font-bold text-zinc-950">Rincian dokumen</h2><button type="button" onClick={() => setSelectedDocId(null)} className={btn.ghost}>Tutup</button></div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <FileText className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{documentKindLabel[doc.kind]}{doc.isSample && <span className="ml-2 rounded bg-orange-50 px-1.5 normal-case text-orange-800">contoh</span>}</p>
                    <a href={documentUrl(project.id, doc.id)} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 truncate text-sm font-semibold text-zinc-900 hover:text-red-700">{doc.fileName}<ExternalLink className="h-3 w-3 shrink-0" /></a>
                    <p className="text-xs text-zinc-500">Diunggah {formatDate(doc.uploadedAt)} · {doc.uploadedBy}</p>
                  </div>
                </div>
                <DocumentStatusBadge status={doc.status} />
              </div>

              {doc.status === 'PROCESSING' && (
                <p role="status" className="mt-3 flex items-center gap-2 rounded-xl bg-blue-50 p-3 text-sm text-blue-800"><Loader2 className="h-4 w-4 animate-spin" />CLARA membaca dokumen: OCR → ekstraksi → pemeriksaan silang dengan acuan {project.baselineVersion}…</p>
              )}
              {doc.status === 'FAILED' && (
                <div role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  <p className="font-semibold">Analisis gagal</p>
                  <p>{doc.error?.message}</p>
                  <p className="mt-1 text-xs">Dokumen tetap tersimpan; data proyek tidak berubah.</p>
                </div>
              )}

              {a && (
                <div className="mt-3 space-y-3">
                  <div className="rounded-xl bg-zinc-50 p-3 text-sm">
                    <p className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                      <BasisBadge basis={a.engine.includes('deterministik') ? 'VERIFIED_CALCULATION' : 'AI_FINDING'} />
                      Terdeteksi: <strong className="text-zinc-700">{a.detectedType}</strong> · {a.engine}{a.confidence !== null ? ` · keyakinan ${Math.round(a.confidence * 100)}%` : ''} · {formatDate(a.analyzedAt)}
                    </p>
                    {a.summary && <p className="mt-1.5 text-zinc-800">{a.summary}</p>}
                    {a.warnings.length > 0 && <ul className="mt-1.5 space-y-0.5 text-xs text-amber-800">{a.warnings.map((w) => <li key={w}>• {w}</li>)}</ul>}
                  </div>

                  {inv && (
                    <div className="overflow-x-auto rounded-xl border border-zinc-200">
                      <table className="w-full min-w-[560px] text-left text-sm">
                        <thead><tr className="border-b border-zinc-200 text-xs uppercase text-zinc-500"><th className="px-3 py-2">Baris invoice</th><th className="px-3 py-2">Kuantitas</th><th className="px-3 py-2">Harga</th><th className="px-3 py-2">Jumlah</th></tr></thead>
                        <tbody className="divide-y divide-zinc-100">
                          {inv.lineItems.map((l, i) => <tr key={i}><td className="px-3 py-2">{l.description}</td><td className="px-3 py-2">{l.quantity ?? '-'} {l.unit ?? ''}</td><td className="px-3 py-2">{l.unitPrice !== null ? formatRupiah(l.unitPrice) : '-'}</td><td className="px-3 py-2">{l.amount !== null ? formatRupiah(l.amount) : '-'}</td></tr>)}
                        </tbody>
                      </table>
                      <p className="border-t border-zinc-100 px-3 py-2 text-sm"><strong>{inv.invoiceNumber ?? 'Tanpa nomor'}</strong> · total {inv.total !== null ? formatRupiah(inv.total) : '-'} · termin: {inv.milestoneReference ?? '-'}{matched ? ` → cocok dengan "${matched.title}"` : ' → tidak cocok dengan tahap acuan'}{inv.recordedInvoiceId ? ' · sudah dicatat sebagai tagihan' : ''}</p>
                    </div>
                  )}

                  {a.approval && (a.approval.approver || a.approval.reference) && (
                    <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">Persetujuan terdeteksi: {a.approval.approved ? 'menyetujui' : a.approval.approved === false ? 'tidak menyetujui' : 'tidak jelas'} · {a.approval.approver ?? '-'} · {a.approval.reference ?? '-'}{a.approval.date ? ` · ${formatDate(a.approval.date)}` : ''}. Dapat dipakai sebagai bukti di permintaan perubahan.</p>
                  )}

                  {a.findings.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Temuan dari dokumen</p>
                      <ul className="mt-1.5 space-y-2">
                        {a.findings.map((f) => (
                          <li key={f.id} className="rounded-lg border border-zinc-200 p-3 text-sm">
                            <p className="flex flex-wrap items-center gap-2"><BasisBadge basis={f.basis} /><span className="font-semibold text-zinc-900">{f.title}</span><span className="text-xs text-zinc-500">{f.severity === 'HIGH' ? 'tinggi' : f.severity === 'MEDIUM' ? 'sedang' : 'rendah'}{f.origin === 'GUARDRAIL' ? ' · guardrail hukum' : ''}</span></p>
                            <p className="mt-1 text-zinc-700">{f.detail}</p>
                            {f.source && <SourceQuote projectId={project.id} source={f.source} />}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {related.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Pemeriksaan silang dengan acuan & catatan ({open.length} terbuka)</p>
                      <ul className="mt-1.5 space-y-1.5">
                        {related.map((x) => (
                          <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm">
                            <span className={isOpenAlert(x) ? 'text-zinc-900' : 'text-zinc-500 line-through'}>{x.title}</span>
                            <button type="button" onClick={() => { setSelectedDocId(null); onOpenAlert(x); }} className="text-xs font-semibold text-red-700 hover:underline">Lihat bukti</button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {doc.kind !== 'RAB' && doc.kind !== 'CONTRACT' && related.length === 0 && doc.status !== 'PROCESSING' && (
                    <p className="text-sm text-emerald-800">Tidak ada ketidaksesuaian dengan acuan {project.baselineVersion} dan catatan proyek.</p>
                  )}
                </div>
              )}

              <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-zinc-100 pt-3">
                {doc.kind !== 'RAB' && doc.status !== 'PROCESSING' && !(doc.kind === 'CONTRACT' && project.metrics.hasBaseline) && (
                  <button type="button" disabled={busy !== null} onClick={() => void act(`re-${doc.id}`, () => dataClient.reanalyzeDocument(project.id, doc.id), `${doc.fileName} dianalisis ulang.`)} className={btn.ghost}>
                    <RefreshCw className="h-4 w-4" />{busy === `re-${doc.id}` ? 'Menganalisis…' : doc.status === 'FAILED' ? 'Coba analisis lagi' : 'Analisis ulang'}
                  </button>
                )}
                {inv && matched && matched.status === 'COMPLETED' && !inv.recordedInvoiceId && doc.status !== 'REJECTED' && project.metrics.hasBaseline && (
                  <button type="button" disabled={busy !== null} onClick={() => { if (window.confirm(`Catat ${inv.invoiceNumber ?? doc.fileName} sebagai tagihan ${inv.total !== null ? formatRupiah(inv.total) : ''} untuk ${matched.title}?${open.length ? ` Masih ada ${open.length} temuan terbuka pada dokumen ini.` : ''}`)) void act(`rec-${doc.id}`, () => dataClient.recordInvoiceFromDocument(project.id, doc.id), 'Invoice dicatat dari dokumen.'); }} className={btn.primary}>
                    {busy === `rec-${doc.id}` ? 'Mencatat…' : 'Catat sebagai tagihan'}
                  </button>
                )}
                {open.some((x) => x.type !== 'CONTRACT_RISK') && (
                  <button type="button" disabled={busy !== null} onClick={() => void act(`resp-${doc.id}`, () => dataClient.generateDocument({ projectId: project.id, type: 'ANOMALY_RESPONSE', alertId: open.find((x) => x.type !== 'CONTRACT_RISK')!.id }), 'Draf tindak lanjut disiapkan CLARA. Tinjau di bagian draf di bawah.')} className={btn.secondary}>
                    <Bot className="h-4 w-4" />{busy === `resp-${doc.id}` ? 'Menyiapkan…' : 'Buat tindak lanjut (AI)'}
                  </button>
                )}
                {(doc.kind === 'INVOICE' || doc.kind === 'ADDENDUM' || doc.kind === 'SUPPORTING' || doc.kind === 'CLIENT_APPROVAL') && (doc.status === 'NEEDS_REVIEW' || doc.status === 'ANALYZED') && (
                  <>
                    <button type="button" disabled={busy !== null} onClick={() => void act(`rej-${doc.id}`, () => dataClient.decideDocument(project.id, doc.id, 'REJECTED'), `${doc.fileName} ditolak; temuannya ditutup.`)} className={btn.ghost}>Tolak dokumen</button>
                    <button type="button" disabled={busy !== null} onClick={() => void act(`acc-${doc.id}`, () => dataClient.decideDocument(project.id, doc.id, 'APPROVED'), `${doc.fileName} diterima sebagai bukti.`)} className={btn.secondary}>Terima dokumen</button>
                  </>
                )}
              </div>
            </article>
            </AccessibleDialog>
          );
        })}
      </>)}

      <Panel title="Draf yang disiapkan CLARA" description="Draf dari temuan, permintaan perubahan, dan Studio. Semua harus ditinjau dan disetujui manusia sebelum dikirim.">
        {project.drafts.length === 0 ? (
          <EmptyState title="Belum ada draf">Buka bukti sebuah temuan lalu pilih tindakan CLARA, atau gunakan Studio dokumen.</EmptyState>
        ) : (
          <div className="space-y-3">{project.drafts.map((d) => <DraftCard key={d.id} draft={d} run={run} />)}</div>
        )}
      </Panel>
    </div>
  );
}
