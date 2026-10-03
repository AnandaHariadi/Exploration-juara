"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

const navItems = [
  { id: "beranda", label: "Beranda", href: "#beranda" },
  { id: "tentang", label: "Tentang CLARA", href: "#tentang" },
  { id: "kategori", label: "Target Industri", href: "#kategori" },
  { id: "alur", label: "Alur Rekonsiliasi", href: "#alur" },
  { id: "faq", label: "FAQ", href: "#faq" },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("beranda");

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 160;

      for (let i = navItems.length - 1; i >= 0; i--) {
        const el = document.getElementById(navItems[i].id);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSection(navItems[i].id);
          return;
        }
      }
      setActiveSection("beranda");
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-zinc-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-6">
        {/* Brand Identity - CLARA Icon + Gradient Wordmark */}
        <div className="flex items-center shrink-0">
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
            <Image
              src="/images/clara_icon.png"
              alt="CLARA Brandmark"
              width={40}
              height={40}
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain group-hover:scale-105 transition-transform drop-shadow-xs"
              priority
            />
            <span className="font-heading font-black text-2xl sm:text-3xl tracking-tighter bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
              CLARA
            </span>
          </Link>
        </div>

        {/* Main Desktop Navigation - Dynamically tracks active section */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm shrink-0">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                className={`transition-colors whitespace-nowrap ${
                  isActive
                    ? "text-red-600 font-bold"
                    : "text-zinc-600 font-medium hover:text-red-600"
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Action Buttons - Distinct, spaced out, single line */}
        <div className="hidden sm:flex items-center gap-5 shrink-0 pl-2">
          <Link
            href="/dashboard"
            className="text-sm font-bold text-zinc-600 hover:text-zinc-950 px-2 py-2 transition-colors whitespace-nowrap"
          >
            Masuk
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-heading font-bold text-sm px-5 py-2.5 rounded-lg shadow-sm hover:shadow transition-all whitespace-nowrap"
          >
            <span className="whitespace-nowrap">Buka Dashboard</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex lg:hidden items-center gap-2">
          <Link
            href="/dashboard"
            className="bg-red-600 text-white font-bold text-xs px-3 py-2 rounded-lg whitespace-nowrap"
          >
            Dashboard
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-zinc-600 hover:text-zinc-900 focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-zinc-200 bg-white px-4 pt-3 pb-6 space-y-3">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block text-sm py-1.5 ${
                  isActive
                    ? "font-bold text-red-600"
                    : "font-semibold text-zinc-700 hover:text-red-600"
                }`}
              >
                {item.label}
              </a>
            );
          })}
          <div className="pt-3 border-t border-zinc-100 flex flex-col gap-2">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="text-center font-bold text-sm text-zinc-700 py-2 border border-zinc-200 rounded-lg"
            >
              Masuk
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="text-center font-bold text-sm text-white bg-gradient-to-r from-orange-600 to-red-600 py-2.5 rounded-lg shadow-sm"
            >
              Buka Dashboard
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
