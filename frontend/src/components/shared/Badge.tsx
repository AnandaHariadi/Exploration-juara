import React from 'react';
import { ProjectStatus, AlertSeverity, ScopeStatus, BillingStatus } from '@/types';

export const StatusBadge: React.FC<{ status: ProjectStatus }> = ({ status }) => {
  const styles: Record<ProjectStatus, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    AT_RISK: 'bg-red-50 text-red-700 border-red-200',
    BASELINE_PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
    COMPLETED: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  };

  const labels: Record<ProjectStatus, string> = {
    ACTIVE: 'Berjalan',
    AT_RISK: 'Perlu perhatian',
    BASELINE_PENDING: 'Menunggu persetujuan',
    DRAFT: 'Draf',
    COMPLETED: 'Selesai',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

export const SeverityBadge: React.FC<{ severity: AlertSeverity }> = ({ severity }) => {
  const styles: Record<AlertSeverity, string> = {
    CRITICAL: 'bg-red-100 text-red-800 border-red-300 font-bold',
    HIGH: 'bg-rose-50 text-rose-700 border-rose-200',
    MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
    LOW: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  const labels: Record<AlertSeverity, string> = { CRITICAL: 'Kritis', HIGH: 'Tinggi', MEDIUM: 'Sedang', LOW: 'Rendah' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border uppercase tracking-wider ${styles[severity]}`}>
      {labels[severity]}
    </span>
  );
};

export const ScopeBadge: React.FC<{ status: ScopeStatus }> = ({ status }) => {
  const styles: Record<ScopeStatus, string> = {
    MATCH: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    NEEDS_REVIEW: 'bg-amber-100 text-amber-800 border-amber-300 font-semibold',
    APPROVED_CHANGE: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };

  const labels: Record<ScopeStatus, string> = {
    MATCH: 'Sesuai kesepakatan',
    NEEDS_REVIEW: 'Perlu ditinjau',
    APPROVED_CHANGE: 'Perubahan disetujui',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

export const BillingBadge: React.FC<{ status: BillingStatus }> = ({ status }) => {
  const styles: Record<BillingStatus, string> = {
    UNBILLED: 'bg-amber-50 text-amber-700 border-amber-200 font-bold',
    INVOICED: 'bg-blue-50 text-blue-700 border-blue-200',
    PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  const labels: Record<BillingStatus, string> = { UNBILLED: 'Belum ditagih', INVOICED: 'Sudah ditagih', PAID: 'Lunas' };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};
