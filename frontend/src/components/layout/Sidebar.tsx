'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderGit2,
  FileCheck2,
  Activity,
  Receipt,
  GitPullRequest,
  AlertTriangle,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { storageService } from '@/services/storage';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [alertCount, setAlertCount] = React.useState<number>(0);

  const refreshAlertCount = React.useCallback(() => {
    const alerts = storageService.getAllAlerts();
    const activeAlerts = alerts.filter((a) => a.status === 'NEW');
    setAlertCount(activeAlerts.length);
  }, []);

  React.useEffect(() => {
    refreshAlertCount();
    const handleUpdate = () => refreshAlertCount();
    window.addEventListener('clara_data_updated', handleUpdate);
    return () => window.removeEventListener('clara_data_updated', handleUpdate);
  }, [refreshAlertCount]);

  const navItems: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: FolderGit2 },
    { name: 'Contract & RAB', href: '/projects/new', icon: FileCheck2, badge: 'Upload' },
    { name: 'Monitoring', href: '/monitoring', icon: Activity },
    { name: 'Finance', href: '/finance', icon: Receipt },
    { name: 'Change Request', href: '/change-requests', icon: GitPullRequest },
    { 
      name: 'Alerts & Evidence', 
      href: '/alerts', 
      icon: AlertTriangle, 
      badge: alertCount > 0 ? `${alertCount}` : undefined,
      badgeColor: 'bg-rose-500 text-white'
    },
    { name: 'Legal AI', href: '/legal-ai', icon: Sparkles, badge: 'AI', badgeColor: 'bg-indigo-500 text-white' },
  ];

  const handleResetData = () => {
    if (confirm('Reset seluruh data simulasi ke baseline awal demo CLARA?')) {
      storageService.resetToDefault();
      window.location.reload();
    }
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800 z-30 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80 bg-slate-950/40">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-white tracking-wider">CLARA</span>
              <span className="text-[10px] uppercase font-semibold tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded">
                MVP
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-none">Contract Intelligence</p>
          </div>
        </Link>
      </div>

      {/* Main Nav Items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Core Platform
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    item.badgeColor || 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Workspace & Demo Controls */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/30 space-y-2">
        <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 flex items-center justify-between">
          <div className="truncate">
            <p className="text-xs font-semibold text-slate-200 truncate">Solusi Digital Nusantara</p>
            <p className="text-[11px] text-slate-500 truncate">Enterprise Project Suite</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </div>

        <button
          onClick={handleResetData}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 transition-colors"
          title="Reset dataset demo ke baseline awal"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Demo Data</span>
        </button>
      </div>
    </aside>
  );
};
