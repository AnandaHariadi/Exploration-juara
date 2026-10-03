'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import type { Alert, Project } from '@/types';
import { formatDate, formatRupiah } from '@/lib/utils';
import { baselineAvailability } from '@/lib/baseline';
import { InsightBadge, Panel } from '@/components/shared/ui';

export function OverviewTab({ project, onOpenAlert }: { project: Project; onOpenAlert: (alert: Alert) => void }) {
  const m = project.metrics;
  const active = project.baselines.find((version) => version.status === 'ACTIVE');
  const available = active ? baselineAvailability(active) : null;
  const hasCost = project.actualCosts.length > 0;
  const comparison = [
    {
      label: 'Biaya proyek',
      reference: available?.budget ? formatRupiah(m.plannedCost) : 'RAB belum menjadi acuan',
      current: hasCost ? formatRupiah(m.actualCost) : 'Biaya belum dicatat',
      result: !available?.budget ? 'Belum dapat dibandingkan' : !hasCost ? 'Menunggu catatan biaya' : m.budgetVariance > 0 ? `Melebihi rencana ${formatRupiah(m.budgetVariance)}` : `Sisa rencana ${formatRupiah(Math.max(0, -m.budgetVariance))}`,
      note: 'RAB dibanding biaya yang sudah dicatat.',
    },
    {
      label: 'Revisi',
      reference: available?.revisionLimit ? `${m.includedRevisions} revisi termasuk` : 'Batas revisi belum ada',
      current: `${m.actualRevisions} revisi dicatat`,
      result: !available?.revisionLimit ? 'Belum dapat dibandingkan' : m.revisionVariance > 0 ? `${m.revisionVariance} di luar kesepakatan` : 'Masih dalam batas',
      note: 'Tambahan revisi dapat diajukan sebagai perubahan.',
    },
    {
      label: 'Tenggat',
      reference: available?.deadline && m.deadline ? formatDate(m.deadline) : 'Tenggat belum ada',
      current: m.projectedFinish ? formatDate(m.projectedFinish) : 'Perkiraan belum dicatat',
      result: m.deadlineVarianceDays === null ? 'Belum bisa dibandingkan' : m.deadlineVarianceDays > 0 ? `Lewat ${m.deadlineVarianceDays} hari` : 'Sesuai tenggat',
      note: 'Perkiraan selesai dicatat di Pemantauan.',
    },
    {
      label: 'Tagihan',
      reference: available?.billing ? `Hak tagih ${formatRupiah(m.billableValue)}` : 'Syarat tagih belum ada',
      current: project.invoices.length ? `Ditagih ${formatRupiah(m.billedValue)}` : 'Tagihan belum dicatat',
      result: !available?.billing ? 'Hak tagih belum dapat dihitung' : m.unbilledValue > 0 ? `Belum ditagih ${formatRupiah(m.unbilledValue)}` : m.billableValue > 0 ? 'Semua hak tagih sudah dicatat' : 'Belum ada tahap siap tagih',
      note: 'Hak tagih muncul saat syarat tahap terpenuhi.',
    },
    {
      label: 'Pembayaran',
      reference: `Tagihan ${formatRupiah(m.billedValue)}`,
      current: `Dibayar ${formatRupiah(m.paidValue)}`,
      result: m.billedValue > m.paidValue ? `Belum dibayar ${formatRupiah(m.billedValue - m.paidValue)}` : m.billedValue > 0 ? 'Semua tagihan tercatat lunas' : 'Belum ada tagihan tercatat',
      note: 'Pembayaran dicatat di Keuangan.',
    },
  ];

  return (
    <div className="space-y-5">
      <Panel title="Acuan dan kondisi sekarang" description={`Acuan ${m.baselineVersion} dibandingkan dengan catatan proyek. Buka bagian terkait untuk memperbarui data.`}>
        <div className="overflow-x-auto rounded-xl border border-zinc-200">
          <table className="w-full min-w-[880px] border-collapse text-left text-sm">
            <thead className="bg-zinc-50"><tr>
              <th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 font-semibold">Yang diperiksa</th>
              <th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 font-semibold">Acuan</th>
              <th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 font-semibold">Tercatat sekarang</th>
              <th scope="col" className="border-b border-zinc-200 px-4 py-3 font-semibold">Hasil</th>
            </tr></thead>
            <tbody>{comparison.map((row) => (
              <tr key={row.label} className="hover:bg-zinc-50 [&:not(:last-child)>td]:border-b [&>td]:border-zinc-200">
                <td className="border-r px-4 py-3"><strong className="text-zinc-950">{row.label}</strong><span className="mt-1 block text-sm text-zinc-500">{row.note}</span></td>
                <td className="border-r px-4 py-3 tabular-nums">{row.reference}</td>
                <td className="border-r px-4 py-3 tabular-nums">{row.current}</td>
                <td className="px-4 py-3 font-semibold text-zinc-900">{row.result}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Hasil pemeriksaan" description={`Diperbarui saat data proyek berubah · terakhir ${formatDate(m.computedAt)}`}>
        <div className="overflow-x-auto rounded-xl border border-zinc-200">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead className="bg-zinc-50"><tr>
              {['Pemeriksaan', 'Acuan', 'Tercatat', 'Selisih', 'Status', 'Bukti'].map((heading, index) => <th key={heading} scope="col" className={`border-b border-zinc-200 px-4 py-3 font-semibold ${index < 5 ? 'border-r' : ''}`}>{heading}</th>)}
            </tr></thead>
            <tbody>{project.reconciliation.map((check) => {
              const alert = project.alerts.find((a) => a.id === check.alertId);
              return <tr key={check.key} className="hover:bg-zinc-50 [&:not(:last-child)>td]:border-b [&>td]:border-zinc-200">
                <td className="border-r px-4 py-3"><strong className="text-zinc-900">{check.label}</strong><span className="mt-1 block text-sm text-zinc-500">{check.explanation}</span></td>
                <td className="border-r px-4 py-3">{check.expected}</td>
                <td className="border-r px-4 py-3">{check.actual}</td>
                <td className="border-r px-4 py-3 font-semibold">{check.difference}</td>
                <td className="border-r px-4 py-3"><InsightBadge status={check.status} /></td>
                <td className="px-4 py-3">{alert && <button type="button" onClick={() => onOpenAlert(alert)} className="font-semibold text-red-700 hover:underline">Lihat bukti</button>}</td>
              </tr>;
            })}{project.reconciliation.length === 0 && <tr><td colSpan={6} className="px-4 py-5 text-zinc-600">Belum ada pemeriksaan yang memiliki acuan. Lengkapi kesepakatan atau RAB di tab Acuan proyek.</td></tr>}</tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Riwayat kegiatan" description="Catatan terbaru ditampilkan lebih dulu.">
        {project.events.length === 0 ? <p className="text-sm text-zinc-500">Belum ada kegiatan.</p> : (
          <ol className="space-y-2">{project.events.slice(0, 15).map((evt) => (
            <li key={evt.id} className="flex items-start gap-3 rounded-xl border border-zinc-200 p-3 text-sm">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2"><strong className="text-zinc-900">{evt.title}</strong><span className="text-zinc-500">{formatDate(evt.date)}</span></div>
                {evt.description && <p className="mt-1 text-zinc-600">{evt.description}</p>}
                <span className="text-zinc-500">{evt.author}</span>
              </div>
            </li>
          ))}</ol>
        )}
      </Panel>
    </div>
  );
}
