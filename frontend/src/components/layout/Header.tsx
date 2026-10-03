'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bot, ChevronDown, Menu, Plus, X } from 'lucide-react';
import { useActivePersona, useAiHealth, useProjects } from '@/hooks/useClaraData';
import { USER_PERSONAS, UserPersonaId } from '@/types';

const roleNames: Record<UserPersonaId, string> = {
  BUDI: 'Pengelola proyek', SITI: 'Keuangan', HENDRA: 'Pimpinan', ADMIN: 'Admin',
};

interface HeaderProps {
  mobileSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function Header({ mobileSidebarOpen, onToggleSidebar }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { projects, loading: projectsLoading, error: projectsError } = useProjects();
  const { personaId, selectPersona } = useActivePersona();
  const { health } = useAiHealth();
  const [roleOpen, setRoleOpen] = React.useState(false);
  const [switchError, setSwitchError] = React.useState<string | null>(null);
  const roleMenuRef = React.useRef<HTMLDivElement>(null);
  const routeProjectId = pathname.match(/^\/projects\/([^/]+)/)?.[1] ?? '';
  const currentProjectId = routeProjectId === 'new' ? '' : routeProjectId;
  const currentRole = USER_PERSONAS[personaId] ?? USER_PERSONAS.BUDI;

  React.useEffect(() => {
    if (!roleOpen) return;
    const dismiss = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent && event.key === 'Escape') setRoleOpen(false);
      if (event instanceof MouseEvent && !roleMenuRef.current?.contains(event.target as Node)) setRoleOpen(false);
    };
    document.addEventListener('mousedown', dismiss);
    document.addEventListener('keydown', dismiss);
    return () => { document.removeEventListener('mousedown', dismiss); document.removeEventListener('keydown', dismiss); };
  }, [roleOpen]);

  const switchRole = async (id: UserPersonaId) => {
    try { await selectPersona(id); setSwitchError(null); setRoleOpen(false); }
    catch (error) { setSwitchError(error instanceof Error ? error.message : 'Gagal mengganti pengguna demo.'); }
  };

  return <header className="sticky top-0 z-40 border-b-2 border-zinc-200 bg-white">
    <div className="grid h-28 grid-cols-[1fr_auto] grid-rows-[3.5rem_3.5rem] items-center gap-x-3 px-4 sm:px-6 lg:h-20 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:grid-rows-1 lg:px-8">
      <div className="col-start-1 row-start-1 flex items-center gap-3">
        <Link href="/dashboard" className="flex w-fit items-center gap-3" aria-label="CLARA, buka ringkasan">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 font-heading text-lg font-extrabold text-white">C</span>
          <span className="font-heading text-lg font-extrabold tracking-wide text-zinc-950">CLARA</span>
        </Link>
      </div>

      <div className="col-span-2 row-start-2 flex min-w-0 items-center justify-end gap-2 lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:gap-3">
        <Link href="/legal-ai" title={health?.message ?? 'Memeriksa layanan AI'} className={`hidden h-10 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold md:inline-flex ${health === null ? 'border-zinc-200 text-zinc-500' : health.available ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}><Bot size={15} />{health === null ? 'AI…' : health.available ? 'AI siap' : 'AI tidak tersedia'}</Link>
        <Link href="/projects/new" aria-label="Proyek baru" className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-red-600 px-2.5 text-sm font-semibold text-white hover:bg-red-700 sm:px-4"><Plus size={17} strokeWidth={2.5} /><span className="hidden sm:inline">Proyek baru</span></Link>
        <div className="relative min-w-0 flex-1 lg:max-w-72 lg:flex-none lg:w-60 xl:w-72">
          <label htmlFor="pilih-proyek" className="sr-only">Buka proyek</label>
          <select id="pilih-proyek" value={currentProjectId} onChange={(event) => event.target.value && router.push(`/projects/${event.target.value}`)} className="h-10 w-full appearance-none truncate rounded-lg border border-zinc-200 bg-white pl-3 pr-8 text-sm font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-red-500/30">
            <option value="">{projectsLoading ? 'Memuat proyek…' : projectsError ? 'Gagal memuat proyek' : projects.length ? 'Pilih proyek…' : 'Belum ada proyek'}</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
          <ChevronDown size={15} strokeWidth={2.5} aria-hidden="true" className="pointer-events-none absolute right-2.5 top-3 text-zinc-500" />
        </div>
        <div className="relative shrink-0" ref={roleMenuRef}>
          <button type="button" aria-haspopup="menu" aria-expanded={roleOpen} onClick={() => setRoleOpen((current) => !current)} className="flex h-10 items-center gap-2 rounded-lg border border-zinc-200 px-1.5 hover:bg-zinc-50 sm:px-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">{currentRole.initials}</span>
            <span className="hidden text-left xl:block"><span className="block text-xs font-semibold text-zinc-900">{currentRole.name}</span><span className="block text-xs text-zinc-500">{roleNames[personaId]}</span></span>
            <ChevronDown size={14} strokeWidth={2.5} aria-hidden="true" className="hidden text-zinc-500 sm:block" />
          </button>
          {roleOpen && <div role="menu" aria-label="Ganti pengguna demo" className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-zinc-200 bg-white p-2 shadow-xl">
            <p className="px-3 py-2 text-xs text-zinc-500">Pilih pengguna demo</p>
            {(Object.keys(roleNames) as UserPersonaId[]).map((id) => <button key={id} type="button" role="menuitem" onClick={() => void switchRole(id)} className={`flex w-full flex-col rounded-lg px-3 py-2 text-left hover:bg-zinc-50 ${id === personaId ? 'bg-red-50' : ''}`}><span className="text-sm font-semibold text-zinc-900">{USER_PERSONAS[id].name}</span><span className="text-xs text-zinc-500">{roleNames[id]}</span></button>)}
            {switchError && <p role="alert" className="px-3 py-2 text-xs text-red-700">{switchError}</p>}
          </div>}
        </div>
      </div>

      <div className="col-start-2 row-start-1 flex items-center gap-1 lg:col-start-3">
        <button type="button" onClick={onToggleSidebar} aria-label={mobileSidebarOpen ? 'Tutup sidebar' : 'Buka sidebar'} aria-expanded={mobileSidebarOpen} aria-controls="clara-sidebar" className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-red-700 lg:hidden">{mobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}</button>
      </div>
    </div>
  </header>;
}
