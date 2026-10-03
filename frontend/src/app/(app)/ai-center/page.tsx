'use client';

import React from 'react';
import Link from 'next/link';
import { Bot, Loader2 } from 'lucide-react';
import type { Alert } from '@/types';
import { useAiHealth, useProjects } from '@/hooks/useClaraData';
import { formatDate, isOpenAlert } from '@/lib/utils';
import { btn, EmptyState, NoticeBar, Panel, useNotice } from '@/components/shared/ui';
import { BasisBadge, documentKindLabel, DocumentStatusBadge } from '@/components/shared/labels';
import { EvidenceDrawer, impactText } from '@/components/alerts/EvidenceDrawer';
import { DraftCard } from '@/components/project/DraftCard';
import { crStatus } from '@/components/project/ChangeRequestsTab';
import { InsightBadge } from '@/components/shared/ui';

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
        <p className="text-xs font-semibold uppercase tracking-widest text-red-700">Tinjauan dokumen</p>
        <h1 className="mt-2 font-heading text-2xl font-bold text-zinc-950 sm:text-3xl">Dokumen & AI</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-600">Lihat dokumen yang perlu ditinjau, temuan terbuka, dan draf yang menunggu keputusan. Angka keuangan dihitung sistem; hasil bacaan AI tetap perlu diperiksa.</p>
      </div>

      <div className={`flex items-center gap-2 rounded-xl border p-3 text-sm ${health?.available ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
        <Bot className="h-4 w-4" />{health === null ? 'Memeriksa layanan AI…' : health.available ? 'Layanan AI siap: analisis dokumen, penjelasan, dan penyusunan draf aktif.' : `${health.message ?? 'Layanan AI tidak tersedia.'} Perhitungan, pemantauan, dan peringatan tetap berjalan; draf memakai templat berlabel.`}
      </div>

      {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700"><span>Gagal memuat: {error}</span><button type="button" onClick={() => void refreshProjects()} className={btn.secondary}>Coba lagi</button></div>}
      {loading && projects.length === 0 ? <p className="rounded-xl bg-white p-6 text-sm text-zinc-500">Memuat pusat AI…</p> : (
        <>
          <section aria-label="Yang perlu diperiksa" className="overflow-x-auto rounded-xl border border-zinc-200 bg-white"><table className="w-full min-w-[680px] border-collapse text-left text-sm"><thead className="bg-zinc-50"><tr><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 font-semibold">Kondisi</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 text-right font-semibold">Jumlah</th><th scope="col" className="border-b border-zinc-200 px-4 py-3 font-semibold">Tindakan</th></tr></thead><tbody className="divide-y divide-zinc-200">
            <tr><th scope="row" className="border-r border-zinc-200 px-4 py-3 text-left font-medium">Sedang dianalisis</th><td className="border-r border-zinc-200 px-4 py-3 text-right tabular-nums">{docs.filter(({ d }) => d.status === 'PROCESSING').length}</td><td className="px-4 py-3 text-zinc-600">Hasil akan muncul di daftar dokumen.</td></tr>
            <tr><th scope="row" className="border-r border-zinc-200 px-4 py-3 text-left font-medium">Analisis gagal</th><td className="border-r border-zinc-200 px-4 py-3 text-right tabular-nums">{docs.filter(({ d }) => d.status === 'FAILED').length}</td><td className="px-4 py-3 text-zinc-600">Buka dokumen untuk mencoba lagi.</td></tr>
            <tr><th scope="row" className="border-r border-zinc-200 px-4 py-3 text-left font-medium">Peringatan terbuka</th><td className="border-r border-zinc-200 px-4 py-3 text-right tabular-nums">{alerts.length}</td><td className="px-4 py-3"><Link href="/alerts" className="font-semibold text-red-700 hover:underline">Tinjau peringatan</Link></td></tr>
            <tr><th scope="row" className="border-r border-zinc-200 px-4 py-3 text-left font-medium">Draf dan perubahan menunggu keputusan</th><td className="border-r border-zinc-200 px-4 py-3 text-right tabular-nums">{pendingDrafts.length + aiCrs.filter(({ c }) => !['APPROVED', 'REJECTED', 'CLIENT_REJECTED'].includes(c.status)).length}</td><td className="px-4 py-3 text-zinc-600">Tinjau di bagian aksi di bawah.</td></tr>
          </tbody></table></section>

          <Panel title="Temuan yang perlu ditinjau" description="Diurutkan dari tingkat tertinggi. Buka bukti sebelum mengambil keputusan." action={<Link href="/alerts" className="text-sm font-semibold text-red-700 hover:underline">Semua peringatan →</Link>}>
            {priority.length === 0 ? <EmptyState title="Tidak ada temuan terbuka." /> : (
              <div className="overflow-x-auto rounded-xl border border-zinc-200"><table className="w-full min-w-[820px] border-collapse text-left text-sm"><thead className="bg-zinc-50"><tr><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3">Temuan</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3">Proyek</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3">Hasil</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3">Dampak terkait</th><th scope="col" className="border-b border-zinc-200 px-4 py-3">Bukti</th></tr></thead><tbody className="divide-y divide-zinc-200">{priority.map((a) => <tr key={a.id}><td className="border-r border-zinc-200 px-4 py-3 font-semibold text-zinc-900">{a.title}</td><td className="border-r border-zinc-200 px-4 py-3">{a.projectName}</td><td className="border-r border-zinc-200 px-4 py-3"><div className="flex flex-wrap gap-1"><InsightBadge status={a.classification} /><BasisBadge basis={a.basis} /></div></td><td className="border-r border-zinc-200 px-4 py-3">{impactText(a)}</td><td className="px-4 py-3"><button type="button" onClick={() => setSelected(a)} className="font-semibold text-red-700 hover:underline">Lihat bukti</button></td></tr>)}</tbody></table></div>
            )}
          </Panel>

          <Panel title="Status dokumen" description="Dokumen terbaru dari seluruh proyek. Buka proyek untuk melihat analisis lengkap dan mengambil tindakan.">
            {docs.length === 0 ? <EmptyState title="Belum ada dokumen." /> : (
              <div className="overflow-x-auto rounded-xl border border-zinc-200">
                <table className="w-full min-w-[840px] border-collapse text-left text-sm">
                  <thead className="bg-zinc-50"><tr><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3">Dokumen</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3">Proyek</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3">Status</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3">Dianalisis</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3">Keyakinan AI</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 text-right">Temuan</th><th scope="col" className="border-b border-zinc-200 px-4 py-3">Aksi</th></tr></thead>
                  <tbody className="divide-y divide-zinc-200">
                    {docs.slice(0, 15).map(({ p, d }) => {
                      const findings = (d.analysis?.findings.length ?? 0) + p.alerts.filter((a) => a.sourceDocumentId === d.id && isOpenAlert(a)).length;
                      return (
                        <tr key={d.id}>
                          <td className="border-r border-zinc-200 px-4 py-3"><span className="font-semibold text-zinc-900">{d.fileName}</span><span className="block text-xs text-zinc-500">{documentKindLabel[d.kind]}{d.analysis ? ` · terdeteksi ${d.analysis.detectedType}` : ''}</span></td>
                          <td className="border-r border-zinc-200 px-4 py-3">{p.name}</td>
                          <td className="border-r border-zinc-200 px-4 py-3">{d.status === 'PROCESSING' ? <span className="inline-flex items-center gap-1 text-xs text-blue-700"><Loader2 className="h-3 w-3 animate-spin" />Sedang dianalisis</span> : <DocumentStatusBadge status={d.status} />}</td>
                          <td className="border-r border-zinc-200 px-4 py-3 text-xs">{d.analysis ? formatDate(d.analysis.analyzedAt) : '-'}</td>
                          <td className="border-r border-zinc-200 px-4 py-3 text-xs">{d.analysis?.confidence != null ? `${Math.round(d.analysis.confidence * 100)}%` : '-'}</td>
                          <td className={`border-r border-zinc-200 px-4 py-3 text-right tabular-nums ${findings ? 'font-semibold text-amber-800' : ''}`}>{findings}</td>
                          <td className="px-4 py-3"><Link href={`/projects/${p.id}?tab=${p.metrics.hasBaseline ? 'documents' : 'overview'}`} className="font-semibold text-red-700 hover:underline">{d.status === 'FAILED' ? 'Coba lagi' : 'Periksa'}</Link></td>
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
