import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.zypflow.com';

export const metadata: Metadata = {
  title: 'Zypflow — AI Customer Growth Platform',
  description: 'AI-powered customer acquisition and retention for UK service businesses. Capture leads, book appointments, and grow revenue on autopilot.',
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: 'Zypflow — AI Customer Growth Platform',
    description: 'Capture leads, book appointments, and grow revenue on autopilot with AI.',
    url: APP_URL,
    siteName: 'Zypflow',
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zypflow — AI Customer Growth Platform',
    description: 'Capture leads, book appointments, and grow revenue on autopilot with AI.',
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
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
