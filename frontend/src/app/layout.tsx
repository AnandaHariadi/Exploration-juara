import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CLARA — Infrastruktur Finansial & Contract Intelligence Platform',
  description: 'Turn contracts into living business intelligence. Ekstraksi instruksi PKS, tata kelola termin bertahap, dan rekonsiliasi nilai kontrak.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="scroll-smooth">
      <body className="antialiased bg-white text-zinc-900 selection:bg-orange-500 selection:text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
