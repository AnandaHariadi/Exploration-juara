'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useProjects } from '@/hooks/useClaraData';
import { formatDate } from '@/lib/utils';
import { StatusBadge, ScopeBadge } from '@/components/shared/Badge';
import { btn, EmptyState, InsightBadge } from '@/components/shared/ui';

export default function MonitoringPage() {
  const { projects, loading, error, refreshProjects } = useProjects();
  const drafts = projects.filter((p) => !p.metrics.hasBaseline);
  const active = projects.filter((p) => p.metrics.hasBaseline);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-red-700">Aktual vs acuan</p>
        <h1 className="mt-2 font-heading text-2xl font-bold text-zinc-950 sm:text-3xl">Pemantauan proyek</h1>
        <p className="mt-2 text-sm text-zinc-600">Progres, revisi, ruang lingkup, dan tenggat setiap proyek dibandingkan dengan acuan aktifnya.</p>
      </div>

      {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700"><span>Gagal memuat proyek: {error}</span><button type="button" onClick={() => void refreshProjects()} className={btn.secondary}>Coba lagi</button></div>}
      {loading && projects.length === 0 ? <p className="rounded-xl bg-white p-6 text-sm text-zinc-500">Memuat pemantauan…</p> : projects.length === 0 ? (
        <EmptyState title="Belum ada proyek" action={<Link href="/projects/new" className={btn.primary}>Buat proyek</Link>} />
      ) : (
        <>
          {drafts.length > 0 && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-950">
              Pemantauan aktif setelah acuan disetujui. Menunggu acuan: {drafts.map((p, i) => <React.Fragment key={p.id}>{i > 0 && ', '}<Link href={`/projects/${p.id}`} className="font-semibold underline">{p.name}</Link></React.Fragment>)}.
            </div>
          )}
          <div className="space-y-5">
            {active.map((p) => {
              const m = p.metrics;
              const review = p.agreementBaseline.scopeItems.filter((s) => s.status === 'NEEDS_REVIEW');
              return (
                <article key={p.id} className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex flex-col justify-between gap-3 border-b border-zinc-100 pb-4 md:flex-row md:items-center">
                    <div>
                      <div className="mb-1 flex items-center gap-2"><span className="font-mono text-xs text-zinc-400">{p.id}</span><StatusBadge status={p.status} /><span className="font-mono text-xs text-red-700">Acuan {m.baselineVersion}</span></div>
                      <h2 className="text-lg font-bold text-zinc-900">{p.name}</h2>
                      <p className="text-xs text-zinc-500">{p.client}</p>
                    </div>
                    <Link href={`/projects/${p.id}?tab=monitoring`} className={`${btn.secondary} self-start`}>Catat kegiatan <ArrowRight className="h-4 w-4" /></Link>
                  </div>
                  <div className="grid gap-3 md:grid-cols-4">
                    <div className="rounded-xl bg-zinc-50 p-4"><p className="text-xs font-semibold uppercase text-zinc-500">Progres</p><p className="mt-1 text-xl font-bold">{m.progress}%</p><div className="mt-2 h-1.5 rounded-full bg-zinc-200"><div className="h-full rounded-full bg-red-600" style={{ width: `${m.progress}%` }} /></div></div>
                    <div className={`rounded-xl p-4 ${m.revisionVariance > 0 ? 'bg-red-50' : 'bg-zinc-50'}`}><p className="text-xs font-semibold uppercase text-zinc-500">Revisi</p><p className="mt-1 text-xl font-bold">{m.actualRevisions} / {m.includedRevisions}</p><p className="text-xs text-zinc-600">{m.revisionVariance > 0 ? `+${m.revisionVariance} di luar acuan` : 'Dalam batas'}</p></div>
                    <div className={`rounded-xl p-4 ${m.deadlineVarianceDays && m.deadlineVarianceDays > 0 ? 'bg-amber-50' : 'bg-zinc-50'}`}><p className="text-xs font-semibold uppercase text-zinc-500">Tenggat</p><p className="mt-1 text-xl font-bold">{formatDate(m.deadline ?? '')}</p><p className="text-xs text-zinc-600">{m.projectedFinish ? `Perkiraan ${formatDate(m.projectedFinish)}` : 'Perkiraan belum dicatat'}</p></div>
                    <div className={`rounded-xl p-4 ${review.length ? 'bg-amber-50' : 'bg-zinc-50'}`}><p className="text-xs font-semibold uppercase text-zinc-500">Ruang lingkup</p><p className="mt-1 text-xl font-bold">{review.length ? `${review.length} perlu ditinjau` : 'Sesuai'}</p><p className="text-xs text-zinc-600">{p.agreementBaseline.scopeItems.length} pekerjaan</p></div>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {p.reconciliation.map((c) => (
                      <div key={c.key} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-100 px-3 py-2 text-sm">
                        <span><span className="font-semibold text-zinc-800">{c.label}</span><span className="block text-xs text-zinc-500">{c.actual}</span></span>
                        <InsightBadge status={c.status} />
                      </div>
                    ))}
                  </div>
                  {review.length > 0 && (
                    <ul className="space-y-1.5">
                      {review.map((s) => <li key={s.id} className="flex items-center justify-between gap-3 rounded-lg bg-amber-50 px-3 py-2 text-sm"><span>{s.title}</span><ScopeBadge status={s.status} /></li>)}
                    </ul>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
