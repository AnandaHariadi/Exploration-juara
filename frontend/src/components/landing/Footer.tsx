import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-zinc-950 text-white pt-16 pb-12 border-t border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Corporate Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-12 border-b border-zinc-800 text-xs text-zinc-400">
          {/* Col 1: Brand & Narration */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center">
              <Image
                src="/images/clara_logo_full.png"
                alt="CLARA Official Logo"
                width={180}
                height={52}
                className="h-8 sm:h-9 w-auto object-contain brightness-110"
              />
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
          <div className="space-y-2.5 lg:col-span-3">
            <span className="font-heading font-bold text-white text-xs uppercase tracking-wider block mb-3">
              Infrastruktur &amp; Kepatuhan
            </span>
            <p className="text-zinc-400">Ekstraksi Dokumen &amp; Baseline Lock</p>
            <p className="text-zinc-400">Deterministic Reconciliation Engine</p>
            <p className="text-zinc-400">Audit Trail &amp; Baseline Versioning</p>
          </div>

          {/* Col 4: Lokasi Riset & Operasional (Sejajar dengan kolom lainnya) */}
          <div className="space-y-2.5 lg:col-span-3">
            <span className="font-heading font-bold text-white text-xs uppercase tracking-wider block mb-3">
              Lokasi Riset &amp; Operasional
            </span>

            <a
              href="https://maps.google.com/?q=-7.331941,112.787123"
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              {/* Compact Map Preview */}
              <div className="relative w-full h-24 rounded-lg overflow-hidden border border-zinc-800 group-hover:border-zinc-600 transition-colors mb-2.5 bg-zinc-900">
                <Image
                  src="/images/map_upnvjt_real.png"
                  alt="Visual Peta Lokasi Kampus UPN Veteran Jawa Timur"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="280px"
                />
              </div>

              {/* Location Details Sejajar */}
              <div className="space-y-1">
                <p className="font-bold text-zinc-200 text-xs leading-snug group-hover:text-white transition-colors">
                  Gedung Technopark UPNVJT
                </p>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  Jl. Raya Rungkut Madya No. 1, Surabaya
                </p>
                <p className="text-[11px] font-mono text-orange-400 pt-0.5">
                  Titik Koordinat: -7.331941, 112.787123
                </p>
              </div>
            </a>
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
