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
    badge: "CONTRACT INTELLIGENCE PLATFORM",
    caption: "Living Business Intelligence",
    title: "Mengubah Kontrak Pasif Menjadi Baseline Bisnis Aktif",
  },
  {
    src: "/images/yupiens_office_lobby.jpg",
    badge: "BEFORE & AFTER SIGNING",
    caption: "Mitigasi Risiko & Eksekusi",
    title: "Pahami Risiko Sebelum Tanda Tangan, Pantau Realisasi Setelahnya",
  },
  {
    src: "/images/corporate_fintech_ops.jpg",
    badge: "MULTIDIMENSIONAL RECONCILIATION",
    caption: "Sinkronisasi 4 Pilar Bisnis",
    title: "Rekonsiliasi Presisi: Kontrak, RAB, Progress Lapangan & Invoice",
  },
  {
    src: "/images/corporate_tech_rd.jpg",
    badge: "VALUE REALIZATION ENGINE",
    caption: "Audit Trail & Versioning",
    title: "Eliminasi Scope Creep, Budget Overrun, dan Unbilled Milestones",
  },
];

export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % officeSlides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % officeSlides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + officeSlides.length) % officeSlides.length);

  // Dynamic 3D perspective scroll calculations (responsive on scroll up and down)
  const scrollProgress = Math.min(1, Math.max(0, scrollY / 460));
  const dynamicPitch = (9.5 * (1 - scrollProgress)).toFixed(2); // 9.5deg down to 0deg
  const dynamicScale = (0.95 + 0.05 * scrollProgress).toFixed(3); // 0.95 up to 1.00
  const dynamicElevation = (-16 * (1 - scrollProgress)).toFixed(1);
  const leftRibbonY = scrollY * 0.15;
  const rightRibbonY = -scrollY * 0.12;
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
      {/* Clara Executive Ribbon (Left Flank) with 3D Parallax */}
      <div
        className="absolute top-0 -left-28 sm:-left-36 md:-left-44 lg:-left-40 xl:-left-28 2xl:-left-12 w-64 sm:w-80 md:w-96 lg:w-[420px] xl:w-[480px] h-auto pointer-events-none select-none z-0 opacity-80 sm:opacity-85 lg:opacity-90 transition-transform duration-100 ease-out will-change-transform"
        style={{ transform: `translateY(${leftRibbonY}px)` }}
      >
        <Image
          src="/images/shapes/hero_ribbon_monument_left.svg"
          alt="Clara Ribbon Left"
          width={650}
          height={1000}
          className="w-full h-auto object-contain"
          priority
        />
      </div>

      {/* Clara Executive Ribbon (Right Flank) with 3D Parallax */}
      <div
        className="absolute top-0 -right-28 sm:-right-36 md:-right-44 lg:-right-40 xl:-right-28 2xl:-right-12 w-64 sm:w-80 md:w-96 lg:w-[420px] xl:w-[480px] h-auto pointer-events-none select-none z-0 opacity-80 sm:opacity-85 lg:opacity-90 transition-transform duration-100 ease-out will-change-transform"
        style={{ transform: `translateY(${rightRibbonY}px)` }}
      >
        <Image
          src="/images/shapes/hero_ribbon_monument_right.svg"
          alt="Clara Ribbon Right"
          width={650}
          height={1000}
          className="w-full h-auto object-contain"
          priority
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Editorial Header - Perfectly Center-Aligned with Ample Ribbon Clearance */}
        <div className="text-center max-w-3xl mx-auto mb-16 relative z-10 px-4">

          {/* Massive Commanding CLARA Wordmark with Sculpted Arch & Dynamic Red-Orange Gradient */}
          <div className="relative my-6 sm:my-10 flex flex-col items-center justify-center select-none group px-2 sm:px-6">
            {/* The Majestic Arched CLARA Typography (Enlarged Scale + Red & Orange Gradient) */}
            <div className="flex items-center justify-center tracking-tight font-heading font-black text-7xl sm:text-8xl md:text-9xl lg:text-[11.5rem] xl:text-[13rem] leading-none filter drop-shadow-[0_10px_25px_rgba(220,38,38,0.15)]">
              <span className="inline-block transform translate-y-3 sm:translate-y-4 lg:translate-y-6 -rotate-6 transition-transform group-hover:scale-105 duration-300 bg-gradient-to-b from-orange-400 via-red-500 to-red-600 bg-clip-text text-transparent">
                C
              </span>
              <span className="inline-block transform translate-y-1 sm:translate-y-1.5 lg:translate-y-2 -rotate-3 transition-transform group-hover:scale-105 duration-300 bg-gradient-to-b from-orange-400 via-orange-500 to-red-600 bg-clip-text text-transparent">
                L
              </span>
              <span className="inline-block transform -translate-y-1 sm:-translate-y-2 lg:-translate-y-2.5 rotate-0 transition-transform group-hover:scale-105 duration-300 bg-gradient-to-b from-amber-400 via-orange-500 to-red-600 bg-clip-text text-transparent">
                A
              </span>
              <span className="inline-block transform translate-y-1 sm:translate-y-1.5 lg:translate-y-2 rotate-3 transition-transform group-hover:scale-105 duration-300 bg-gradient-to-b from-orange-400 via-orange-500 to-red-600 bg-clip-text text-transparent">
                R
              </span>
              <span className="inline-block transform translate-y-3 sm:translate-y-4 lg:translate-y-6 rotate-6 transition-transform group-hover:scale-105 duration-300 bg-gradient-to-b from-orange-400 via-red-500 to-red-600 bg-clip-text text-transparent">
                A
              </span>
            </div>

            {/* Sleek Dynamic Lekukan Horizon Arc with Matching Red-Orange Glow */}
            <div className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl mt-3 sm:mt-4 px-4 pointer-events-none">
              <svg viewBox="0 0 600 40" fill="none" className="w-full h-auto">
                <path
                  d="M 20 32 Q 300 6 580 32"
                  stroke="url(#claraCurveGlow)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="claraCurveGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#DC2626" stopOpacity="0" />
                    <stop offset="20%" stopColor="#DC2626" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#F97316" stopOpacity="1" />
                    <stop offset="80%" stopColor="#DC2626" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#DC2626" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Sub-headline - Guaranteed Single Line (No Spillover / Tidak Nyisa) */}
          <h1 className="text-sm sm:text-base md:text-xl lg:text-2xl font-heading font-semibold text-zinc-800 tracking-tight whitespace-nowrap mb-5 max-w-2xl mx-auto">
            Turn Contracts into Living Business Intelligence
          </h1>

          {/* Elevating Clara Company Copy - Corporate, Visionary & Prestigious */}
          <p className="text-sm sm:text-base md:text-lg text-zinc-600 leading-relaxed font-normal mb-6 max-w-2xl mx-auto">
            Platform Contract Intelligence &amp; Value Assurance terpadu untuk menyelaraskan klausul kesepakatan, alokasi anggaran, progres eksekusi lapangan, hingga kepastian penagihan secara deterministik demi melindungi margin profitabilitas bisnis Anda.
          </p>

          {/* 4-Pillar Visual Alignment Pipeline Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 mb-8 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100/90 border border-zinc-200/80 text-xs font-semibold text-zinc-700 shadow-xs hover:border-red-500/40 hover:bg-red-50/50 transition-all">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
              <span>Kontrak Kesepakatan</span>
            </div>
            <span className="text-zinc-300 font-bold hidden sm:inline">→</span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100/90 border border-zinc-200/80 text-xs font-semibold text-zinc-700 shadow-xs hover:border-red-500/40 hover:bg-red-50/50 transition-all">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              <span>Rencana Anggaran (RAB)</span>
            </div>
            <span className="text-zinc-300 font-bold hidden sm:inline">→</span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100/90 border border-zinc-200/80 text-xs font-semibold text-zinc-700 shadow-xs hover:border-red-500/40 hover:bg-red-50/50 transition-all">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Progres &amp; Biaya Lapangan</span>
            </div>
            <span className="text-zinc-300 font-bold hidden sm:inline">→</span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100/90 border border-zinc-200/80 text-xs font-semibold text-zinc-700 shadow-xs hover:border-red-500/40 hover:bg-red-50/50 transition-all">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              <span>Realisasi Penagihan</span>
            </div>
          </div>

          {/* Action Buttons - Centered */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white font-heading font-semibold text-sm sm:text-base px-8 py-3.5 sm:py-4 rounded-xl shadow-sm hover:shadow transition-all"
            >
              <span>Mulai Rekonsiliasi Kontrak</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#alur"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-zinc-700 hover:text-zinc-950 font-heading font-semibold text-sm sm:text-base px-7 py-3.5 sm:py-4 rounded-xl border border-zinc-300 hover:border-zinc-400 bg-white hover:bg-zinc-50 transition-all"
            >
              <span>Pelajari Alur Rekonsiliasi</span>
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
          <div
            className="relative rounded-[26px] sm:rounded-[36px] p-2 sm:p-3 md:p-3.5 bg-gradient-to-b from-zinc-200 via-zinc-100 to-zinc-300 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.35),0_12px_28px_-6px_rgba(0,0,0,0.18),0_1px_2px_rgba(255,255,255,0.95)_inset,0_0_0_1px_rgba(255,255,255,0.7)_inset] ring-1 ring-zinc-900/10 will-change-transform transition-transform duration-100 ease-out group-hover:scale-[1.008]"
            style={{
              transform: `perspective(1400px) rotateX(${dynamicPitch}deg) scale(${dynamicScale}) translateY(${dynamicElevation}px)`,
            }}
          >
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
                Ekstraksi Kontrak &amp; RAB Cerdas
              </h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                AI mengekstrak klausul, milestone, deliverable, dan pos anggaran dari PKS, SOW, dan RAB menjadi data terstruktur.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-zinc-100 text-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-heading font-bold text-sm text-zinc-950 mb-1">
                Rekonsiliasi Multidimensi
              </h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Deteksi otomatis Scope Variance, Budget Variance, dan Billing Gap secara deterministik untuk mencegah kebocoran margin.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-zinc-100 text-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-heading font-bold text-sm text-zinc-950 mb-1">
                Konfirmasi Baseline &amp; Versioning
              </h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Prinsip Human Confirms the Truth mengunci Baseline V1, dengan dukungan Change Request resmi untuk Baseline V2 dan V3.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
