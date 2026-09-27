"use client";

import Image from "next/image";
import { CheckCircle2, Building2, Users } from "lucide-react";

export function ClientScaleComparison() {
  return (
    <section id="kategori" className="py-20 md:py-28 bg-zinc-50/70 border-b border-zinc-200 relative overflow-hidden">
      {/* Left Flank: Architectural Curved Wing */}
      <div className="absolute left-0 sm:left-2 lg:left-4 xl:left-8 top-1/2 -translate-y-1/2 w-20 sm:w-28 md:w-36 lg:w-44 xl:w-56 h-auto pointer-events-none select-none z-0 opacity-65 sm:opacity-75 transition-opacity">
        <Image
          src="/images/shapes/shape_kategori_left.svg"
          alt="Yupiens Architectural Wing Left"
          width={450}
          height={800}
          className="w-full h-auto object-contain"
        />
      </div>

      {/* Right Flank: Geometric Horizon Arch */}
      <div className="absolute right-0 sm:right-2 lg:right-4 xl:right-8 top-1/2 -translate-y-1/2 w-20 sm:w-28 md:w-36 lg:w-44 xl:w-56 h-auto pointer-events-none select-none z-0 opacity-65 sm:opacity-75 transition-opacity">
        <Image
          src="/images/shapes/shape_kategori_right.svg"
          alt="Yupiens Horizon Arch Right"
          width={500}
          height={800}
          className="w-full h-auto object-contain"
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header - Astra Corporate Style */}
        <div className="max-w-3xl mb-16">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-[2px] bg-red-600 inline-block" />
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono">
              Kategori Mitra &amp; Skala Penagihan
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-zinc-950 tracking-tight mb-4">
            Dua Jalur Penagihan Adaptif
          </h2>
          <p className="text-base sm:text-lg text-zinc-600 leading-relaxed font-normal">
            Sistem YUPIENS secara cerdas menyesuaikan kanal transaksi, format dokumen, dan tata bahasa pengingat berdasarkan profil badan hukum mitra kerja Anda.
          </p>
        </div>

        {/* 2-Track Enterprise Comparison Cards (Generous Size + Rich Visuals) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
          {/* JALUR 01: Skala Komunitas & Kampus */}
          <div className="bg-white rounded-3xl overflow-hidden border border-zinc-200 hover:border-zinc-300 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between">
            <div>
              {/* Photo Banner */}
              <div className="relative h-56 sm:h-64 w-full bg-zinc-100 overflow-hidden">
                <Image
                  src="/images/track_community.jpg"
                  alt="Skala Komunitas dan Kampus"
                  fill
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-orange-600" />
                  <span className="text-xs font-bold text-zinc-900 font-mono">JALUR 01</span>
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="text-xs font-medium text-orange-200 block mb-1">Ormawa, Event &amp; Komunitas</span>
                  <h3 className="text-xl sm:text-2xl font-heading font-bold tracking-tight">
                    Skala Komunitas &amp; Kampus
                  </h3>
                </div>
              </div>

              {/* Body Content */}
              <div className="p-8 sm:p-10">
                <p className="text-sm sm:text-base text-zinc-600 leading-relaxed font-normal mb-8">
                  Dirancang khusus untuk kepanitiaan acara, organisasi mahasiswa, dan komunitas kreatif yang mengutamakan kecepatan pembayaran tanpa prosedur birokrasi berbelit.
                </p>

                {/* Structured Specifications */}
                <div className="space-y-6 pt-6 border-t border-zinc-100">
                  <div className="flex items-start gap-3.5">
                    <CheckCircle2 className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-heading font-bold text-sm text-zinc-950 mb-1">
                        01. Diplomasi Bahasa &amp; Etika
                      </h4>
                      <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                        Format notifikasi pengingat otomatis dengan tata bahasa santun dan diplomatis yang menjaga etika relasi kemitraan tetap terpercaya.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <CheckCircle2 className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-heading font-bold text-sm text-zinc-950 mb-1">
                        02. Kanal Transaksi Langsung
                      </h4>
                      <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                        QRIS Dinamis Instan — Bendahara organisasi cukup memindai barcode melalui aplikasi e-wallet kepanitiaan tanpa transfer manual.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <CheckCircle2 className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-heading font-bold text-sm text-zinc-950 mb-1">
                        03. Skema Termin Bertahap
                      </h4>
                      <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                        Uang muka 30% untuk memulai pengerjaan, dan pelunasan 70% diselesaikan sebelum penutupan Laporan Pertanggungjawaban (LPJ).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Target Highlight */}
            <div className="mx-8 sm:mx-10 mb-8 pt-6 border-t border-zinc-100 text-xs text-zinc-500 flex items-center justify-between">
              <span>Rekomendasi Transaksi:</span>
              <span className="font-semibold text-zinc-800">Cepat, Fleksibel, Multi e-Wallet</span>
            </div>
          </div>

          {/* JALUR 02: Skala Industri & Korporat B2B */}
          <div className="bg-white rounded-3xl overflow-hidden border border-zinc-200 hover:border-zinc-300 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between">
            <div>
              {/* Photo Banner */}
              <div className="relative h-56 sm:h-64 w-full bg-zinc-100 overflow-hidden">
                <Image
                  src="/images/track_corporate.jpg"
                  alt="Skala Industri dan Korporat B2B"
                  fill
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-red-600" />
                  <span className="text-xs font-bold text-zinc-900 font-mono">JALUR 02</span>
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="text-xs font-medium text-red-200 block mb-1">Perseroan Resmi (PT / CV)</span>
                  <h3 className="text-xl sm:text-2xl font-heading font-bold tracking-tight">
                    Skala Industri &amp; Korporat B2B
                  </h3>
                </div>
              </div>

              {/* Body Content */}
              <div className="p-8 sm:p-10">
                <p className="text-sm sm:text-base text-zinc-600 leading-relaxed font-normal mb-8">
                  Standar transaksi formal komersial untuk agensi, perseroan berbadan hukum, dan korporasi yang membutuhkan kepatuhan administratif lengkap.
                </p>

                {/* Structured Specifications */}
                <div className="space-y-6 pt-6 border-t border-zinc-100">
                  <div className="flex items-start gap-3.5">
                    <CheckCircle2 className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-heading font-bold text-sm text-zinc-950 mb-1">
                        01. Diplomasi Bahasa Korporasi
                      </h4>
                      <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                        Standar korespondensi formal korporasi dilengkapi referensi Purchase Order (PO) &amp; Berita Acara resmi.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <CheckCircle2 className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-heading font-bold text-sm text-zinc-950 mb-1">
                        02. Kanal Pembayaran Perbankan
                      </h4>
                      <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                        Rekening Virtual Account resmi terverifikasi otomatis seketika tanpa perlu lampiran bukti mutasi rekening manual.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <CheckCircle2 className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-heading font-bold text-sm text-zinc-950 mb-1">
                        03. Skema Termin &amp; BAST
                      </h4>
                      <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                        Tata kelola uang muka 50% sebelum pengerjaan proyek dimulai, dan 50% pelunasan setelah Berita Acara Serah Terima (BAST).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Target Highlight */}
            <div className="mx-8 sm:mx-10 mb-8 pt-6 border-t border-zinc-100 text-xs text-zinc-500 flex items-center justify-between">
              <span>Rekomendasi Transaksi:</span>
              <span className="font-semibold text-zinc-800">Formal B2B, Virtual Account, Dokumen Legal</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
