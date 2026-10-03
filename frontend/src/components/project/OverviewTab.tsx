'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import type { Alert, Project } from '@/types';
import { formatCompactRupiah, formatDate, formatRupiah } from '@/lib/utils';
import { InsightBadge, Panel } from '@/components/shared/ui';

function Column({ title, subtitle, rows }: { title: string; subtitle: string; rows: { label: string; value: React.ReactNode; note?: string; tone?: 'warn' | 'bad' | 'good' }[] }) {
  const tones = { warn: 'text-amber-700', bad: 'text-red-700', good: 'text-emerald-700' };
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-red-700">{title}</p>
      <p className="text-xs text-zinc-500">{subtitle}</p>
      <dl className="mt-3 space-y-2.5">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-xs text-zinc-500">{row.label}</dt>
            <dd className={`text-base font-bold ${row.tone ? tones[row.tone] : 'text-zinc-950'}`}>{row.value}</dd>
            {row.note && <dd className="text-[11px] text-zinc-500">{row.note}</dd>}
          </div>
        ))}
      </dl>
    </div>
  );
}

export function OverviewTab({ project, onOpenAlert }: { project: Project; onOpenAlert: (alert: Alert) => void }) {
  const m = project.metrics;
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Column
          title="Sepakat"
          subtitle={`Acuan ${m.baselineVersion}`}
          rows={[
            { label: 'Nilai kontrak', value: formatRupiah(m.contractValue) },
            { label: 'Tenggat', value: formatDate(m.deadline ?? '') },
            { label: 'Batas revisi', value: `${m.includedRevisions} revisi` },
          ]}
        />
        <Column
          title="Rencana"
          subtitle="RAB acuan aktif"
          rows={[
            { label: 'Rencana biaya (RAB)', value: formatRupiah(m.plannedCost) },
            { label: 'Laba rencana', value: m.plannedProfit === null ? 'Tidak tersedia' : formatRupiah(m.plannedProfit), note: 'Nilai kontrak − RAB' },
          ]}
        />
        <Column
          title="Aktual"
          subtitle="Data yang dicatat"
          rows={[
            { label: 'Progres pekerjaan', value: `${m.progress}%` },
            {
              label: 'Biaya aktual',
              value: `${formatCompactRupiah(m.actualCost)} / ${formatCompactRupiah(m.plannedCost)}`,
              note: m.budgetUtilization === null ? 'Pemakaian anggaran tidak tersedia' : `${m.budgetUtilization.toLocaleString('id-ID')}% anggaran terpakai · selisih ${m.budgetVariance >= 0 ? '+' : ''}${formatCompactRupiah(m.budgetVariance)}`,
              tone: m.budgetVariance > 0 ? 'bad' : m.budgetUtilization !== null && m.budgetUtilization > m.progress + 10 ? 'warn' : undefined,
            },
            { label: 'Revisi', value: `${m.actualRevisions} dari ${m.includedRevisions}`, tone: m.revisionVariance > 0 ? 'bad' : undefined, note: m.revisionVariance > 0 ? `+${m.revisionVariance} di luar acuan` : undefined },
          ]}
        />
        <Column
          title="Terealisasi"
          subtitle="Tagihan & kas"
          rows={[
            { label: 'Siap ditagih', value: formatRupiah(m.billableValue) },
            { label: 'Sudah ditagih', value: formatRupiah(m.billedValue) },
            { label: 'Belum ditagih', value: formatRupiah(m.unbilledValue), tone: m.unbilledValue > 0 ? 'warn' : undefined, note: m.unbilledValue > 0 ? 'Hak tagih tanpa invoice — bukan kerugian' : undefined },
            { label: 'Sudah dibayar', value: formatRupiah(m.paidValue), tone: 'good' },
            { label: 'Profit aktual', value: m.actualProfit === null ? 'Belum tersedia' : formatRupiah(m.actualProfit), note: m.actualProfitNote },
          ]}
        />
      </div>

      <Panel title="Rekonsiliasi" description={`Dihitung ulang otomatis setiap ada perubahan data · terakhir ${formatDate(m.computedAt)}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
                <th className="py-2 pr-3">Pemeriksaan</th>
                <th className="py-2 pr-3">Acuan</th>
                <th className="py-2 pr-3">Aktual</th>
                <th className="py-2 pr-3">Selisih</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2"><span className="sr-only">Aksi</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {project.reconciliation.map((check) => {
                const alert = project.alerts.find((a) => a.id === check.alertId);
                return (
                  <tr key={check.key}>
                    <td className="py-3 pr-3"><span className="font-semibold text-zinc-900">{check.label}</span><p className="text-xs text-zinc-500">{check.explanation}</p></td>
                    <td className="py-3 pr-3 text-zinc-700">{check.expected}</td>
                    <td className="py-3 pr-3 text-zinc-700">{check.actual}</td>
                    <td className="py-3 pr-3 font-semibold text-zinc-900">{check.difference}</td>
                    <td className="py-3 pr-3"><InsightBadge status={check.status} /></td>
                    <td className="py-3 text-right">{alert && <button type="button" onClick={() => onOpenAlert(alert)} className="text-xs font-semibold text-red-700 hover:underline">Lihat bukti</button>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Riwayat kegiatan" description="Semua perubahan data proyek, terbaru di atas.">
        {project.events.length === 0 ? (
          <p className="text-sm text-zinc-500">Belum ada kegiatan.</p>
        ) : (
          <ol className="space-y-2">
            {project.events.slice(0, 15).map((evt) => (
              <li key={evt.id} className="flex items-start gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-3 text-sm">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <strong className="font-semibold text-zinc-900">{evt.title}</strong>
                    <span className="text-xs text-zinc-500">{formatDate(evt.date)}</span>
                  </div>
                  {evt.description && <p className="mt-0.5 text-zinc-600">{evt.description}</p>}
                  <span className="text-xs text-zinc-500">{evt.author}</span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </div>
  );
}
