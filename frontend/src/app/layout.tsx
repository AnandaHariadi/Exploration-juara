import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CLARA · Contract Intelligence & Value Assurance Platform',
  description: 'Turn Contracts into Living Business Intelligence. Rekonsiliasi presisi antara Kontrak, RAB, Progress Lapangan, dan Invoice.',
  icons: {
    icon: '/images/clara_icon.png',
    shortcut: '/images/clara_icon.png',
    apple: '/images/clara_icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "try{var t=localStorage.getItem('clara-theme');if(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)t='dark';document.documentElement.dataset.claraTheme=t==='dark'?'dark':'light'}catch(e){}" }} />
      </head>
      <body className="antialiased bg-white text-zinc-900 selection:bg-orange-500 selection:text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
