"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight, ChevronLeft, ShieldCheck, Layers, Cpu } from "lucide-react";
import { useState, useEffect } from "react";

interface OfficeSlide {
  src: string;
  badge: string;
  caption: string;
  title: string;
}

const officeSlides: OfficeSlide[] = [
  {
    src: "/images/yupiens_hq.jpg",
    badge: "GEDUNG PUSAT CLARA",
    caption: "Pusat Inovasi Finansial",
    title: "Infrastruktur Transaksi Mandiri Terintegrasi",
  },
  {
    src: "/images/yupiens_office_lobby.jpg",
    badge: "EXECUTIVE INNOVATION ATRIUM",
    caption: "Pusat Kolaborasi Strategis",
    title: "Ruang Kemitraan Komersial & Inkubasi Produk Digital",
  },
  {
    src: "/images/corporate_fintech_ops.jpg",
    badge: "FINTECH OPERATIONS & GATEWAY",
    caption: "Divisi Operasional & Gateway",
    title: "Pemantauan Arus Kas & Rekonsiliasi Real-Time 24/7",
  },
  {
    src: "/images/corporate_tech_rd.jpg",
    badge: "TECHNOPARK R&D LAB",
    caption: "Laboratorium Riset & Rekayasa",
    title: "Pusat Rekayasa Algoritma & Keamanan Finansial Nasional",
  },
];

export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % officeSlides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % officeSlides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + officeSlides.length) % officeSlides.length);
  return (
    <section id="beranda" className="relative bg-white pt-12 pb-16 md:pt-20 md:pb-24 border-b border-zinc-200 overflow-hidden">
      {/* Background Subtle Corporate Texture */}
      <div className="absolute inset-0 pointer-events-none -z-20 opacity-[0.05] mix-blend-multiply overflow-hidden">
        <Image
          src="/images/corporate_texture.jpg"
          alt="Corporate Texture"
          fill
          priority
          className="object-cover object-center"
        />
      </div>
      {/* Clara Executive Monumental Ribbon (Left Flank - 3D Architectural Flow & Radiant Aura) */}
      <div className="absolute -left-6 sm:-left-4 lg:left-0 xl:left-2 top-0 sm:top-2 lg:top-4 w-36 sm:w-56 md:w-72 lg:w-96 xl:w-[440px] h-auto pointer-events-none select-none z-[1] opacity-85 sm:opacity-95 transition-all">
        <Image
          src="/images/shapes/hero_ribbon_monument_left.svg"
          alt="Clara Executive Ribbon Left"
          width={650}
          height={1000}
          className="w-full h-auto object-contain"
          priority
        />
      </div>

      {/* Clara Executive Monumental Ribbon (Right Flank - 3D Upward Momentum & FinTech Strata) */}
      <div className="absolute -right-6 sm:-right-4 lg:right-0 xl:right-2 top-0 sm:top-2 lg:top-4 w-36 sm:w-56 md:w-72 lg:w-96 xl:w-[440px] h-auto pointer-events-none select-none z-[1] opacity-85 sm:opacity-95 transition-all">
        <Image
          src="/images/shapes/hero_ribbon_monument_right.svg"
          alt="Clara Executive Ribbon Right"
          width={650}
          height={1000}
          className="w-full h-auto object-contain"
          priority
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Editorial Header - Perfectly Center-Aligned */}
        <div className="text-center max-w-4xl mx-auto mb-16 relative z-10">
          {/* Astra-Style Centered Corporate Kicker - Elevating Clara */}
          <div className="inline-flex items-center justify-center gap-3 mb-6">
            <span className="w-8 h-[2px] bg-red-600 inline-block" />
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono">
              Ekosistem Teknologi Finansial Clara
            </span>
            <span className="w-8 h-[2px] bg-red-600 inline-block" />
          </div>

          {/* Grand Commanding Clara Wordmark (Main Brand Focal Point) */}
          <div className="flex justify-center items-center my-6 sm:my-8">
            <Image
              src="/images/clara_logo.svg"
              alt="Clara"
              width={900}
              height={270}
              priority
              className="h-28 sm:h-36 md:h-44 lg:h-52 xl:h-60 w-auto object-contain filter drop-shadow-xs"
            />
          </div>

          {/* Sub-headline - Guaranteed Single Line (No Spillover / Tidak Nyisa) */}
          <h1 className="text-sm sm:text-base md:text-xl lg:text-2xl font-heading font-semibold text-zinc-800 tracking-tight whitespace-nowrap mb-5 max-w-5xl mx-auto">
            Infrastruktur Finansial &amp; Otomasi Penagihan Profesional
          </h1>

          {/* Elevating Clara Company Copy - Corporate, Visionary & Prestigious */}
          <p className="text-sm sm:text-base text-zinc-600 leading-relaxed font-normal mb-8 max-w-3xl mx-auto">
            Sebagai pelopor otomasi administrasi digital, Clara membangun infrastruktur cerdas terintegrasi yang mentransformasi efisiensi transaksi, melindungi arus kas operasional, dan menghadirkan keunggulan bisnis berdaya saing tinggi bagi para profesional mandiri di seluruh Indonesia.
          </p>

          {/* Action Buttons - Centered */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white font-heading font-semibold text-sm sm:text-base px-8 py-3.5 sm:py-4 rounded-xl shadow-sm hover:shadow transition-all"
            >
              <span>Buka Dashboard Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#alur"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-zinc-700 hover:text-zinc-950 font-heading font-semibold text-sm sm:text-base px-7 py-3.5 sm:py-4 rounded-xl border border-zinc-300 hover:border-zinc-400 bg-white hover:bg-zinc-50 transition-all"
            >
              <span>Pelajari Alur Penagihan</span>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </a>
          </div>
        </div>

        {/* 3D Monumental Floating Showcase with 4-Image Auto-Sliding Office Carousel */}
        <div className="relative mb-16 sm:mb-20 group">
          {/* Ambient 3D Floor Shadow & Ambient Light Cast */}
          <div className="absolute -bottom-6 sm:-bottom-9 left-8 sm:left-14 right-8 sm:right-14 h-12 sm:h-16 bg-zinc-950/40 blur-2xl sm:blur-3xl rounded-[50px] -z-10 group-hover:scale-105 group-hover:blur-3xl transition-all duration-700" />
          <div className="absolute -bottom-8 sm:-bottom-12 left-24 sm:left-32 right-24 sm:right-32 h-16 sm:h-20 bg-gradient-to-r from-red-600/25 via-red-500/15 to-red-600/25 blur-3xl rounded-full -z-10 pointer-events-none" />

          {/* 3D Beveled Hardware Chassis with Perspective Pitch */}
          <div className="relative rounded-[26px] sm:rounded-[36px] p-2 sm:p-3 md:p-3.5 bg-gradient-to-b from-zinc-200 via-zinc-100 to-zinc-300 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.35),0_12px_28px_-6px_rgba(0,0,0,0.18),0_1px_2px_rgba(255,255,255,0.95)_inset,0_0_0_1px_rgba(255,255,255,0.7)_inset] ring-1 ring-zinc-900/10 transition-all duration-700 ease-out [transform:perspective(1600px)_rotateX(3.5deg)] hover:[transform:perspective(1600px)_rotateX(0.5deg)_translateY(-8px)_scale(1.008)]">
            {/* Top Metallic Chamfer Highlight */}
            <div className="absolute top-0 left-12 right-12 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90 rounded-full pointer-events-none" />

            {/* Inner Precision Bezel & Screen */}
            <div className="relative rounded-[20px] sm:rounded-[28px] overflow-hidden border border-zinc-900/70 shadow-[inset_0_3px_12px_rgba(0,0,0,0.7)] bg-zinc-950">
              {/* Inner Glass Specular Sheen */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-white/[0.07] pointer-events-none z-20" />

              <div className="relative h-72 sm:h-96 md:h-[480px] w-full">
                {officeSlides.map((slide, index) => {
                  const isActive = index === currentSlide;
                  return (
                    <div
                      key={slide.src}
                      className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                        isActive ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
                      }`}
                    >
                      <Image
                        src={slide.src}
                        alt={slide.title}
                        fill
                        priority={index === 0}
                        className="object-cover object-center scale-100 group-hover:scale-105 transition-transform duration-1000 ease-out"
                      />
                      {/* Cinematic Astra Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/25 to-black/30" />

                      {/* Top Right Enterprise Badge - 3D Elevated Pill */}
                      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold font-mono text-zinc-900 shadow-[0_4px_16px_rgba(0,0,0,0.3)] border border-white/80 transform transition-transform duration-500 group-hover:translate-y-[-2px]">
                        {slide.badge}
                      </div>

                      {/* Bottom Left Architectural Caption */}
                      <div className="absolute bottom-6 left-6 sm:bottom-8 sm:left-8 text-white max-w-xl z-20">
                        <span className="text-xs font-mono text-red-400 uppercase tracking-widest block mb-1.5 font-bold">
                          {slide.caption}
                        </span>
                        <h3 className="text-lg sm:text-2xl md:text-3xl font-heading font-bold text-white tracking-tight leading-snug">
                          {slide.title}
                        </h3>
                      </div>
                    </div>
                  );
                })}

                {/* Bottom Right Slide Indicators & Navigation Controls */}
                <div className="absolute bottom-6 right-6 sm:bottom-8 sm:right-8 z-30 flex items-center gap-3 bg-zinc-950/70 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-[0_6px_20px_rgba(0,0,0,0.35)] transition-transform duration-500 group-hover:translate-y-[-2px]">
                  <button
                    onClick={prevSlide}
                    className="text-white/70 hover:text-white transition-colors p-1"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1.5 px-1">
                    {officeSlides.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentSlide(i)}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          i === currentSlide ? "w-6 bg-red-500" : "w-2 bg-white/40 hover:bg-white/70"
                        }`}
                        aria-label={`Go to slide ${i + 1}`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={nextSlide}
                    className="text-white/70 hover:text-white transition-colors p-1"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Clean, Neat Astra-Style 3-Column Trust Bar (Elevating Clara Core Architectural Values) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-zinc-200">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-zinc-100 text-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-heading font-bold text-sm text-zinc-950 mb-1">
                Arsitektur Teknologi Cerdas
              </h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Pemrosesan data transaksi presisi berbasis kecerdasan buatan untuk mereduksi beban administrasi manual.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-zinc-100 text-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-heading font-bold text-sm text-zinc-950 mb-1">
                Tata Kelola Arus Kas Terpadu
              </h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Sistem termin bertahap yang mengamankan kepastian arus kas dan melindungi nilai setiap hasil pekerjaan.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-zinc-100 text-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-heading font-bold text-sm text-zinc-950 mb-1">
                Kepatuhan &amp; Kontrol Penuh
              </h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Standar tata kelola komersial resmi dengan kendali verifikasi mandiri 100% sebelum dokumen diterbitkan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
