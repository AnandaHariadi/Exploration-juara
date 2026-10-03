import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-zinc-950 text-white pt-16 pb-12 border-t border-zinc-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Corporate Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-zinc-800 text-xs text-zinc-400">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-heading font-black text-base shrink-0">
                C
              </div>
              <Image
                src="/images/clara_logo_white.svg"
                alt="Clara"
                width={120}
                height={36}
                className="h-6 sm:h-7 w-auto object-contain"
              />
            </div>
            <p className="max-w-md leading-relaxed text-zinc-400">
              Platform otomasi finansial terintegrasi dari <strong>Clara</strong> untuk pekerja lepas, talenta kreatif, dan solopreneur Indonesia. Menghubungkan instruksi percakapan dengan infrastruktur penagihan dan rekonsiliasi pembayaran resmi.
            </p>
          </div>

          <div className="space-y-2.5">
            <span className="font-heading font-bold text-white text-xs uppercase tracking-wider block mb-3">
              Navigasi Cepat
            </span>
            <p><a href="#tentang" className="hover:text-white transition-colors">Tentang Clara</a></p>
            <p><a href="#kategori" className="hover:text-white transition-colors">Kategori Klien</a></p>
            <p><a href="#alur" className="hover:text-white transition-colors">Alur Penagihan</a></p>
            <p><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard Finansial</Link></p>
          </div>

          <div className="space-y-2.5">
            <span className="font-heading font-bold text-white text-xs uppercase tracking-wider block mb-3">
              Infrastruktur &amp; Kepatuhan
            </span>
            <p className="text-zinc-400">Terintegrasi Gateway Xendit</p>
            <p className="text-zinc-400">Standar QRIS Bank Indonesia</p>
            <p className="text-zinc-400">Enkripsi Token End-to-End</p>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500">
          <p>© 2026 Clara — Inovasi Teknologi Finansial Talenta Mandiri Indonesia. Hak cipta dilindungi.</p>
          <p className="text-zinc-500">Mendukung Transaksi Komunitas Kampus hingga Korporat B2B</p>
        </div>
      </div>
    </footer>
  );
}
