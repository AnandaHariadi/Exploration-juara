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

          {/* Col 4: Kotak Lokasi Tactical Dark Map UPNVJT */}
          <div className="lg:col-span-4 space-y-3">
            <span className="font-heading font-bold text-white text-xs uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-red-500" />
              Lokasi Riset &amp; Operasional
            </span>

            <a
              href="https://maps.google.com/?q=-7.331941,112.787123"
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl border border-zinc-800 bg-[#0a0e17] p-3 overflow-hidden shadow-2xl hover:border-zinc-700 transition-all duration-300 group"
            >
              {/* Tactical Dark Map Container */}
              <div className="relative w-full h-44 rounded-lg overflow-hidden border border-zinc-800/80 bg-[#070a10]">
                {/* Custom Vector Cartography Map */}
                <svg
                  viewBox="0 0 400 200"
                  className="w-full h-full object-cover select-none pointer-events-none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    {/* Grid Pattern */}
                    <pattern id="tacticalGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeOpacity="0.4" />
                    </pattern>
                    {/* Pulse Glow Gradient */}
                    <radialGradient id="targetGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.6" />
                      <stop offset="60%" stopColor="#f97316" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* Dark Base & Grid */}
                  <rect width="400" height="200" fill="#090d16" />
                  <rect width="400" height="200" fill="url(#tacticalGrid)" />

                  {/* Campus Grounds Polygon (UPNVJT Campus Area) */}
                  <polygon
                    points="90,45 320,40 340,165 110,175"
                    fill="#131b2e"
                    stroke="#1e293b"
                    strokeWidth="1"
                    strokeDasharray="3,3"
                  />
                  <text x="135" y="70" fill="#475569" fontSize="8" fontFamily="monospace" letterSpacing="1">
                    KAMPUS UPN &quot;VETERAN&quot; JAWA TIMUR
                  </text>

                  {/* Street Network (Rungkut Madya & surrounding avenues) */}
                  <path d="M 0,42 Q 180,48 400,38" fill="none" stroke="#1e293b" strokeWidth="9" />
                  <path d="M 0,42 Q 180,48 400,38" fill="none" stroke="#334155" strokeWidth="4" />
                  <text x="15" y="34" fill="#64748b" fontSize="7" fontFamily="sans-serif" fontWeight="bold">
                    JL. RAYA RUNGKUT MADYA
                  </text>

                  {/* Jl. Gunung Anyar / Medokan side streets */}
                  <path d="M 105,45 L 115,200" fill="none" stroke="#1e293b" strokeWidth="4" />
                  <path d="M 105,45 L 115,200" fill="none" stroke="#273549" strokeWidth="2" />
                  <path d="M 320,40 L 335,200" fill="none" stroke="#1e293b" strokeWidth="4" />
                  <path d="M 320,40 L 335,200" fill="none" stroke="#273549" strokeWidth="2" />
                  
                  {/* Campus Inner Avenues */}
                  <path d="M 110,105 L 325,100" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeDasharray="4,2" />
                  <path d="M 210,46 L 215,170" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeDasharray="4,2" />

                  {/* Technopark Building Footprint */}
                  <rect x="185" y="85" width="55" height="35" rx="3" fill="#1e1828" stroke="#dc2626" strokeWidth="1" strokeOpacity="0.8" />
                  <rect x="188" y="88" width="49" height="29" rx="2" fill="#2d1522" fillOpacity="0.7" />

                  {/* Radar Pulse Rings from Pin */}
                  <circle cx="212" cy="102" r="45" fill="url(#targetGlow)" />
                  <circle cx="212" cy="102" r="30" fill="none" stroke="#ef4444" strokeWidth="0.8" strokeOpacity="0.4" strokeDasharray="2,2" />
                  <circle cx="212" cy="102" r="18" fill="none" stroke="#f97316" strokeWidth="1" strokeOpacity="0.6" />

                  {/* Coordinate Target Crosshairs */}
                  <line x1="160" y1="102" x2="264" y2="102" stroke="#ef4444" strokeWidth="0.75" strokeOpacity="0.5" strokeDasharray="3,3" />
                  <line x1="212" y1="60" x2="212" y2="145" stroke="#ef4444" strokeWidth="0.75" strokeOpacity="0.5" strokeDasharray="3,3" />

                  {/* Center Radar Point */}
                  <circle cx="212" cy="102" r="4.5" fill="#f97316" />
                  <circle cx="212" cy="102" r="2.5" fill="#ffffff" />

                  {/* Pin Callout Badge */}
                  <g transform="translate(145, 126)">
                    <rect width="134" height="20" rx="4" fill="#090d16" fillOpacity="0.92" stroke="#dc2626" strokeWidth="0.8" />
                    <circle cx="10" cy="10" r="3" fill="#ef4444" />
                    <text x="18" y="13.5" fill="#ffffff" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
                      GEDUNG TECHNOPARK
                    </text>
                  </g>
                </svg>

                {/* Tactical HUD Header Overlay */}
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md border border-zinc-800 text-[9px] font-mono text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    GPS ACTIVE
                  </div>
                  <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md border border-zinc-800 text-[9px] font-mono text-orange-400 font-bold tracking-wider">
                    7°19&apos;55.0&quot;S 112°47&apos;13.6&quot;E
                  </div>
                </div>

                {/* Tactical HUD Footer Overlay */}
                <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between pointer-events-none text-[8.5px] font-mono text-zinc-400">
                  <span className="bg-black/60 px-1.5 py-0.5 rounded">R&amp;D LAB CLARA</span>
                  <span className="bg-black/60 px-1.5 py-0.5 rounded text-zinc-300">-7.331941, 112.787123</span>
                </div>
              </div>

              {/* Location Info & Open Maps Action */}
              <div className="mt-3 flex items-start justify-between gap-3 pt-1 border-t border-zinc-900">
                <div className="space-y-1">
                  <p className="font-bold text-zinc-100 text-xs leading-tight flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                    Gedung Technopark UPNVJT
                  </p>
                  <p className="text-[11px] text-zinc-400 leading-snug">
                    Jl. Raya Rungkut Madya No. 1, Surabaya
                  </p>
                  <p className="text-[10px] font-mono text-orange-400/90">
                    Koordinat: -7.331941, 112.787123
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-400 group-hover:text-orange-300 transition-colors shrink-0 bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-zinc-800 group-hover:border-zinc-700">
                  Buka Maps
                  <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
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
