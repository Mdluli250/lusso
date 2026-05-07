import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { EmailPopup } from '@/components/marketing/EmailPopup';
import { ComparisonBar } from '@/components/comparison/ComparisonBar';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import { OrganizationJsonLd } from '@/components/seo/OrganizationJsonLd';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'https://lusso.co.za'),
  title: {
    template: '%s | Lusso',
    default: 'Lusso — Hand-Poured Luxury Candles',
  },
  description:
    'Discover Lusso\'s signature line of hand-poured candles. Elevate everyday living through scent, warmth, and quiet luxury. Shop our collection of artisan candles crafted in South Africa.',
  keywords: [
    'luxury candles',
    'hand-poured candles',
    'artisan candles',
    'South Africa',
    'soy candles',
    'scented candles',
    'Lusso',
  ],
  openGraph: {
    title: 'Lusso — Hand-Poured Luxury Candles',
    description:
      'Discover Lusso\'s signature line of hand-poured candles. Elevate everyday living through scent, warmth, and quiet luxury.',
    type: 'website',
    locale: 'en_ZA',
    siteName: 'Lusso',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[var(--theme-bg)] text-[var(--theme-accent)]">
        <OrganizationJsonLd />
        <SessionProvider>
          <ThemeProvider>
            <ToastProvider>
              <NavBar />
              <main className="flex-1 pb-[var(--comparison-bar-height,0px)]">{children}</main>
              <Footer />
              <ComparisonBar />
              <EmailPopup />
            </ToastProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
