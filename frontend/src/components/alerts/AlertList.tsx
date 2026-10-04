'use client';

import React from 'react';
import Link from 'next/link';
import type { Alert } from '@/types';
import { SeverityBadge } from '@/components/shared/Badge';
import { EmptyState, InsightBadge } from '@/components/shared/ui';
import { impactText } from './EvidenceDrawer';
import { alertStatusLabels, alertTypeLabels, BasisBadge } from '@/components/shared/labels';

export { alertTypeLabels, alertStatusLabels } from '@/components/shared/labels';

export function AlertList({ alerts, onOpen, showProject = false, emptyText }: { alerts: Alert[]; onOpen: (alert: Alert) => void; showProject?: boolean; emptyText: string }) {
  if (alerts.length === 0) return <EmptyState title={emptyText} />;
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
      <table className="w-full min-w-[980px] border-collapse text-left text-sm">
        <thead className="bg-zinc-50"><tr>
          <th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 font-semibold">Peringatan</th>
          <th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 font-semibold">Hasil pemeriksaan</th>
          <th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 font-semibold">Dampak terkait</th>
          <th scope="col" className="border-b border-r border-zinc-200 px-4 py-3 font-semibold">Status</th>
          <th scope="col" className="border-b border-zinc-200 px-4 py-3 font-semibold">Rincian</th>
        </tr></thead>
        <tbody className="divide-y divide-zinc-200">{alerts.map((item) => {
          const impact = impactText(item);
          const closed = item.status === 'RESOLVED' || item.status === 'SUPERSEDED';
          return <tr key={item.id} className={closed ? 'bg-zinc-50/60' : 'hover:bg-zinc-50'}>
            <td className="border-r border-zinc-200 px-4 py-3 align-top">
              <strong className="text-zinc-950">{item.title}</strong>
              <span className="mt-1 block text-xs text-zinc-500">{alertTypeLabels[item.type]}{showProject && <> · <Link href={`/projects/${item.projectId}`} className="hover:text-red-700 hover:underline">{item.projectName}</Link></>}</span>
              <span className="mt-1 block max-w-md line-clamp-2 text-zinc-600">{item.description}</span>
            </td>
            <td className="border-r border-zinc-200 px-4 py-3 align-top"><div className="flex flex-wrap gap-1.5"><InsightBadge status={item.classification} /><BasisBadge basis={item.basis} /><SeverityBadge severity={item.severity} /></div></td>
            <td className="border-r border-zinc-200 px-4 py-3 align-top"><strong className="text-zinc-900">{impact}</strong>{impact !== item.impactLabel && <span className="mt-1 block text-xs text-zinc-500">{item.impactLabel}</span>}</td>
            <td className="border-r border-zinc-200 px-4 py-3 align-top"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === 'NEW' ? 'bg-red-50 text-red-700' : closed ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-700'}`}>{alertStatusLabels[item.status]}</span></td>
            <td className="px-4 py-3 align-top"><button type="button" onClick={() => onOpen(item)} className="font-semibold text-red-700 hover:underline">Lihat bukti</button></td>
          </tr>;
        })}</tbody>
      </table>
    </div>
  );
}
