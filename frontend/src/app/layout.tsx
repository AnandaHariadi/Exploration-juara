import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CLARA — Pantau kontrak dan keuangan proyek',
  description: 'Pantau pekerjaan, biaya, tagihan, dan perubahan kesepakatan proyek dalam satu tempat.',
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
