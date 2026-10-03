"use client";

import Image from "next/image";

interface Step {
  number: string;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    number: "01",
    title: "Ingestion Kontrak & RAB",
    description: "Unggah dokumen perjanjian kerja (PKS, SPK, SOW) dan file RAB proyek. AI mengekstrak deliverables, milestone penagihan, serta pos anggaran menjadi data terstruktur."
  },
  {
    number: "02",
    title: "Konfirmasi & Kunci Baseline V1",
    description: "Project Owner dan Finance memeriksa hasil ekstraksi (Human-in-the-loop). Setelah diverifikasi, sistem mengunci Baseline V1 resmi sebagai acuan tunggal proyek."
  },
  {
    number: "03",
    title: "Rekonsiliasi Multidimensi",
    description: "Engine deterministik mencocokkan progress lapangan dan biaya aktual terhadap baseline untuk mendeteksi Scope Variance, Budget Overrun, dan Unbilled Milestones."
  },
  {
    number: "04",
    title: "Change Request & Realisasi Nilai",
    description: "Setiap addendum atau penambahan scope resmi disahkan menjadi Baseline V2/V3 dengan audit trail lengkap, memastikan seluruh nilai kontrak terealisasi utuh."
  }
];

// ============================================================================
// DAFTAR LOGO MEDIA PARTNER & MITRA INSTANSI (Bisa Diganti Sendiri)
// Cara ganti:
// 1. Simpan file logo Anda di: public/images/partners/ (misal: logo1.png)
// 2. Ganti nilai "logo" di bawah ini sesuai nama file Anda
// ============================================================================
interface PartnerItem {
  id: number;
  name: string;
  category: string;
  logo: string;
  alt: string;
}

const partners: PartnerItem[] = [
  {
    id: 1,
    name: "UPN Veteran Jawa Timur",
    category: "Lembaga Akademik & Riset",
    logo: "/images/partners/logo_upnvjt.png",
    alt: "Logo UPN Veteran Jawa Timur",
  },
  {
    id: 2,
    name: "Kebun Sayur Surabaya (KSS)",
    category: "Mitra Bisnis & Agribisnis",
    logo: "/images/partners/logo_kss.png",
    alt: "Logo Kebun Sayur Surabaya KSS",
  },
  {
    id: 3,
    name: "Ngalup.co",
    category: "Hub Kolaborasi & Ekosistem Startup",
    logo: "/images/partners/logo_ngalup.png",
    alt: "Logo Ngalup.co",
  },
  {
    id: 4,
    name: "TTG",
    category: "Mitra Teknologi & Transformasi Digital",
    logo: "/images/partners/logo_ttg.png",
    alt: "Logo TTG",
  },
];

export function WorkflowSteps() {
  return (
    <section id="alur" className="py-20 md:py-28 bg-white border-b border-zinc-200 relative overflow-hidden">
      {/* Left Flank: Stepped Progressive Milestone Wave */}
      <div className="absolute left-0 sm:left-2 lg:left-4 xl:left-8 top-1/2 -translate-y-1/2 w-20 sm:w-28 md:w-36 lg:w-44 xl:w-56 h-auto pointer-events-none select-none z-0 opacity-65 sm:opacity-75 transition-opacity animate-float-slow">
        <Image
          src="/images/shapes/shape_alur_left.svg"
          alt="Clara Stepped Wave Left"
          width={450}
          height={850}
          className="w-full h-auto object-contain"
        />
      </div>

      {/* Right Flank: Circular Milestone Completion Orbit */}
      <div className="absolute right-0 sm:right-2 lg:right-4 xl:right-8 top-1/2 -translate-y-1/2 w-20 sm:w-28 md:w-36 lg:w-44 xl:w-56 h-auto pointer-events-none select-none z-0 opacity-65 sm:opacity-75 transition-opacity animate-float-reverse">
        <Image
          src="/images/shapes/shape_alur_right.svg"
          alt="Clara Milestone Orbit Right"
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
              Alur Kerja Contract Intelligence
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-zinc-950 tracking-tight mb-4">
            <span className="block">Empat Tahapan</span>
            <span className="block">Rekonsiliasi Terpadu</span>
          </h2>
          <p className="text-base sm:text-lg text-zinc-600 leading-relaxed font-normal">
            Dari ekstraksi dokumen hingga pencocokan deterministik, seluruh alur dirancang akuntabel dengan konfirmasi manusia di setiap titik keputusan penting.
          </p>
        </div>

        {/* 4 Connected Process Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 pt-10 border-t border-zinc-200">
          {steps.map((item, index) => (
            <div key={item.number} className={`relative flex flex-col justify-start reveal-scale reveal-delay-${index + 1}`}>
              {/* Monospace Step Indicator */}
              <div className="flex items-center gap-3 mb-4">
                <span className="font-heading font-bold text-3xl sm:text-4xl text-red-600 font-mono tracking-tight">
                  {item.number}
                </span>
                <span className="h-px bg-zinc-200 flex-1" />
              </div>

              {/* Title */}
              <h3 className="font-heading font-bold text-lg sm:text-xl text-zinc-950 mb-2.5 leading-snug">
                {item.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-zinc-600 leading-relaxed font-normal">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* ================================================================ */}
        {/* MITRA & MEDIA PARTNER SECTION (4 LOGO INSTANSI)                  */}
        {/* ================================================================ */}
        <div className="mt-20 pt-12 border-t border-zinc-200 reveal-on-scroll">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-red-600" />
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono">
                  Ekosistem &amp; Kolaborasi
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-heading font-bold text-zinc-950 tracking-tight">
                Media Partner &amp; Mitra Instansi
              </h3>
            </div>
            <p className="text-sm text-zinc-500 max-w-md font-normal">
              Didukung oleh kolaborasi strategis bersama institusi akademik, inkubator teknologi, dan jaringan media nasional.
            </p>
          </div>

          {/* 4 Partner Logo Cards (Pure Logos, Enlarged & Clean) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {partners.map((partner) => (
              <div
                key={partner.id}
                className="group relative bg-zinc-50/70 hover:bg-white rounded-2xl border border-zinc-200/90 hover:border-red-600/50 p-6 sm:p-8 transition-all duration-300 hover:shadow-xl flex items-center justify-center h-32 sm:h-36 md:h-40 overflow-hidden"
              >
                {/* Red hover accent bar on top */}
                <span className="absolute top-0 left-0 right-0 h-[2.5px] bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Prominent Enlarged Logo Slot */}
                <div className="relative w-full h-full flex items-center justify-center">
                  <Image
                    src={partner.logo}
                    alt={partner.alt}
                    width={260}
                    height={120}
                    className="max-h-full max-w-[90%] w-auto h-auto object-contain opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 drop-shadow-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
