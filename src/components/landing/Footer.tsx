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

          {/* Col 4: Kotak Lokasi Real Visual Map UPNVJT */}
          <div className="lg:col-span-4 space-y-3">
            <span className="font-heading font-bold text-white text-xs uppercase tracking-wider block mb-2">
              Lokasi Riset &amp; Operasional
            </span>

            <a
              href="https://maps.google.com/?q=-7.331941,112.787123"
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl border border-zinc-800 bg-[#0a0e17] p-2.5 overflow-hidden shadow-2xl hover:border-zinc-700 transition-all duration-300 group"
            >
              {/* Real Cartographic Map Image */}
              <div className="relative w-full h-44 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900">
                <Image
                  src="/images/map_upnvjt_real.png"
                  alt="Visual Peta Lokasi Kampus UPN Veteran Jawa Timur"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 380px"
                />
              </div>

              {/* Location Info & Titik Koordinat (No Icons) */}
              <div className="mt-3 flex items-start justify-between gap-3 pt-1 border-t border-zinc-900">
                <div className="space-y-1">
                  <p className="font-bold text-zinc-100 text-xs leading-tight">
                    Gedung Technopark UPNVJT
                  </p>
                  <p className="text-[11px] text-zinc-400 leading-snug">
                    Jl. Raya Rungkut Madya No. 1, Surabaya
                  </p>
                  <p className="text-[10px] font-mono text-orange-400">
                    Titik Koordinat: -7.331941, 112.787123
                  </p>
                  <p className="text-[9.5px] font-mono text-zinc-500">
                    7°19&apos;55.0&quot;S 112°47&apos;13.6&quot;E
                  </p>
                </div>
                <span className="inline-block text-[11px] font-bold text-orange-400 group-hover:text-orange-300 transition-colors shrink-0 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 group-hover:border-zinc-700">
                  Buka Google Maps
                </span>
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
