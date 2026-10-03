import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CLARA — Contract Business Intelligence & Monitoring',
  description: 'Turn contracts into living business intelligence. Optimizing business value through data and reconciliation.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
        {children}
      </body>
    </html>
  );
}
