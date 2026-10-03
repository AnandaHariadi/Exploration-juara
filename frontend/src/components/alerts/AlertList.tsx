'use client';

import React from 'react';
import Link from 'next/link';
import type { Alert } from '@/types';
import { SeverityBadge } from '@/components/shared/Badge';
import { EmptyState, InsightBadge, btn } from '@/components/shared/ui';
import { impactText } from './EvidenceDrawer';
import { alertStatusLabels, alertTypeLabels, BasisBadge } from '@/components/shared/labels';

export { alertTypeLabels, alertStatusLabels } from '@/components/shared/labels';

export function AlertList({ alerts, onOpen, showProject = false, emptyText }: { alerts: Alert[]; onOpen: (alert: Alert) => void; showProject?: boolean; emptyText: string }) {
  if (alerts.length === 0) return <EmptyState title={emptyText} />;
  return (
    <div className="space-y-3">
      {alerts.map((item) => (
        <article key={item.id} className={`rounded-2xl border bg-white p-5 shadow-sm ${item.status === 'RESOLVED' || item.status === 'SUPERSEDED' ? 'border-zinc-200 opacity-75' : 'border-zinc-200'}`}>
          <div className="flex flex-wrap items-center gap-2">
            <InsightBadge status={item.classification} />
            <BasisBadge basis={item.basis} />
            <SeverityBadge severity={item.severity} />
            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-700">{alertTypeLabels[item.type]}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${item.status === 'NEW' ? 'bg-red-50 text-red-700' : item.status === 'RESOLVED' || item.status === 'SUPERSEDED' ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-700'}`}>{alertStatusLabels[item.status]}</span>
          </div>
          <h3 className="mt-3 text-base font-semibold text-zinc-950">{item.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-zinc-600">{item.description}</p>
          {item.resolution && <p className="mt-2 text-xs text-emerald-800">{item.resolution.note}</p>}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4">
            <div>
              {showProject && <p className="text-xs text-zinc-500">{item.projectName}</p>}
              <p className="text-sm font-semibold text-zinc-900">{impactText(item)} <span className="text-xs font-normal text-zinc-500">· {item.impactLabel}</span></p>
            </div>
            <div className="flex gap-2">
              {showProject && <Link href={`/projects/${item.projectId}`} className={btn.ghost}>Buka proyek</Link>}
              <button type="button" onClick={() => onOpen(item)} className={btn.primary}>Lihat bukti</button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
