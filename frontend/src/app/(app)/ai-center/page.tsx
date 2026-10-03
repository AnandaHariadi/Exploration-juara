'use client';

import React from 'react';
import Link from 'next/link';
import { Bot, Loader2 } from 'lucide-react';
import type { Alert } from '@/types';
import { useAiHealth, useProjects } from '@/hooks/useClaraData';
import { formatDate, isOpenAlert } from '@/lib/utils';
import { btn, EmptyState, Metric, NoticeBar, Panel, useNotice } from '@/components/shared/ui';
import { BasisBadge, documentKindLabel, DocumentStatusBadge } from '@/components/shared/labels';
import { EvidenceDrawer, impactText } from '@/components/alerts/EvidenceDrawer';
import { DraftCard } from '@/components/project/DraftCard';
import { crStatus } from '@/components/project/ChangeRequestsTab';
import { InsightBadge } from '@/components/shared/ui';

const LOOP = ['Deteksi', 'Jelaskan', 'Hitung dampak', 'Siapkan solusi', 'Setujui', 'Pantau lagi'];

/** AI Monitoring Center + Remediation / Action Center. */
export default function AiCenterPage() {
  const { projects, loading, error, refreshProjects } = useProjects();
  const { health } = useAiHealth();
  const { notice, run, clear } = useNotice();
  const [selected, setSelected] = React.useState<Alert | null>(null);

  const docs = projects.flatMap((p) => p.documents.map((d) => ({ p, d }))).sort((a, b) => (b.d.analysis?.analyzedAt ?? b.d.statusAt ?? b.d.uploadedAt).localeCompare(a.d.analysis?.analyzedAt ?? a.d.statusAt ?? a.d.uploadedAt));
  const alerts = projects.flatMap((p) => p.alerts).filter(isOpenAlert);
  const priority = [...alerts].sort((a, b) => ({ CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 })[a.severity] - ({ CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 })[b.severity]).slice(0, 8);
  const drafts = projects.flatMap((p) => p.drafts.map((d) => ({ p, d })));
  const pendingDrafts = drafts.filter(({ d }) => d.status === 'READY_FOR_REVIEW' || d.status === 'NEEDS_FIX');
  const aiCrs = projects.flatMap((p) => p.changeRequests.filter((c) => c.origin === 'AI_DRAFT').map((c) => ({ p, c })));

  return (
    <div className="space-y-6 pb-16">
      <NoticeBar notice={notice} onClose={clear} />
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-red-700">CLARA Document Guardian</p>
        <h1 className="mt-2 font-heading text-2xl font-bold text-zinc-950 sm:text-3xl">Pusat AI</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-600">CLARA tidak hanya membaca kontrak — CLARA memantau apa yang terjadi setelah kontrak ditandatangani. Setiap dokumen dan catatan proyek diperiksa terhadap acuan aktif; temuan dijelaskan, dihitung, dan disiapkan solusinya untuk Anda putuskan.</p>
        <ol aria-label="Siklus CLARA" className="mt-3 flex flex-wrap gap-1.5 text-xs">{LOOP.map((s, i) => <li key={s} className="rounded-full bg-zinc-100 px-3 py-1 font-semibold text-zinc-700">{i + 1}. {s}</li>)}</ol>
      </div>

      <div className={`flex items-center gap-2 rounded-xl border p-3 text-sm ${health?.available ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
        <Bot className="h-4 w-4" />{health === null ? 'Memeriksa layanan AI…' : health.available ? 'Layanan AI siap: analisis dokumen, penjelasan, dan penyusunan draf aktif.' : `${health.message ?? 'Layanan AI tidak tersedia.'} Perhitungan, pemantauan, dan peringatan tetap berjalan; draf memakai templat berlabel.`}
      </div>

      {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700"><span>Gagal memuat: {error}</span><button type="button" onClick={() => void refreshProjects()} className={btn.secondary}>Coba lagi</button></div>}
      {loading && projects.length === 0 ? <p className="rounded-xl bg-white p-6 text-sm text-zinc-500">Memuat pusat AI…</p> : (
        <>
          <section aria-label="Ringkasan pemantauan AI" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Metric label="Dokumen dianalisis" value={String(docs.filter(({ d }) => d.analysis).length)} detail={`${docs.length} dokumen total`} />
            <Metric label="Sedang dianalisis" value={String(docs.filter(({ d }) => d.status === 'PROCESSING').length)} detail="Diperbarui otomatis" />
            <Metric label="Analisis gagal" value={String(docs.filter(({ d }) => d.status === 'FAILED').length)} tone={docs.some(({ d }) => d.status === 'FAILED') ? 'bad' : 'default'} detail="Dapat dicoba lagi" />
            <Metric label="Selisih terverifikasi" value={String(alerts.filter((a) => a.basis === 'VERIFIED_CALCULATION').length)} detail="Dihitung mesin rekonsiliasi" tone={alerts.some((a) => a.classification === 'VERIFIED_DEVIATION') ? 'warn' : 'default'} />
            <Metric label="Temuan AI terbuka" value={String(alerts.filter((a) => a.basis === 'AI_FINDING').length)} detail="Perlu tinjauan manusia" />
            <Metric label="Menunggu persetujuan" value={String(pendingDrafts.length + aiCrs.filter(({ c }) => !['APPROVED', 'REJECTED', 'CLIENT_REJECTED'].includes(c.status)).length)} detail="Draf & perubahan dari CLARA" />
          </section>

          <Panel title="Temuan prioritas" description="Apa yang terjadi · dampaknya · buktinya · tindakannya" action={<Link href="/alerts" className="text-sm font-semibold text-red-700 hover:underline">Semua peringatan →</Link>}>
            {priority.length === 0 ? <EmptyState title="Tidak ada temuan terbuka." /> : (
              <ul className="space-y-2">
                {priority.map((a) => (
                  <li key={a.id}>
                    <button type="button" onClick={() => setSelected(a)} className="w-full rounded-xl border border-zinc-200 p-3 text-left hover:border-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
                      <span className="flex flex-wrap items-center gap-2"><InsightBadge status={a.classification} /><BasisBadge basis={a.basis} /><span className="text-xs text-zinc-500">{a.projectName}</span></span>
                      <strong className="mt-1 block text-sm text-zinc-900">{a.title}</strong>
                      <span className="mt-0.5 block text-xs text-zinc-600">{impactText(a)} · {a.impactLabel}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Pemantauan dokumen" description="Dokumen terbaru yang diperiksa CLARA">
            {docs.length === 0 ? <EmptyState title="Belum ada dokumen." /> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead><tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500"><th className="py-2 pr-3">Dokumen</th><th className="py-2 pr-3">Proyek</th><th className="py-2 pr-3">Status</th><th className="py-2 pr-3">Dianalisis</th><th className="py-2 pr-3">Keyakinan</th><th className="py-2 pr-3">Temuan</th><th className="py-2">Aksi</th></tr></thead>
                  <tbody className="divide-y divide-zinc-100">
                    {docs.slice(0, 15).map(({ p, d }) => {
                      const findings = (d.analysis?.findings.length ?? 0) + p.alerts.filter((a) => a.sourceDocumentId === d.id && isOpenAlert(a)).length;
                      return (
                        <tr key={d.id}>
                          <td className="py-2.5 pr-3"><span className="font-semibold text-zinc-900">{d.fileName}</span><span className="block text-xs text-zinc-500">{documentKindLabel[d.kind]}{d.analysis ? ` · terdeteksi ${d.analysis.detectedType}` : ''}</span></td>
                          <td className="py-2.5 pr-3">{p.name}</td>
                          <td className="py-2.5 pr-3">{d.status === 'PROCESSING' ? <span className="inline-flex items-center gap-1 text-xs text-blue-700"><Loader2 className="h-3 w-3 animate-spin" />Sedang dianalisis</span> : <DocumentStatusBadge status={d.status} />}</td>
                          <td className="py-2.5 pr-3 text-xs">{d.analysis ? formatDate(d.analysis.analyzedAt) : '-'}</td>
                          <td className="py-2.5 pr-3 text-xs">{d.analysis?.confidence != null ? `${Math.round(d.analysis.confidence * 100)}%` : '-'}</td>
                          <td className={`py-2.5 pr-3 ${findings ? 'font-semibold text-amber-800' : ''}`}>{findings}</td>
                          <td className="py-2.5"><Link href={`/projects/${p.id}?tab=${p.metrics.hasBaseline ? 'documents' : 'overview'}`} className="text-xs font-semibold text-red-700 hover:underline">{d.status === 'FAILED' ? 'Coba lagi' : 'Periksa'}</Link></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel title="Aksi yang disiapkan CLARA" description="Draf dan permintaan perubahan dari CLARA. Tidak ada yang berlaku atau terkirim tanpa persetujuan manusia." action={<Link href="/studio" className="text-sm font-semibold text-red-700 hover:underline">Studio dokumen →</Link>}>
            {aiCrs.length === 0 && drafts.length === 0 ? <EmptyState title="Belum ada aksi yang disiapkan.">Buka bukti sebuah temuan, lalu pilih tindakan CLARA Copilot.</EmptyState> : (
              <div className="space-y-3">
                {aiCrs.map(({ p, c }) => (
                  <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50/40 p-3 text-sm">
                    <span><span className="font-mono text-xs text-red-700">{c.crNumber}</span> · <strong>{c.title}</strong><span className="block text-xs text-zinc-500">{p.name} · {crStatus[c.status].label}</span></span>
                    <Link href={`/projects/${p.id}?tab=change-requests`} className={btn.secondary}>Tinjau</Link>
                  </div>
                ))}
                {drafts.map(({ p, d }) => <DraftCard key={d.id} draft={d} run={run} projectName={p.name} />)}
              </div>
            )}
          </Panel>
        </>
      )}
      <EvidenceDrawer alert={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
