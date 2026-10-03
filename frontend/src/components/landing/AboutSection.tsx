import Image from "next/image";
import Link from "next/link";
import { ArrowRight, FileCheck, Layers, ShieldCheck, MapPin, Mail, Clock, Shield } from "lucide-react";

export function AboutSection() {
  return (
    <section id="tentang" className="py-20 md:py-28 bg-white border-b border-zinc-200 relative overflow-hidden">
      {/* Left Flank: Diagonal Cascade Wave */}
      <div className="absolute left-0 sm:left-2 lg:left-4 xl:left-8 top-16 sm:top-24 w-20 sm:w-28 md:w-36 lg:w-44 xl:w-56 h-auto pointer-events-none select-none z-0 opacity-70 sm:opacity-80 transition-opacity">
        <Image
          src="/images/shapes/shape_tentang_left.svg"
          alt="Clara Cascade Wave Left"
          width={400}
          height={800}
          className="w-full h-auto object-contain"
        />
      </div>

      {/* Right Flank: Floating 3D Helix Loop */}
      <div className="absolute right-0 sm:right-2 lg:right-4 xl:right-8 top-16 sm:top-24 w-20 sm:w-28 md:w-36 lg:w-44 xl:w-56 h-auto pointer-events-none select-none z-0 opacity-70 sm:opacity-80 transition-opacity">
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
        <div className="max-w-3xl mb-16">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-[2px] bg-red-600 inline-block" />
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono">
              Tentang Clara
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-zinc-950 tracking-tight mb-4">
            Standar Baru Tata Kelola Finansial Talenta Mandiri
          </h2>
          <p className="text-base sm:text-lg text-zinc-600 leading-relaxed font-normal">
            Platform otomasi penagihan dan rekonsiliasi pembayaran yang dirancang oleh Clara untuk menjembatani profesional lepas dengan standar transaksi komersial resmi di Indonesia.
          </p>
        </div>

        {/* Editorial Grid: Perfectly Balanced Symmetrical Columns */}
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start pt-8 border-t border-zinc-200">
          {/* Left Column: Narrative + Action Link + Seamless Corporate Photo */}
          <div className="lg:col-span-6 flex flex-col justify-between h-full space-y-6">
            <div className="space-y-5 text-zinc-700 leading-relaxed text-sm sm:text-base font-normal">
              <p>
                Banyak talenta digital dan profesional independen memiliki kapabilitas keahlian tinggi, namun menghadapi hambatan operasional: ketiadaan departemen keuangan khusus, pencatatan piutang yang tercecer, hingga proses penagihan manual yang memakan waktu dan berisiko terlambat.
              </p>
              <p>
                <strong>Clara</strong> hadir sebagai infrastruktur finansial mandiri yang mengotomasi seluruh siklus penagihan. Melalui konversi instruksi percakapan menjadi dokumen resmi, penataan uang muka (DP), dan verifikasi pembayaran seketika, setiap penyelesaian proyek terkonversi menjadi arus kas yang tepat waktu dan akuntabel.
              </p>
              <div className="pt-1">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 text-sm font-heading font-bold text-red-600 hover:text-red-700 transition-colors"
                >
                  <span>Eksplorasi Fitur Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Corporate Photo Filling Space Elegantly */}
            <div className="relative h-60 sm:h-64 lg:h-72 w-full rounded-3xl overflow-hidden border border-zinc-200/90 shadow-sm mt-4">
              <Image
                src="/images/corporate_fintech_ops.jpg"
                alt="Operasional Finansial Clara"
                fill
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-5 right-5 text-white">
                <p className="text-xs font-medium text-zinc-200">
                  Pusat Operasional &amp; Rekonsiliasi Finansial
                </p>
                <p className="text-sm font-heading font-bold text-white">
                  Otomasi Pembayaran Berstandar Perbankan Nasional
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: 3 Core Value Pillars - Shifted Down, Strictly Monochrome */}
          <div className="lg:col-span-6 space-y-5 pt-2 sm:pt-6 lg:pt-10">
            {/* Card 1 */}
            <div className="p-6 sm:p-7 rounded-2xl bg-zinc-50 border border-zinc-200/80 hover:border-zinc-300 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-zinc-200/80 text-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-base text-zinc-950 mb-1.5">
                    Ekstraksi Dokumen Cerdas
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                    Menerjemahkan instruksi kerja ke dalam format penagihan komersial dengan rincian biaya, tenggat waktu, dan identitas proyek yang presisi.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="p-6 sm:p-7 rounded-2xl bg-zinc-50 border border-zinc-200/80 hover:border-zinc-300 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-zinc-200/80 text-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-base text-zinc-950 mb-1.5">
                    Tata Kelola Termin &amp; Uang Muka
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                    Mengamankan arus kas pengerjaan melalui pembagian tahapan termin yang mengikat secara profesional sebelum dokumen akhir diserahkan.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="p-6 sm:p-7 rounded-2xl bg-zinc-50 border border-zinc-200/80 hover:border-zinc-300 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-zinc-200/80 text-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-base text-zinc-950 mb-1.5">
                    Verifikasi Transaksi Terpadu
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                    Integrasi payment gateway resmi memvalidasi mutasi pelunasan seketika tanpa perlu verifikasi tanda terima manual secara konvensional.
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
                VISI PERUSAHAAN
              </span>
              <h3 className="text-2xl font-heading font-bold text-zinc-950 tracking-tight mb-4">
                Kemandirian Ekonomi Talenta Unggul
              </h3>
              <p className="text-sm sm:text-base text-zinc-700 leading-relaxed font-normal">
                Menjadi ekosistem teknologi finansial terdepan di Indonesia yang mentransformasi profesional mandiri dan kreator independen dengan infrastruktur penagihan setara korporasi global.
              </p>
            </div>

            {/* Misi Perusahaan (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono block mb-2">
                  MISI STRATEGIS CLARA
                </span>
                <h3 className="text-2xl font-heading font-bold text-zinc-950 tracking-tight">
                  Tiga Komitmen Pembangunan Berkelanjutan
                </h3>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-4 pb-4 border-b border-zinc-100">
                  <span className="font-heading font-bold text-base text-red-600 font-mono shrink-0 mt-0.5">
                    01
                  </span>
                  <div>
                    <h4 className="font-heading font-bold text-sm sm:text-base text-zinc-950 mb-1">
                      Otomasi Tanpa Hambatan Birokrasi
                    </h4>
                    <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                      Menghadirkan pemrosesan bahasa alami untuk mengonversi kesepakatan kerja menjadi dokumen faktur legal secara instan dan akuntabel.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 pb-4 border-b border-zinc-100">
                  <span className="font-heading font-bold text-base text-zinc-900 font-mono shrink-0 mt-0.5">
                    02
                  </span>
                  <div>
                    <h4 className="font-heading font-bold text-sm sm:text-base text-zinc-950 mb-1">
                      Perlindungan Arus Kas &amp; Likuiditas
                    </h4>
                    <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                      Menegakkan tata kelola uang muka (DP) dan termin milestone terverifikasi guna menjamin kepastian pembayaran tepat waktu bagi setiap hasil karya.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="font-heading font-bold text-base text-zinc-900 font-mono shrink-0 mt-0.5">
                    03
                  </span>
                  <div>
                    <h4 className="font-heading font-bold text-sm sm:text-base text-zinc-950 mb-1">
                      Kemitraan Komersial Terpercaya
                    </h4>
                    <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                      Menyediakan standar dokumentasi penagihan formal yang mematuhi protokol audit pembukuan mitra berskala kampus, UKM, hingga perseroan resmi.
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
              PUSAT RISET &amp; OPERASIONAL
            </span>
            <h3 className="text-2xl sm:text-3xl font-heading font-bold text-zinc-950 tracking-tight">
              Basis Operasional &amp; Rekayasa Teknologi Clara
            </h3>
          </div>

          {/* Unified Executive Card: Left Transparent Building Visual + Right UPN Address */}
          <div className="rounded-3xl bg-zinc-50/80 border border-zinc-200/80 p-6 sm:p-10 lg:p-12 overflow-hidden shadow-xs relative">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Side: Transparent Building Cutout Visual - Substantially Enlarged & Pres */}
              <div className="lg:col-span-5 h-[380px] sm:h-[440px] lg:h-[480px] flex items-center justify-center relative">
                {/* Ambient Soft Glow Behind Building */}
                <div className="absolute inset-0 bg-red-100/30 rounded-full blur-3xl pointer-events-none -z-10" />
                
                <div className="relative w-full h-full flex items-center justify-center">
                  <Image
                    src="/images/yupiens_office_transparent.png"
                    alt="Visual Gedung Kantor Clara"
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
                    LOKASI OPERASIONAL RESMI
                  </span>
                  <div className="my-4 sm:my-5">
                    <Image
                      src="/images/clara_logo.svg"
                      alt="Clara"
                      width={400}
                      height={120}
                      className="h-16 sm:h-20 md:h-24 w-auto object-contain filter drop-shadow-xs"
                    />
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
                      <span>Jam Layanan Operasional</span>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-zinc-900">
                      Senin – Jumat: 08.30 – 17.30 WIB
                    </p>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Sistem otomasi gateway beroperasi aktif 24/7
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
                    <span>Pusat Inovasi Teknologi Finansial</span>
                    <span>Dukungan Operasional Talenta Mandiri Indonesia</span>
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
