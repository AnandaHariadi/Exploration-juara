import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CLARA — Infrastruktur Finansial & Otomasi Penagihan Profesional",
  description: "Platform otomasi penagihan independen dari CLARA untuk talenta mandiri: Ekstraksi instruksi bahasa alami, tata kelola termin bertahap, serta integrasi QRIS & Virtual Account perbankan nasional.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="scroll-smooth">
      <body className="bg-white text-zinc-900 antialiased min-h-screen selection:bg-orange-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
