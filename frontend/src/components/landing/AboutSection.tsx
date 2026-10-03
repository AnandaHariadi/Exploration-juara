import Image from "next/image";
import Link from "next/link";
import { ArrowRight, FileCheck, Layers, ShieldCheck, MapPin, Mail, Clock, Shield } from "lucide-react";

export function AboutSection() {
  return (
    <section id="tentang" className="py-20 md:py-28 bg-white border-b border-zinc-200 relative overflow-hidden">
      {/* Left Flank: Diagonal Cascade Wave */}
      <div className="absolute left-0 sm:left-2 lg:left-4 xl:left-8 top-16 sm:top-24 w-20 sm:w-28 md:w-36 lg:w-44 xl:w-56 h-auto pointer-events-none select-none z-0 opacity-70 sm:opacity-80 transition-opacity animate-float-slow">
        <Image
          src="/images/shapes/shape_tentang_left.svg"
          alt="Clara Cascade Wave Left"
          width={400}
          height={800}
          className="w-full h-auto object-contain"
        />
      </div>

      {/* Right Flank: Floating 3D Helix Loop */}
      <div className="absolute right-0 sm:right-2 lg:right-4 xl:right-8 top-16 sm:top-24 w-20 sm:w-28 md:w-36 lg:w-44 xl:w-56 h-auto pointer-events-none select-none z-0 opacity-70 sm:opacity-80 transition-opacity animate-float-reverse">
        <Image
          src="/images/shapes/shape_tentang_right.svg"
          alt="Clara 3D Helix Loop Right"
          width={500}
          height={750}
          className="w-full h-auto object-contain"
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header - Astra Corporate Style */}
        <div className="max-w-3xl mb-16 reveal-on-scroll">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-[2px] bg-red-600 inline-block" />
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono">
              PROFIL &amp; REKAYASA KORPORASI CLARA
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-zinc-950 tracking-tight mb-4">
            Menegakkan Kedaulatan Nilai Bisnis Melalui Intelijen Kontrak Terpadu
          </h2>
          <p className="text-base sm:text-lg text-zinc-600 leading-relaxed font-normal">
            Sebagai pelopor platform Contract Intelligence di Indonesia, CLARA memadukan ketajaman pemahaman hukum dengan rekayasa presisi analitik data—mentransformasi setiap klausul komersial menjadi benteng perlindungan margin, kepatuhan operasional, dan pertumbuhan bisnis yang akuntabel.
          </p>
        </div>

        {/* Editorial Grid: Perfectly Balanced Symmetrical Columns */}
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start pt-8 border-t border-zinc-200">
          {/* Left Column: Narrative + Action Link + Seamless Corporate Photo */}
          <div className="lg:col-span-6 flex flex-col justify-between h-full space-y-6 reveal-left">
            <div className="space-y-5 text-zinc-700 leading-relaxed text-sm sm:text-base font-normal">
              <p>
                Di lanskap industri modern, kontrak bukan sekadar lembar arsip hukum pasif. Kontrak adalah komitmen finansial hidup yang menentukan kepastian arus kas, integritas pengerjaan, dan kredibilitas jangka panjang perusahaan. Namun selama bertahun-tahun, banyak bisnis berbasis proyek menghadapi jurang data: kesepakatan tertahan di divisi legal, kalkulasi rencana terkunci di spreadsheet, dinamika tim terisolasi di lapangan, dan penagihan tertunda di meja keuangan.
              </p>
              <p>
                <strong>CLARA</strong> dibangun dengan satu misi strategis: <strong>menghubungkan seluruh sumber kebenaran bisnis dalam satu ekosistem deterministik yang transparan</strong>. Mulai dari mitigasi risiko liabilitas sebelum penandatanganan (Before Signing) hingga pemantauan kepatuhan eksekusi pengerjaan (After Signing), CLARA memberdayakan para pemangku kepentingan untuk memimpin dengan wawasan berbasis data, menghentikan kebocoran margin, dan memastikan setiap rupiah kesepakatan terealisasi utuh menjadi nilai bisnis nyata.
              </p>
              <div className="pt-1">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 text-sm font-heading font-bold text-red-600 hover:text-red-700 transition-colors"
                >
                  <span>Pelajari Ekosistem &amp; Fitur Rekonsiliasi</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Corporate Photo Filling Space Elegantly */}
            <div className="relative h-60 sm:h-64 lg:h-72 w-full rounded-3xl overflow-hidden border border-zinc-200/90 shadow-sm mt-4">
              <Image
                src="/images/corporate_fintech_ops.jpg"
                alt="Operasional Contract Intelligence CLARA"
                fill
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-5 right-5 text-white">
                <p className="text-xs font-medium text-zinc-300">
                  Pusat Operasional &amp; Tata Kelola Finansial
                </p>
                <p className="text-sm font-heading font-bold text-white">
                  Infrastruktur Pengamanan Nilai Kontrak &amp; Eksekusi Proyek Berdaya Saing Global
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: 3 Core Value Pillars - Shifted Down, Strictly Monochrome */}
          <div className="lg:col-span-6 space-y-5 pt-2 sm:pt-6 lg:pt-10">
            {/* Card 1 */}
            <div className="p-6 sm:p-7 rounded-2xl bg-zinc-50 border border-zinc-200/80 hover:border-red-600/40 card-executive-hover group reveal-right reveal-delay-1">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-zinc-200/80 text-zinc-800 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 group-hover:bg-red-50 group-hover:text-red-600 transition-all">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-base text-zinc-950 mb-1.5">
                    Integritas Baseline Berstandar Institusional
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                    Menerjemahkan dokumen PKS, SOW, dan struktur RAB kompleks menjadi format data baku terstruktur yang disahkan langsung oleh pemangku kepentingan sebagai standar kebenaran proyek.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="p-6 sm:p-7 rounded-2xl bg-zinc-50 border border-zinc-200/80 hover:border-red-600/40 card-executive-hover group reveal-right reveal-delay-2">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-zinc-200/80 text-zinc-800 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 group-hover:bg-red-50 group-hover:text-red-600 transition-all">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-base text-zinc-950 mb-1.5">
                    Deteksi Deviasi &amp; Rekonsiliasi Multidimensi
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                    Engine deterministik yang secara proaktif memitigasi risiko pembengkakan biaya anggaran (budget overrun), pekerjaan di luar kesepakatan (scope creep), dan milestone unbilled.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="p-6 sm:p-7 rounded-2xl bg-zinc-50 border border-zinc-200/80 hover:border-red-600/40 card-executive-hover group reveal-right reveal-delay-3">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-zinc-200/80 text-zinc-800 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 group-hover:bg-red-50 group-hover:text-red-600 transition-all">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-base text-zinc-950 mb-1.5">
                    Kepatuhan Hukum &amp; Kedaulatan Audit Trail
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                    Mencatat setiap addendum, perubahan scope, dan versi baseline proyek (V1, V2, V3) secara kronologis dengan standar pembuktian akuntabel guna melindungi bisnis dari risiko sengketa.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Visi & Misi Perusahaan (Astra Strategic Vision & Mission Layout) */}
        <div className="pt-16 mt-16 border-t border-zinc-200 relative">
          {/* Subtle Corporate Horizon Flow Ribbon Accent */}
          <div className="absolute inset-x-0 -top-12 h-44 pointer-events-none select-none opacity-35 z-0 overflow-hidden">
            <Image
              src="/images/shapes/yupiens_ribbon_horizon.svg"
              alt="Clara Brand Horizon Wave"
              fill
              className="object-cover object-center"
            />
          </div>
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start relative z-10">
            {/* Visi Perusahaan (5 cols) */}
            <div className="lg:col-span-5 bg-zinc-50/80 rounded-3xl p-8 sm:p-10 border border-zinc-200/80">
              <span className="text-xs font-bold text-red-600 uppercase tracking-widest font-mono block mb-3">
                VISI PRODUK
              </span>
              <h3 className="text-2xl font-heading font-bold text-zinc-950 tracking-tight mb-4">
                Living Business Intelligence for Every Contract
              </h3>
              <p className="text-sm sm:text-base text-zinc-700 leading-relaxed font-normal">
                Menjadi standar platform contract intelligence yang mentransformasi kontrak dari arsip pasif menjadi instrumen navigasi bisnis yang melindungi margin, kepatuhan, dan realisasi pendapatan bisnis berbasis proyek di Indonesia.
              </p>
            </div>

            {/* Misi Perusahaan (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono block mb-2">
                  MISI STRATEGIS CLARA
                </span>
                <h3 className="text-2xl font-heading font-bold text-zinc-950 tracking-tight">
                  Tiga Komitmen Perlindungan Nilai Bisnis
                </h3>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-4 pb-4 border-b border-zinc-100">
                  <span className="font-heading font-bold text-base text-red-600 font-mono shrink-0 mt-0.5">
                    01
                  </span>
                  <div>
                    <h4 className="font-heading font-bold text-sm sm:text-base text-zinc-950 mb-1">
                      Eliminasi Blindspot Before Signing
                    </h4>
                    <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                      Menganalisis klausul kritis, potensi liabilitas finansial, dan risiko kepatuhan sebelum kontrak disepakati agar bisnis terhindar dari sengketa.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 pb-4 border-b border-zinc-100">
                  <span className="font-heading font-bold text-base text-zinc-900 font-mono shrink-0 mt-0.5">
                    02
                  </span>
                  <div>
                    <h4 className="font-heading font-bold text-sm sm:text-base text-zinc-950 mb-1">
                      Rekonsiliasi Deterministik 4 Pilar
                    </h4>
                    <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                      Menyelaraskan kesepakatan kontrak, rencana anggaran RAB, progres pengerjaan tim, dan penagihan invoice secara real-time dan terukur.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="font-heading font-bold text-base text-zinc-900 font-mono shrink-0 mt-0.5">
                    03
                  </span>
                  <div>
                    <h4 className="font-heading font-bold text-sm sm:text-base text-zinc-950 mb-1">
                      Proteksi Revenue &amp; Realisasi Kontrak
                    </h4>
                    <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                      Mencegah pekerjaan tak tertagih (unbilled milestones) dan mendeteksi scope creep tanpa addendum resmi yang merugikan margin bisnis.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Basis Operasional & Riset Teknologi (Single Office at UPN with Transparent Building Cutout) */}
        <div className="pt-16 mt-16 border-t border-zinc-200">
          <div className="mb-8">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono block mb-2">
              PUSAT RISET &amp; REKAYASA TEKNOLOGI
            </span>
            <h3 className="text-2xl sm:text-3xl font-heading font-bold text-zinc-950 tracking-tight">
              Basis Rekayasa Contract Intelligence CLARA
            </h3>
          </div>

          {/* Unified Executive Card: Left Transparent Building Visual + Right UPN Address */}
          <div className="rounded-3xl bg-zinc-50/80 border border-zinc-200/80 p-6 sm:p-10 lg:p-12 overflow-hidden shadow-xs relative reveal-3d">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Side: Transparent Building Cutout Visual - Substantially Enlarged & Pres */}
              <div className="lg:col-span-5 h-[380px] sm:h-[440px] lg:h-[480px] flex items-center justify-center relative">
                {/* Ambient Soft Glow Behind Building */}
                <div className="absolute inset-0 bg-red-100/30 rounded-full blur-3xl pointer-events-none -z-10" />
                
                <div className="relative w-full h-full flex items-center justify-center">
                  <Image
                    src="/images/yupiens_office_transparent.png"
                    alt="Visual Gedung Kantor CLARA"
                    fill
                    className="object-contain object-center filter drop-shadow-2xl scale-110 sm:scale-120"
                    priority
                  />
                </div>
              </div>

              {/* Right Side: Official Office Address at UPN & Legal Details */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <span className="text-xs sm:text-sm font-mono font-bold text-red-600 uppercase tracking-widest block mb-2">
                    LOKASI RISET &amp; OPERASIONAL RESMI
                  </span>
                  <div className="my-4 sm:my-6">
                    <span className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl tracking-tighter bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 bg-clip-text text-transparent leading-none inline-block">
                      CLARA
                    </span>
                  </div>
                  <div className="flex items-start gap-3.5 text-base sm:text-lg text-zinc-800 leading-relaxed font-normal">
                    <MapPin className="w-6 h-6 text-red-600 shrink-0 mt-1" />
                    <div>
                      <p className="font-heading font-bold text-lg sm:text-xl text-zinc-950 mb-1">
                        Gedung Technopark &amp; Inkubator Bisnis
                      </p>
                      <p className="text-zinc-600 text-sm sm:text-base leading-relaxed">
                        Universitas Pembangunan Nasional &quot;Veteran&quot; Jawa Timur (UPNVJT)<br />
                        Jl. Raya Rungkut Madya No. 1, Gunung Anyar<br />
                        Surabaya 60294, Jawa Timur, Indonesia
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sub-details: Operating Hours & Official Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-6 border-t border-zinc-200">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold font-mono text-zinc-500 uppercase tracking-wider">
                      <Clock className="w-4 h-4 text-zinc-700" />
                      <span>Layanan Rekonsiliasi &amp; Dukungan</span>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-zinc-900">
                      Senin – Jumat: 08.30 – 17.30 WIB
                    </p>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Engine ekstraksi AI &amp; baseline monitoring aktif 24/7
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold font-mono text-zinc-500 uppercase tracking-wider">
                      <Mail className="w-4 h-4 text-zinc-700" />
                      <span>Korespondensi Resmi</span>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-zinc-900 font-mono">
                      corporate@clara.id
                    </p>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Kemitraan: partnership@clara.id
                    </p>
                  </div>

                  <div className="sm:col-span-2 pt-3 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-500 font-mono">
                    <span>Platform Contract Intelligence &amp; Project Monitoring</span>
                    <span>Optimasi Nilai Bisnis Melalui Data &amp; Wawasan Terintegrasi</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
