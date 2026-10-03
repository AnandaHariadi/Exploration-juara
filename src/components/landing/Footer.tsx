import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-zinc-950 text-white pt-16 pb-12 border-t border-zinc-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Corporate Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-zinc-800 text-xs text-zinc-400">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-zinc-800 p-[1px] shadow-sm shrink-0">
                <div className="w-full h-full rounded-[7px] bg-zinc-900 flex items-center justify-center">
                  <span className="font-heading font-black text-white text-sm">C</span>
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-heading font-extrabold text-lg tracking-tight text-white leading-none">
                    CLARA
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                </div>
                <span className="text-[8px] font-mono font-bold tracking-widest text-zinc-400 uppercase mt-0.5">
                  Contract Intelligence
                </span>
              </div>
            </div>
            <p className="max-w-md leading-relaxed text-zinc-400">
              Platform Contract Intelligence &amp; Project Monitoring dari <strong>CLARA</strong>. Menghubungkan apa yang disepakati (Kontrak), apa yang direncanakan (RAB), apa yang terjadi (Progress), dan apa yang direalisasikan (Invoice) untuk melindungi margin bisnis proyek Anda.
            </p>
          </div>

          <div className="space-y-2.5">
            <span className="font-heading font-bold text-white text-xs uppercase tracking-wider block mb-3">
              Navigasi Cepat
            </span>
            <p><a href="#tentang" className="hover:text-white transition-colors">Tentang CLARA</a></p>
            <p><a href="#kategori" className="hover:text-white transition-colors">Target Industri</a></p>
            <p><a href="#alur" className="hover:text-white transition-colors">Alur Rekonsiliasi</a></p>
            <p><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard Rekonsiliasi</Link></p>
          </div>

          <div className="space-y-2.5">
            <span className="font-heading font-bold text-white text-xs uppercase tracking-wider block mb-3">
              Infrastruktur &amp; Kepatuhan
            </span>
            <p className="text-zinc-400">Ekstraksi Dokumen &amp; Baseline Lock</p>
            <p className="text-zinc-400">Deterministic Reconciliation Engine</p>
            <p className="text-zinc-400">Audit Trail &amp; Baseline Versioning</p>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500">
          <p>© 2026 CLARA — Contract Intelligence for Business Value. Hak cipta dilindungi.</p>
          <p className="text-zinc-500">Mengoptimalkan Nilai Bisnis Melalui Data &amp; Wawasan Terintegrasi</p>
        </div>
      </div>
    </footer>
  );
}
