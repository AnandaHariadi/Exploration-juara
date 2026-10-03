'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Bell,
  ChevronDown,
  FileSearch,
  ShieldCheck,
  UserCheck,
  Building2,
  DollarSign
} from 'lucide-react';
import { storageService } from '@/services/storage';
import { Project, UserPersonaId, USER_PERSONAS } from '@/types';

export const Header: React.FC = () => {
  const router = useRouter();
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>('PRJ-001');
  const [activePersonaId, setActivePersonaId] = React.useState<UserPersonaId>('BUDI');
  const [isPersonaMenuOpen, setIsPersonaMenuOpen] = React.useState<boolean>(false);

  React.useEffect(() => {
    setProjects(storageService.getProjects());
    setActivePersonaId(storageService.getActivePersona());

    const handleDataUpdate = () => {
      setProjects(storageService.getProjects());
    };
    const handlePersonaUpdate = () => {
      setActivePersonaId(storageService.getActivePersona());
    };

    window.addEventListener('clara_data_updated', handleDataUpdate);
    window.addEventListener('clara_persona_changed', handlePersonaUpdate);
    return () => {
      window.removeEventListener('clara_data_updated', handleDataUpdate);
      window.removeEventListener('clara_persona_changed', handlePersonaUpdate);
    };
  }, []);

  const handleSelectProject = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = e.target.value;
    setSelectedProjectId(pId);
    if (pId) {
      router.push(`/projects/${pId}`);
    }
  };

  const handleSwitchPersona = (pId: UserPersonaId) => {
    storageService.setActivePersona(pId);
    setActivePersonaId(pId);
    setIsPersonaMenuOpen(false);
  };

  const currentPersona = USER_PERSONAS[activePersonaId] || USER_PERSONAS.BUDI;

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 flex items-center justify-between px-6 lg:px-8">
      {/* Left: Project Selector */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Context Project:</span>
          <div className="relative">
            <select
              value={selectedProjectId}
              onChange={handleSelectProject}
              className="appearance-none bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg pl-3 pr-8 py-1.5 hover:bg-slate-100 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-colors"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.id})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Right: Actions & User Persona Switcher */}
      <div className="flex items-center gap-3">
        {/* Legal Clause Search */}
        <Link
          href="/legal-ai"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
          title="Audit dan telusuri klausul kontrak PKS"
        >
          <FileSearch className="w-3.5 h-3.5 text-slate-600" />
          <span>Audit Klausul PKS</span>
        </Link>

        {/* Global Alert Notification */}
        <Link
          href="/alerts"
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg relative transition-colors"
          title="Lihat Peringatan Deviasi Kontrak"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 bg-rose-500 rounded-full absolute top-1.5 right-1.5"></span>
        </Link>

        <div className="h-5 w-px bg-slate-200" />

        {/* Dynamic Action Button according to active Persona */}
        {activePersonaId === 'BUDI' && (
          <Link
            href="/projects/new"
            className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-xs hover:shadow transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload Kontrak</span>
          </Link>
        )}

        {activePersonaId === 'SITI' && (
          <Link
            href="/finance"
            className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-xs hover:shadow transition-all"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Realisasi Billing</span>
          </Link>
        )}

        {activePersonaId === 'HENDRA' && (
          <Link
            href="/alerts"
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-xs hover:shadow transition-all"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Audit Exposure</span>
          </Link>
        )}

        {activePersonaId === 'ADMIN' && (
          <Link
            href="/projects/new"
            className="flex items-center gap-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-xs hover:shadow transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Admin Action</span>
          </Link>
        )}

        {/* Persona Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsPersonaMenuOpen(!isPersonaMenuOpen)}
            className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
          >
            <div className={`w-8 h-8 rounded-lg ${currentPersona.avatarBg} text-white font-bold text-xs flex items-center justify-center shadow-xs`}>
              {currentPersona.initials}
            </div>
            <div className="hidden md:block leading-tight text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900">{currentPersona.name}</span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${currentPersona.badgeBg} ${currentPersona.badgeText}`}>
                  {activePersonaId}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium truncate max-w-[130px]">{currentPersona.roleTitle}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {/* Persona Menu Panel */}
          {isPersonaMenuOpen && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ganti Persona Demo</p>
                <p className="text-xs text-slate-600 mt-0.5">Pilih role untuk melihat tampilan dan wewenang yang berbeda.</p>
              </div>

              <div className="space-y-1 py-1">
                {(['BUDI', 'SITI', 'HENDRA', 'ADMIN'] as UserPersonaId[]).map((pId) => {
                  const p = USER_PERSONAS[pId];
                  const isSelected = activePersonaId === pId;

                  return (
                    <button
                      key={pId}
                      onClick={() => handleSwitchPersona(pId)}
                      className={`w-full text-left p-2.5 rounded-xl flex items-start gap-3 transition-colors ${
                        isSelected
                          ? 'bg-slate-100 border border-slate-200 shadow-2xs'
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg ${p.avatarBg} text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5`}>
                        {p.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 truncate">{p.name}</span>
                          {isSelected && <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                        </div>
                        <p className="text-[11px] font-medium text-slate-700 truncate">{p.roleTitle}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-snug line-clamp-1">{p.primaryFocus}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
