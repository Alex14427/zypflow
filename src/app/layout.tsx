import type { Metadata } from 'next';
import { Fraunces, Manrope } from 'next/font/google';
import { Providers } from './providers';
import { ChatWidget } from '@/components/chat/chat-widget';
import './globals.css';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://zypflow.co.uk';
const sans = Manrope({ subsets: ['latin'], variable: '--font-sans' });
const serif = Fraunces({ subsets: ['latin'], variable: '--font-serif' });

export const metadata: Metadata = {
  title: {
    default: 'Zypflow | Clinic Revenue OS',
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
    title: 'Zypflow | Clinic Revenue OS',
    description: 'The automated revenue operating system for London aesthetics clinics.',
    url: APP_URL,
    siteName: 'Zypflow',
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zypflow | Clinic Revenue OS',
    description: 'Automated enquiry conversion, appointment protection, and patient reactivation for clinics.',
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
      <body className={`${sans.variable} ${serif.variable}`}>
        <Providers>
          {children}
          <ChatWidget />
        </Providers>
      </body>
    </html>
  );
}
