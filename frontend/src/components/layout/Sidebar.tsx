'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderGit2,
  FileCheck2,
  Activity,
  Receipt,
  GitPullRequest,
  AlertTriangle,
  FileSearch,
  RotateCcw,
  ChevronRight,
  Home
} from 'lucide-react';
import { storageService } from '@/services/storage';
import { UserPersonaId, USER_PERSONAS } from '@/types';

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
  const [activePersonaId, setActivePersonaId] = React.useState<UserPersonaId>('BUDI');

  const refreshState = React.useCallback(() => {
    const alerts = storageService.getAllAlerts();
    const activeAlerts = alerts.filter((a) => a.status === 'NEW');
    setAlertCount(activeAlerts.length);
    setActivePersonaId(storageService.getActivePersona());
  }, []);

  React.useEffect(() => {
    refreshState();
    const handleDataUpdate = () => refreshState();
    const handlePersonaUpdate = () => setActivePersonaId(storageService.getActivePersona());

    window.addEventListener('clara_data_updated', handleDataUpdate);
    window.addEventListener('clara_persona_changed', handlePersonaUpdate);
    return () => {
      window.removeEventListener('clara_data_updated', handleDataUpdate);
      window.removeEventListener('clara_persona_changed', handlePersonaUpdate);
    };
  }, [refreshState]);

  const navItems: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: FolderGit2 },
    { name: 'Contract & RAB', href: '/projects/new', icon: FileCheck2, badge: 'New' },
    { name: 'Monitoring & Scope', href: '/monitoring', icon: Activity },
    { name: 'Finance & Realization', href: '/finance', icon: Receipt },
    { name: 'Change Requests', href: '/change-requests', icon: GitPullRequest },
    { 
      name: 'Alerts & Evidence', 
      href: '/alerts', 
      icon: AlertTriangle, 
      badge: alertCount > 0 ? `${alertCount}` : undefined,
      badgeColor: 'bg-red-600 text-white'
    },
    { name: 'Klausul & Legal Audit', href: '/legal-ai', icon: FileSearch, badge: 'Audit', badgeColor: 'bg-zinc-800 text-zinc-300' },
  ];

  const handleResetData = () => {
    if (confirm('Reset seluruh data simulasi ke baseline awal demo CLARA?')) {
      storageService.resetToDefault();
      window.location.reload();
    }
  };

  const persona = USER_PERSONAS[activePersonaId] || USER_PERSONAS.BUDI;

  return (
    <aside className="w-64 bg-zinc-950 text-zinc-300 flex flex-col h-screen fixed left-0 top-0 border-r border-zinc-800 z-30 select-none">
      {/* Brand Header with Red Clara Logo */}
      <div className="h-20 flex items-center px-6 border-b border-zinc-800/80 bg-black/40">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-600 via-rose-600 to-red-600 flex items-center justify-center text-white font-heading font-black text-lg shadow-sm group-hover:scale-105 transition-transform shrink-0">
            C
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-extrabold text-base text-white tracking-wider">CLARA</span>
              <span className="text-[10px] uppercase font-bold tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.2 rounded">
                ASTRA
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 leading-none">Contract Intelligence</p>
          </div>
        </Link>
      </div>

      {/* Main Nav Items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          <span>Reconciliation Modules</span>
          <Link href="/" className="text-zinc-400 hover:text-red-400 flex items-center gap-1 font-semibold normal-case">
            <Home className="w-3 h-3" />
            <span>Landing</span>
          </Link>
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-red-600/20 to-orange-600/10 text-red-400 border border-red-500/30 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-red-400' : 'text-zinc-400'}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    item.badgeColor || 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Workspace & Active Persona Footer */}
      <div className="p-3 border-t border-zinc-800/80 bg-black/40 space-y-2">
        {/* Active Persona Box */}
        <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Current Role</span>
            <span className="text-[10px] font-mono font-bold text-red-400">{activePersonaId}</span>
          </div>
          <p className="text-xs font-bold text-white mt-0.5 truncate">{persona.name}</p>
          <p className="text-[10px] text-zinc-400 truncate">{persona.roleTitle}</p>
        </div>

        <button
          onClick={handleResetData}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium text-zinc-400 hover:text-orange-400 hover:bg-orange-500/10 border border-transparent hover:border-orange-500/20 transition-colors"
          title="Reset dataset demo ke baseline awal"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Demo Data</span>
        </button>
      </div>
    </aside>
  );
};
