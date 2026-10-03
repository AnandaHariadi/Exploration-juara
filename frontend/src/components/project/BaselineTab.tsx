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
      <div className="space-y-5">
        <Panel title={`Acuan aktif ${active?.label ?? ''}`} description={active ? `Disetujui ${formatDate(active.createdAt)} oleh ${active.createdBy} · ${active.sourceDetail}` : undefined}>
          <div className="overflow-x-auto rounded-xl border border-zinc-200">
            <table className="w-full min-w-[520px] border-collapse text-left text-sm">
              <thead className="bg-zinc-50"><tr><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 font-semibold">Isi kesepakatan</th><th scope="col" className="border-b border-zinc-200 px-4 py-3 font-semibold">Yang berlaku</th></tr></thead>
              <tbody className="[&>tr:not(:last-child)>*]:border-b [&>tr>*]:border-zinc-200">
                <tr><th scope="row" className="w-48 border-r px-4 py-3 font-medium">Nilai kontrak</th><td className="px-4 py-3 font-semibold tabular-nums">{formatRupiah(a.contractValue)}</td></tr>
                <tr><th scope="row" className="border-r px-4 py-3 font-medium">Periode</th><td className="px-4 py-3">{formatDate(a.startDate)} – {formatDate(a.deadline)}</td></tr>
                <tr><th scope="row" className="border-r px-4 py-3 font-medium">Batas revisi</th><td className="px-4 py-3">{a.revisionLimit} revisi</td></tr>
                <tr><th scope="row" className="border-r px-4 py-3 font-medium">Nomor kontrak</th><td className="px-4 py-3">{a.contractNumber || 'Belum dicatat'}</td></tr>
                <tr><th scope="row" className="border-r px-4 py-3 font-medium">Syarat pembayaran</th><td className="px-4 py-3">{a.paymentTerms || 'Belum dicatat'}</td></tr>
              </tbody>
            </table>
          </div>

          <h3 className="mt-5 text-sm font-bold text-zinc-900">Tahap dan syarat tagih</h3>
          <div className="mt-2 overflow-x-auto rounded-xl border border-zinc-200">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead className="bg-zinc-50"><tr><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 font-semibold">Tahap</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 font-semibold">Syarat tagih</th><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 text-right font-semibold">Porsi</th><th scope="col" className="border-b border-zinc-200 px-4 py-3 text-right font-semibold">Nilai</th></tr></thead>
              <tbody className="[&>tr:not(:last-child)>td]:border-b [&>tr>td]:border-zinc-200">{a.milestones.map((m) => <tr key={m.id}><td className="border-r px-4 py-3 font-semibold">{m.title}</td><td className="border-r px-4 py-3">{m.trigger ?? m.title}{m.targetDate ? ` · target ${formatDate(m.targetDate)}` : ''}</td><td className="border-r px-4 py-3 text-right tabular-nums">{m.percentage}%</td><td className="px-4 py-3 text-right font-semibold tabular-nums">{formatRupiah(m.value)}</td></tr>)}</tbody>
            </table>
          </div>

          <h3 className="mt-5 text-sm font-bold text-zinc-900">Ruang lingkup</h3>
          <div className="mt-2 overflow-x-auto rounded-xl border border-zinc-200"><table className="w-full min-w-[520px] border-collapse text-left text-sm"><thead className="bg-zinc-50"><tr><th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 font-semibold">Pekerjaan</th><th scope="col" className="border-b border-zinc-200 px-4 py-3 font-semibold">Status</th></tr></thead><tbody className="[&>tr:not(:last-child)>td]:border-b [&>tr>td]:border-zinc-200">{a.scopeItems.map((s) => <tr key={s.id}><td className="border-r px-4 py-3">{s.title}</td><td className="px-4 py-3"><ScopeBadge status={s.status} /></td></tr>)}</tbody></table></div>

          <details className="mt-5 rounded-xl border border-zinc-200 p-4 text-sm">
            <summary className="cursor-pointer font-semibold text-zinc-900">Lihat sumber angka dan ketentuan</summary>
            <div className="mt-3 space-y-3"><div><strong>Nilai kontrak</strong><SourceQuote projectId={project.id} source={a.sources?.contractValue} /></div><div><strong>Tenggat</strong><SourceQuote projectId={project.id} source={a.sources?.deadline} /></div><div><strong>Batas revisi</strong><SourceQuote projectId={project.id} source={a.sources?.revisionLimit} /></div>{a.milestones.map((m) => m.source && <div key={m.id}><strong>{m.title}</strong><SourceQuote projectId={project.id} source={m.source} /></div>)}</div>
          </details>

          {a.clausesSummary.length > 0 && (
            <>
              <h3 className="mt-5 text-sm font-bold text-zinc-900">Klausul lain</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700">{a.clausesSummary.map((c) => <li key={c.clauseNumber}>{c.description}</li>)}</ul>
            </>
          )}
        </Panel>

        <div className="space-y-5">
          <Panel title="Rencana biaya (RAB)" description={project.planBaseline.sourceFile ? `Dari ${project.planBaseline.sourceFile}` : 'Diisi saat menyetujui acuan'}>
            <div className="overflow-x-auto rounded-xl border border-zinc-200"><table className="w-full min-w-[520px] border-collapse text-left text-sm"><thead className="bg-zinc-50"><tr><th scope="col" className="border-b border-r border-zinc-200 px-3 py-3 font-semibold">Kategori / pekerjaan</th><th scope="col" className="border-b border-zinc-200 px-3 py-3 text-right font-semibold">Rencana biaya</th></tr></thead><tbody className="[&>tr:not(:last-child)>td]:border-b [&>tr>td]:border-zinc-200">{project.planBaseline.items.map((item) => <tr key={item.id}><td className="border-r px-3 py-3"><strong className="text-zinc-900">{item.category}</strong><span className="block text-sm text-zinc-600">{item.description}</span></td><td className="px-3 py-3 text-right font-semibold tabular-nums">{formatRupiah(item.plannedAmount)}</td></tr>)}</tbody><tfoot className="bg-zinc-50"><tr><th scope="row" className="border-r border-t border-zinc-200 px-3 py-3 text-left">Total RAB</th><td className="border-t border-zinc-200 px-3 py-3 text-right font-bold tabular-nums">{formatRupiah(project.planBaseline.totalPlannedCost)}</td></tr></tfoot></table></div>
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

      <Panel title="Riwayat versi acuan" description="Versi lama diarsipkan. Hanya permintaan perubahan yang disetujui membuat versi baru.">
        <div className="overflow-x-auto rounded-xl border border-zinc-200">
          <table className="w-full min-w-[980px] border-collapse text-left text-sm">
            <thead className="bg-zinc-50"><tr>
              <th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 font-semibold">Versi</th>
              <th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 text-right font-semibold">Nilai kontrak</th>
              <th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 text-right font-semibold">RAB</th>
              <th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 font-semibold">Tenggat</th>
              <th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 text-right font-semibold">Batas revisi</th>
              <th scope="col" className="border-b border-zinc-200 px-4 py-3 font-semibold">Dasar perubahan</th>
            </tr></thead>
            <tbody className="divide-y divide-zinc-200">
              {versions.map((v) => (
                <tr key={v.id} className={v.status === 'ACTIVE' ? 'bg-emerald-50/40' : undefined}>
                  <td className="border-r border-zinc-200 px-4 py-3"><strong className="block text-zinc-900">{v.label}</strong><span className={v.status === 'ACTIVE' ? 'font-semibold text-emerald-700' : 'text-zinc-500'}>{v.status === 'ACTIVE' ? 'Aktif' : 'Diarsipkan'}</span><span className="mt-1 block text-zinc-500">{formatDate(v.createdAt)} oleh {v.createdBy}</span></td>
                  <td className="border-r border-zinc-200 px-4 py-3 text-right tabular-nums">{formatRupiah(v.contractValue)}</td>
                  <td className="border-r border-zinc-200 px-4 py-3 text-right tabular-nums">{formatRupiah(v.plannedCost)}</td>
                  <td className="border-r border-zinc-200 px-4 py-3">{formatDate(v.deadline)}</td>
                  <td className="border-r border-zinc-200 px-4 py-3 text-right tabular-nums">{v.revisionLimit}</td>
                  <td className="px-4 py-3 text-zinc-700">{v.sourceDetail}{v.changes && v.changes.length > 0 && <ul className="mt-2 space-y-1">{v.changes.map((change) => <li key={change.field}>{change.label}: <span className="line-through">{change.from}</span> menjadi <strong>{change.to}</strong></li>)}</ul>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
