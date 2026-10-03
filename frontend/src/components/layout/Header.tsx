'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Bell, ChevronDown, Sparkles } from 'lucide-react';
import { storageService } from '@/services/storage';
import { Project } from '@/types';

export const Header: React.FC = () => {
  const router = useRouter();
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>('PRJ-001');

  React.useEffect(() => {
    const list = storageService.getProjects();
    setProjects(list);
    const handleUpdate = () => {
      setProjects(storageService.getProjects());
    };
    window.addEventListener('clara_data_updated', handleUpdate);
    return () => window.removeEventListener('clara_data_updated', handleUpdate);
  }, []);

  const handleSelectProject = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = e.target.value;
    setSelectedProjectId(pId);
    if (pId) {
      router.push(`/projects/${pId}`);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 flex items-center justify-between px-8">
      {/* Left: Project Selector */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Context Project:</span>
          <div className="relative">
            <select
              value={selectedProjectId}
              onChange={handleSelectProject}
              className="appearance-none bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold rounded-lg pl-3 pr-8 py-1.5 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
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

      {/* Right: Actions & User */}
      <div className="flex items-center gap-3">
        <Link
          href="/legal-ai"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Legal Clause AI</span>
        </Link>

        <Link
          href="/alerts"
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg relative transition-colors"
          title="Lihat Semua Alert & Bukti"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 bg-rose-500 rounded-full absolute top-1.5 right-1.5"></span>
        </Link>

        <div className="h-5 w-px bg-slate-200" />

        <Link
          href="/projects/new"
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm hover:shadow transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Project</span>
        </Link>

        <div className="flex items-center gap-2 pl-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold text-xs flex items-center justify-center shadow-sm">
            BS
          </div>
          <div className="hidden md:block leading-tight text-left">
            <p className="text-xs font-semibold text-slate-800">Budi Santoso</p>
            <p className="text-[10px] text-slate-500 font-medium">Business / PM</p>
          </div>
        </div>
      </div>
    </header>
  );
};
