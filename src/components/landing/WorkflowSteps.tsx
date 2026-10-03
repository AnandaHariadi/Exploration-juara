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
    name: "Instansi Mitra 01",
    category: "Lembaga Akademik & Riset",
    logo: "/images/partners/partner_1.svg", // GANTI LOGO 1 DI SINI
    alt: "Logo Mitra Instansi 1",
  },
  {
    id: 2,
    name: "Instansi Mitra 02",
    category: "Pusat Inkubasi Bisnis",
    logo: "/images/partners/partner_2.svg", // GANTI LOGO 2 DI SINI
    alt: "Logo Mitra Instansi 2",
  },
  {
    id: 3,
    name: "Media Partner 03",
    category: "Portal Finansial Nasional",
    logo: "/images/partners/partner_3.svg", // GANTI LOGO 3 DI SINI
    alt: "Logo Media Partner 3",
  },
  {
    id: 4,
    name: "Instansi Mitra 04",
    category: "Asosiasi Industri & Kreatif",
    logo: "/images/partners/partner_4.svg", // GANTI LOGO 4 DI SINI
    alt: "Logo Mitra Instansi 4",
  },
];

export function WorkflowSteps() {
  return (
    <section id="alur" className="py-20 md:py-28 bg-white border-b border-zinc-200 relative overflow-hidden">
      {/* Left Flank: Stepped Progressive Milestone Wave */}
      <div className="absolute left-0 sm:left-2 lg:left-4 xl:left-8 top-1/2 -translate-y-1/2 w-20 sm:w-28 md:w-36 lg:w-44 xl:w-56 h-auto pointer-events-none select-none z-0 opacity-65 sm:opacity-75 transition-opacity">
        <Image
          src="/images/shapes/shape_alur_left.svg"
          alt="Clara Stepped Wave Left"
          width={450}
          height={850}
          className="w-full h-auto object-contain"
        />
      </div>

      {/* Right Flank: Circular Milestone Completion Orbit */}
      <div className="absolute right-0 sm:right-2 lg:right-4 xl:right-8 top-1/2 -translate-y-1/2 w-20 sm:w-28 md:w-36 lg:w-44 xl:w-56 h-auto pointer-events-none select-none z-0 opacity-65 sm:opacity-75 transition-opacity">
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

          {/* 4 Partner Logo Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {partners.map((partner) => (
              <div
                key={partner.id}
                className="group relative bg-zinc-50/70 hover:bg-white rounded-xl border border-zinc-200/90 hover:border-red-600/60 p-5 sm:p-6 transition-all duration-300 hover:shadow-md flex flex-col items-center justify-center min-h-[140px] text-center overflow-hidden"
              >
                {/* Red hover accent bar on top */}
                <span className="absolute top-0 left-0 right-0 h-[2px] bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Logo slot */}
                <div className="w-full h-14 sm:h-16 flex items-center justify-center mb-3">
                  <Image
                    src={partner.logo}
                    alt={partner.alt}
                    width={220}
                    height={70}
                    className="max-h-full max-w-[85%] w-auto object-contain opacity-75 group-hover:opacity-100 filter grayscale group-hover:grayscale-0 transition-all duration-300"
                  />
                </div>

                {/* Subtitle / Role Badge */}
                <div className="mt-auto pt-2 border-t border-zinc-200/60 w-full flex items-center justify-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 group-hover:bg-red-600 transition-colors" />
                  <span className="text-[11px] font-mono font-medium text-zinc-500 group-hover:text-zinc-800 transition-colors truncate">
                    {partner.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
