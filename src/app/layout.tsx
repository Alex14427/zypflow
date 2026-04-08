import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Providers } from './providers';
import { ChatWidget } from '@/components/chat/chat-widget';
import { CookieConsent } from '@/components/cookie-consent';
import './globals.css';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://zypflow.co.uk';

const sans = localFont({
  src: [{ path: '../fonts/manrope-variable.woff2', style: 'normal' }],
  variable: '--font-sans',
  display: 'swap',
  fallback: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
});

export const metadata: Metadata = {
  title: {
    default: 'Zypflow | Revenue OS For Service Businesses',
    template: '%s | Zypflow',
  },
  description:
    'Convert more enquiries, protect more appointments, and bring patients back automatically with Zypflow.',
  metadataBase: new URL(APP_URL),
  alternates: {
    canonical: APP_URL,
  },
  applicationName: 'Zypflow',
  openGraph: {
    title: 'Zypflow | Revenue OS For Service Businesses',
    description: 'The automated revenue operating system for service businesses. Faster lead response, stronger booking conversion, fewer no-shows.',
    url: APP_URL,
    siteName: 'Zypflow',
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zypflow | Revenue OS For Service Businesses',
    description: 'Automated enquiry conversion, appointment protection, and patient reactivation.',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} font-sans`}>
        <Providers>
          {children}
          <ChatWidget />
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}
