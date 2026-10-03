'use client';

import React from 'react';
import Link from 'next/link';
import type { ChangeRequest } from '@/types';
import { useProjects } from '@/hooks/useClaraData';
import { btn, EmptyState, NoticeBar, useNotice } from '@/components/shared/ui';
import { ChangeRequestCard } from '@/components/project/ChangeRequestsTab';

const FILTERS: { key: 'ALL' | ChangeRequest['status']; label: string }[] = [
  { key: 'ALL', label: 'Semua' },
  { key: 'DRAFT', label: 'Draf' },
  { key: 'PENDING', label: 'Menunggu keuangan' },
  { key: 'FINANCE_REVIEWED', label: 'Menunggu pimpinan' },
  { key: 'INTERNAL_APPROVED', label: 'Menunggu klien' },
  { key: 'APPROVED', label: 'Resmi' },
  { key: 'REJECTED', label: 'Ditolak' },
  { key: 'CLIENT_REJECTED', label: 'Ditolak klien' },
];

export default function ChangeRequestsPage() {
  const { projects, loading, error, refreshProjects } = useProjects();
  const { notice, run, clear } = useNotice();
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]['key']>('ALL');
  const all = projects.flatMap((p) => p.changeRequests.map((cr) => ({ cr, p })));
  const shown = all.filter(({ cr }) => filter === 'ALL' || cr.status === filter);
  const active = projects.filter((p) => p.metrics.hasBaseline);

  return (
    <div className="space-y-6 pb-16">
      <NoticeBar notice={notice} onClose={clear} />
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-red-700">Versi acuan</p>
        <h1 className="mt-2 font-heading text-2xl font-bold text-zinc-950 sm:text-3xl">Permintaan perubahan</h1>
        <p className="mt-2 text-sm text-zinc-600">PIC mengajukan → keuangan meninjau dampak → pimpinan memutuskan → bukti persetujuan klien → acuan versi baru (V2, V3…). Versi lama tetap tersimpan.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Filter status" className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" aria-pressed={filter === f.key} onClick={() => setFilter(f.key)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${filter === f.key ? 'bg-red-600 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'}`}>
              {f.label} ({f.key === 'ALL' ? all.length : all.filter(({ cr }) => cr.status === f.key).length})
            </button>
          ))}
        </div>
        {active.length > 0 && (
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="self-center text-zinc-500">Ajukan dari proyek:</span>
            {active.map((p) => <Link key={p.id} href={`/projects/${p.id}?tab=change-requests`} className={btn.ghost}>{p.name}</Link>)}
          </div>
        )}
      </div>

      {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700"><span>Gagal memuat: {error}</span><button type="button" onClick={() => void refreshProjects()} className={btn.secondary}>Coba lagi</button></div>}
      {loading && projects.length === 0 ? <p className="rounded-xl bg-white p-4 text-sm text-zinc-500">Memuat permintaan perubahan…</p> : shown.length === 0 ? (
        <EmptyState title={all.length === 0 ? 'Belum ada permintaan perubahan' : 'Tidak ada permintaan untuk filter ini'}>Ajukan perubahan dari tab Perubahan di halaman proyek.</EmptyState>
      ) : (
        <div className="space-y-4">{shown.map(({ cr, p }) => <ChangeRequestCard key={cr.id} cr={cr} project={p} run={run} showProject />)}</div>
      )}
    </div>
  );
}
