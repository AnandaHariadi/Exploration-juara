'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, AlertTriangle, Bot, ChevronLeft, ChevronRight, FileText, FolderKanban, Home, LayoutDashboard, ReceiptText, RotateCcw, X } from 'lucide-react';
import { dataClient } from '@/services/dataClient';
import { useAlerts } from '@/hooks/useClaraData';

const navigationGroups = [
  { title: 'Utama', items: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Proyek', href: '/projects', icon: FolderKanban },
    { label: 'Pusat AI', href: '/ai-center', icon: Bot },
  ] },
  { title: 'Monitoring', items: [
    { label: 'Pemantauan', href: '/monitoring', icon: Activity },
    { label: 'Keuangan', href: '/finance', icon: ReceiptText },
    { label: 'Permintaan perubahan', href: '/change-requests', icon: FileText },
    { label: 'Peringatan', href: '/alerts', icon: AlertTriangle },
  ] },
  { title: 'Lainnya', items: [
    { label: 'Halaman depan', href: '/', icon: Home },
  ] },
];

interface SidebarProps {
  desktopOpen: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleDesktop: () => void;
}

export function Sidebar({ desktopOpen, mobileOpen, onCloseMobile, onToggleDesktop }: SidebarProps) {
  const pathname = usePathname();
  const { alerts } = useAlerts();
  const [resetting, setResetting] = React.useState(false);
  const [isDesktop, setIsDesktop] = React.useState(false);
  const mobileCloseButton = React.useRef<HTMLButtonElement>(null);
  const newAlerts = alerts.filter((item) => item.status === 'NEW').length;
  const visible = isDesktop || mobileOpen;

  React.useEffect(() => { onCloseMobile(); }, [pathname, onCloseMobile]);
  React.useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  React.useEffect(() => {
    if (!mobileOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    mobileCloseButton.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onCloseMobile(); };
    document.addEventListener('keydown', closeOnEscape);
    return () => { document.removeEventListener('keydown', closeOnEscape); previousFocus?.focus(); };
  }, [mobileOpen, onCloseMobile]);

  const resetDemo = async () => {
    if (!window.confirm('Atur ulang data demo? Semua proyek, dokumen unggahan, dan perubahan kembali ke kondisi awal demo. Tindakan ini tidak bisa dibatalkan.')) return;
    setResetting(true);
    try {
      await dataClient.resetDemo();
      window.location.assign('/dashboard');
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Gagal mengatur ulang data demo.');
      setResetting(false);
    }
  };

  return <>
    {mobileOpen && <button type="button" aria-label="Tutup sidebar" className="fixed inset-0 z-40 bg-zinc-950/45 lg:hidden" onClick={onCloseMobile} />}
    <aside id="clara-sidebar" aria-label="Navigasi utama" aria-hidden={!visible} inert={!visible} className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r-2 border-zinc-200 bg-white shadow-xl transition-[width,transform] duration-200 ease-out lg:translate-x-0 lg:shadow-none ${mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'} ${desktopOpen ? 'lg:w-64' : 'lg:w-[88px]'}`}>
      <div className={`relative flex h-20 shrink-0 items-center border-b-2 border-zinc-200 bg-white px-5 sm:px-6 ${desktopOpen ? 'justify-between' : 'lg:justify-center lg:px-0'}`}>
        <Link href="/dashboard" className={`flex items-center gap-2.5 overflow-hidden transition-opacity ${desktopOpen ? '' : 'lg:hidden'}`} aria-label="CLARA Dashboard">
          <Image
            src="/images/clara_logo_full.png"
            alt="CLARA"
            width={130}
            height={30}
            className="h-7 w-auto object-contain"
            priority
          />
        </Link>
        {!desktopOpen && (
          <Link href="/dashboard" className="hidden lg:flex items-center justify-center" aria-label="CLARA">
            <Image
              src="/images/clara_icon.png"
              alt="CLARA"
              width={32}
              height={32}
              className="w-7 h-7 object-contain"
              priority
            />
          </Link>
        )}
        <button ref={mobileCloseButton} type="button" aria-label="Tutup sidebar" onClick={onCloseMobile} className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 lg:hidden"><X size={19} /></button>
        <button type="button" aria-label={desktopOpen ? 'Lipat sidebar' : 'Buka sidebar lengkap'} aria-controls="clara-sidebar" aria-expanded={desktopOpen} onClick={onToggleDesktop} className={`hidden h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-red-50 hover:text-red-600 hover:border-red-300 shadow-xs transition-colors lg:flex ${desktopOpen ? '' : 'absolute -right-3 top-6 shadow-sm z-10'}`}>{desktopOpen ? <ChevronLeft size={16} strokeWidth={2.5} /> : <ChevronRight size={16} strokeWidth={2.5} />}</button>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {navigationGroups.map((group) => <section key={group.title} aria-label={group.title} className="mb-6 last:mb-0">
          <h2 className={`mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 ${desktopOpen ? '' : 'lg:sr-only'}`}>{group.title}</h2>
          <div className="space-y-1">
            {group.items.map(({ label, href, icon: Icon }) => {
              const active = pathname === href || (href === '/projects' && pathname.startsWith('/projects/'));
              return <Link key={href} href={href} title={!desktopOpen ? label : undefined} aria-label={label} aria-current={active ? 'page' : undefined} onClick={onCloseMobile} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${desktopOpen ? '' : 'lg:justify-center lg:px-0'} ${active ? 'bg-red-50 text-red-700' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'}`}>
                <Icon size={19} strokeWidth={2.25} aria-hidden="true" /><span className={`flex-1 ${desktopOpen ? '' : 'lg:hidden'}`}>{label}</span>{href === '/alerts' && newAlerts > 0 && <span className={`rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white ${desktopOpen ? '' : 'lg:hidden'}`}>{newAlerts}</span>}
              </Link>;
            })}
          </div>
        </section>)}
      </nav>
      <div className={`border-t border-zinc-100 ${desktopOpen ? 'p-4' : 'p-4 lg:px-3'}`}>
        <p className={`mb-3 rounded-xl bg-orange-50 p-3 text-xs leading-relaxed text-orange-900 ${desktopOpen ? '' : 'lg:hidden'}`}>Mode demo · Data tersimpan di database lokal.</p>
        <button type="button" title={!desktopOpen ? 'Atur ulang data demo' : undefined} aria-label="Atur ulang data demo" disabled={resetting} onClick={resetDemo} className={`flex min-h-10 w-full items-center justify-center gap-2 rounded-lg text-xs font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-50 ${desktopOpen ? '' : 'lg:px-0'}`}><RotateCcw size={16} /><span className={desktopOpen ? '' : 'lg:hidden'}>{resetting ? 'Mengatur ulang…' : 'Atur ulang data demo'}</span></button>
      </div>
    </aside>
  </>;
}
