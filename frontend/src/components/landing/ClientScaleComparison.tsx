"use client";

import Image from "next/image";
import { CheckCircle2, Building2, Users } from "lucide-react";

export function ClientScaleComparison() {
  return (
    <section id="kategori" className="py-20 md:py-28 bg-zinc-50/70 border-b border-zinc-200 relative overflow-hidden">
      {/* Left Flank: Architectural Curved Wing */}
      <div className="absolute left-0 sm:left-2 lg:left-4 xl:left-8 top-1/2 -translate-y-1/2 w-20 sm:w-28 md:w-36 lg:w-44 xl:w-56 h-auto pointer-events-none select-none z-0 opacity-65 sm:opacity-75 transition-opacity animate-float-slow">
        <Image
          src="/images/shapes/shape_kategori_left.svg"
          alt="Clara Architectural Wing Left"
          width={450}
          height={800}
          className="w-full h-auto object-contain"
        />
      </div>

      {/* Right Flank: Geometric Horizon Arch */}
      <div className="absolute right-0 sm:right-2 lg:right-4 xl:right-8 top-1/2 -translate-y-1/2 w-20 sm:w-28 md:w-36 lg:w-44 xl:w-56 h-auto pointer-events-none select-none z-0 opacity-65 sm:opacity-75 transition-opacity animate-float-reverse">
        <Image
          src="/images/shapes/shape_kategori_right.svg"
          alt="Clara Horizon Arch Right"
          width={500}
          height={800}
          className="w-full h-auto object-contain"
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header - Astra Corporate Style */}
        <div className="max-w-3xl mb-16 reveal-on-scroll">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-[2px] bg-red-600 inline-block" />
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono">
              Target Industri &amp; Model Proyek
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-zinc-950 tracking-tight mb-4">
            Dua Fokus Rekonsiliasi Bisnis
          </h2>
          <p className="text-base sm:text-lg text-zinc-600 leading-relaxed font-normal">
            Sistem CLARA secara cerdas menyesuaikan parameter rekonsiliasi berdasarkan karakteristik kontrak, jenis deliverable, dan model penagihan industri Anda.
          </p>
        </div>

        {/* 2-Track Enterprise Comparison Cards (Generous Size + Rich Visuals) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
          {/* JALUR 01: Software House & IT Outsourcing */}
          <div className="bg-white rounded-3xl overflow-hidden border border-zinc-200 hover:border-red-600/40 shadow-sm card-executive-hover flex flex-col justify-between group reveal-3d reveal-delay-1">
            <div>
              {/* Photo Banner */}
              <div className="relative h-56 sm:h-64 w-full bg-zinc-100 overflow-hidden">
                <Image
                  src="/images/corporate_tech_rd.jpg"
                  alt="Software House dan IT Outsourcing"
                  fill
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-red-600" />
                  <span className="text-xs font-bold text-zinc-900 font-mono">SEGMEN 01</span>
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="text-xs font-medium text-red-200 block mb-1">Development &amp; Tech Services</span>
                  <h3 className="text-xl sm:text-2xl font-heading font-bold tracking-tight">
                    Software House &amp; IT Outsourcing
                  </h3>
                </div>
              </div>

              {/* Body Content */}
              <div className="p-8 sm:p-10">
                <p className="text-sm sm:text-base text-zinc-600 leading-relaxed font-normal mb-8">
                  Optimal untuk proyek berbasis milestone pengerjaan, rate card per developer, serta siklus sprint pengerjaan dengan risiko tinggi terjadinya scope creep dan unbilled deliverables.
                </p>

                {/* Structured Specifications */}
                <div className="space-y-6 pt-6 border-t border-zinc-100">
                  <div className="flex items-start gap-3.5">
                    <CheckCircle2 className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-heading font-bold text-sm text-zinc-950 mb-1">
                        01. Deteksi Scope Creep Sprint
                      </h4>
                      <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                        Memantau penambahan fitur baru di luar SOW awal dan memicu alert sebelum memicu kerugian jam kerja dan biaya developer.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <CheckCircle2 className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-heading font-bold text-sm text-zinc-950 mb-1">
                        02. Milestone to Billing Trigger
                      </h4>
                      <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                        Mengingatkan finance secara seketika saat sprint atau milestone teknis rampung agar tagihan termin langsung diterbitkan tanpa penundaan.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <CheckCircle2 className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-heading font-bold text-sm text-zinc-950 mb-1">
                        03. Rekonsiliasi RAB &amp; Man-Days
                      </h4>
                      <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                        Mencocokkan alokasi man-days developer pada RAB rencana dengan aktual pengerjaan di lapangan guna menjaga batas profit margin.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Target Highlight */}
            <div className="mx-8 sm:mx-10 mb-8 pt-6 border-t border-zinc-100 text-xs text-zinc-500 flex items-center justify-between">
              <span>Model Pengerjaan:</span>
              <span className="font-semibold text-zinc-800">Milestone, SOW, Time &amp; Material</span>
            </div>
          </div>

          {/* JALUR 02: Consulting & Creative Agencies */}
          <div className="bg-white rounded-3xl overflow-hidden border border-zinc-200 hover:border-red-600/40 shadow-sm card-executive-hover flex flex-col justify-between group reveal-3d reveal-delay-2">
            <div>
              {/* Photo Banner */}
              <div className="relative h-56 sm:h-64 w-full bg-zinc-100 overflow-hidden">
                <Image
                  src="/images/corporate_fintech_ops.jpg"
                  alt="Consulting Firms dan Creative Agencies"
                  fill
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-orange-600" />
                  <span className="text-xs font-bold text-zinc-900 font-mono">SEGMEN 02</span>
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="text-xs font-medium text-orange-200 block mb-1">Professional &amp; Advisory Services</span>
                  <h3 className="text-xl sm:text-2xl font-heading font-bold tracking-tight">
                    Consulting &amp; Creative Agencies
                  </h3>
                </div>
              </div>

              {/* Body Content */}
              <div className="p-8 sm:p-10">
                <p className="text-sm sm:text-base text-zinc-600 leading-relaxed font-normal mb-8">
                  Dirancang khusus bagi agensi kreatif, konsultan manajemen, dan penyedia jasa profesional dengan paket deliverable tetap, kuota revisi, dan kontrak retainer berkala.
                </p>

                {/* Structured Specifications */}
                <div className="space-y-6 pt-6 border-t border-zinc-100">
                  <div className="flex items-start gap-3.5">
                    <CheckCircle2 className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-heading font-bold text-sm text-zinc-950 mb-1">
                        01. Monitoring Kuota Revisi
                      </h4>
                      <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                        Menghitung otomatis putaran revisi klien terhadap batas ketentuan kontrak, mencegah pekerjaan tak terbayar dan memicu klausul addendum.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <CheckCircle2 className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-heading font-bold text-sm text-zinc-950 mb-1">
                        02. Pelacakan Retainer &amp; Deliverables
                      </h4>
                      <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                        Memastikan seluruh deliverable bulanan terpenuhi secara transparan sebelum invoice periode berjalan ditagihkan kepada klien.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <CheckCircle2 className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-heading font-bold text-sm text-zinc-950 mb-1">
                        03. Rekonsiliasi Plafon Biaya Vendor
                      </h4>
                      <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                        Mengawal pengeluaran pihak ketiga (vendor media placement, talent, cetak) agar tidak melampaui alokasi plafon RAB yang disepakati.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Target Highlight */}
            <div className="mx-8 sm:mx-10 mb-8 pt-6 border-t border-zinc-100 text-xs text-zinc-500 flex items-center justify-between">
              <span>Model Pengerjaan:</span>
              <span className="font-semibold text-zinc-800">Retainer, Deliverable-based, Fixed Fee</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
