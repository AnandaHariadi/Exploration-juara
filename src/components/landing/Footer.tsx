import Image from "next/image";
import Link from "next/link";
import { ExternalLink, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-zinc-950 text-white pt-16 pb-12 border-t border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Corporate Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-12 border-b border-zinc-800 text-xs text-zinc-400">
          {/* Col 1: Brand & Narration */}
          <div className="lg:col-span-4 space-y-4">
            <div>
              <span className="font-heading font-black text-2xl tracking-tighter bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 bg-clip-text text-transparent inline-block">
                CLARA
              </span>
            </div>
            <p className="max-w-sm leading-relaxed text-zinc-400">
              Platform Contract Intelligence &amp; Project Monitoring dari <strong>CLARA</strong>. Menghubungkan apa yang disepakati (Kontrak), apa yang direncanakan (RAB), apa yang terjadi (Progress), dan apa yang direalisasikan (Invoice) untuk melindungi margin bisnis proyek Anda.
            </p>
          </div>

          {/* Col 2: Navigasi Cepat */}
          <div className="space-y-2.5 lg:col-span-2">
            <span className="font-heading font-bold text-white text-xs uppercase tracking-wider block mb-3">
              Navigasi Cepat
            </span>
            <p><a href="#tentang" className="hover:text-white transition-colors">Tentang CLARA</a></p>
            <p><a href="#kategori" className="hover:text-white transition-colors">Target Industri</a></p>
            <p><a href="#alur" className="hover:text-white transition-colors">Alur Rekonsiliasi</a></p>
            <p><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard Rekonsiliasi</Link></p>
          </div>

          {/* Col 3: Infrastruktur & Kepatuhan */}
          <div className="space-y-2.5 lg:col-span-2">
            <span className="font-heading font-bold text-white text-xs uppercase tracking-wider block mb-3">
              Infrastruktur &amp; Kepatuhan
            </span>
            <p className="text-zinc-400">Ekstraksi Dokumen &amp; Baseline Lock</p>
            <p className="text-zinc-400">Deterministic Reconciliation Engine</p>
            <p className="text-zinc-400">Audit Trail &amp; Baseline Versioning</p>
          </div>

          {/* Col 4: Kotak Lokasi GMaps UPNVJT */}
          <div className="lg:col-span-4 space-y-3">
            <span className="font-heading font-bold text-white text-xs uppercase tracking-wider block mb-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-red-500" />
              Lokasi Riset &amp; Operasional
            </span>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-2.5 overflow-hidden shadow-lg hover:border-zinc-700 transition-colors">
              <div className="w-full h-32 rounded-lg overflow-hidden border border-zinc-800/80 mb-2.5 relative">
                <iframe
                  title="Peta Lokasi UPN Veteran Jawa Timur"
                  src="https://maps.google.com/maps?q=UPN%20Veteran%20Jawa%20Timur%20Surabaya&t=&z=15&ie=UTF8&iwloc=&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full"
                />
              </div>
              <div className="flex items-start justify-between gap-2 px-1 pt-0.5">
                <div className="space-y-0.5">
                  <p className="font-bold text-zinc-200 text-[11px] leading-tight flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                    Gedung Technopark UPNVJT
                  </p>
                  <p className="text-[10px] text-zinc-400 leading-snug">
                    Jl. Raya Rungkut Madya No. 1, Surabaya
                  </p>
                </div>
                <a
                  href="https://maps.google.com/?q=UPN+Veteran+Jawa+Timur"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-400 hover:text-orange-300 transition-colors shrink-0 bg-zinc-800/80 px-2 py-1 rounded border border-zinc-700/60"
                >
                  Buka Maps
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
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
