'use client';

import React from 'react';
import { FileSpreadsheet, FileText } from 'lucide-react';
import type { Project } from '@/types';
import { documentUrl } from '@/services/dataClient';
import { formatDate, formatRupiah } from '@/lib/utils';
import { Panel, SourceQuote } from '@/components/shared/ui';
import { ScopeBadge } from '@/components/shared/Badge';

export function BaselineTab({ project }: { project: Project }) {
  const a = project.agreementBaseline;
  const active = project.baselines.find((b) => b.status === 'ACTIVE');
  const versions = [...project.baselines].sort((x, y) => y.version - x.version);
  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Panel title={`Acuan aktif ${active?.label ?? ''}`} description={active ? `Disetujui ${formatDate(active.createdAt)} oleh ${active.createdBy} · ${active.sourceDetail}` : undefined}>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div><dt className="text-xs text-zinc-500">Nilai kontrak</dt><dd className="text-lg font-bold">{formatRupiah(a.contractValue)}</dd><SourceQuote projectId={project.id} source={a.sources?.contractValue} /></div>
            <div><dt className="text-xs text-zinc-500">Periode</dt><dd className="text-lg font-bold">{formatDate(a.startDate)} – {formatDate(a.deadline)}</dd><SourceQuote projectId={project.id} source={a.sources?.deadline} /></div>
            <div><dt className="text-xs text-zinc-500">Batas revisi</dt><dd className="text-lg font-bold">{a.revisionLimit} revisi</dd><SourceQuote projectId={project.id} source={a.sources?.revisionLimit} /></div>
            <div><dt className="text-xs text-zinc-500">Nomor kontrak</dt><dd className="text-lg font-bold">{a.contractNumber || '-'}</dd></div>
          </dl>
          <p className="mt-4 rounded-xl bg-zinc-50 p-3 text-sm text-zinc-700"><span className="font-semibold">Ketentuan pembayaran:</span> {a.paymentTerms || '-'}</p>

          <h3 className="mt-5 text-sm font-bold text-zinc-900">Termin & syarat tagih</h3>
          <div className="mt-2 space-y-2">
            {a.milestones.map((m) => (
              <div key={m.id} className="rounded-xl border border-zinc-200 p-3 text-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-semibold text-zinc-900">{m.title} · {m.percentage}%</span>
                  <span className="font-bold">{formatRupiah(m.value)}</span>
                </div>
                <p className="text-xs text-zinc-500">Syarat: {m.trigger ?? m.title}{m.targetDate ? ` · target ${formatDate(m.targetDate)}` : ''}</p>
                {m.source && <SourceQuote projectId={project.id} source={m.source} />}
              </div>
            ))}
          </div>

          <h3 className="mt-5 text-sm font-bold text-zinc-900">Ruang lingkup</h3>
          <ul className="mt-2 space-y-1.5">
            {a.scopeItems.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-sm">
                <span>{s.title}</span>
                <ScopeBadge status={s.status} />
              </li>
            ))}
          </ul>

          {a.clausesSummary.length > 0 && (
            <>
              <h3 className="mt-5 text-sm font-bold text-zinc-900">Klausul lain</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700">{a.clausesSummary.map((c) => <li key={c.clauseNumber}>{c.description}</li>)}</ul>
            </>
          )}
        </Panel>

        <div className="space-y-5">
          <Panel title="Rencana biaya (RAB)" description={project.planBaseline.sourceFile ? `Dari ${project.planBaseline.sourceFile}` : 'Diisi saat menyetujui acuan'}>
            <ul className="divide-y divide-zinc-100 text-sm">
              {project.planBaseline.items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 py-2">
                  <span><span className="font-semibold text-zinc-900">{item.category}</span><span className="block text-xs text-zinc-500">{item.description}</span></span>
                  <span className="font-semibold">{formatRupiah(item.plannedAmount)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 flex justify-between border-t border-zinc-200 pt-3 text-sm font-bold"><span>Total</span><span>{formatRupiah(project.planBaseline.totalPlannedCost)}</span></p>
          </Panel>

          <Panel title="Dokumen sumber">
            {project.documents.length === 0 ? (
              <p className="text-sm text-zinc-500">Acuan diisi manual; tidak ada dokumen.</p>
            ) : (
              <ul className="space-y-2">
                {project.documents.map((d) => (
                  <li key={d.id}>
                    <a href={documentUrl(project.id, d.id)} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-zinc-50">
                      {d.kind === 'CONTRACT' ? <FileText className="h-4 w-4" /> : <FileSpreadsheet className="h-4 w-4" />}
                      <span className="truncate">{d.fileName}</span>
                      {d.isSample && <span className="ml-auto rounded bg-orange-50 px-1.5 text-[11px] font-semibold text-orange-800">contoh</span>}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      <Panel title="Riwayat versi acuan" description="Versi lama tidak pernah diubah. Hanya permintaan perubahan yang disetujui membuat versi baru.">
        <ol className="space-y-3">
          {versions.map((v) => (
            <li key={v.id} className={`rounded-xl border p-4 ${v.status === 'ACTIVE' ? 'border-emerald-300 bg-emerald-50/40' : 'border-zinc-200 bg-zinc-50'}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-bold text-zinc-900">{v.label}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${v.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-200 text-zinc-700'}`}>{v.status === 'ACTIVE' ? 'Aktif' : 'Diarsipkan'}</span>
                <span className="text-xs text-zinc-500">{formatDate(v.createdAt)} · {v.createdBy}</span>
              </div>
              <p className="mt-1 text-sm text-zinc-700">{v.sourceDetail}</p>
              <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-4">
                <div><dt className="text-xs text-zinc-500">Nilai kontrak</dt><dd className="font-semibold">{formatRupiah(v.contractValue)}</dd></div>
                <div><dt className="text-xs text-zinc-500">RAB</dt><dd className="font-semibold">{formatRupiah(v.plannedCost)}</dd></div>
                <div><dt className="text-xs text-zinc-500">Tenggat</dt><dd className="font-semibold">{formatDate(v.deadline)}</dd></div>
                <div><dt className="text-xs text-zinc-500">Batas revisi</dt><dd className="font-semibold">{v.revisionLimit}</dd></div>
              </dl>
              {v.changes && v.changes.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-xs text-zinc-700">
                  {v.changes.map((c) => <li key={c.field}>{c.label}: <span className="line-through">{c.from}</span> → <strong>{c.to}</strong></li>)}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  );
}
