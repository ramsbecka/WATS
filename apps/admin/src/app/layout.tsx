import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth';
import './globals.css';

export const metadata: Metadata = {
  title: 'WATS Admin',
  description: 'WATS Admin Dashboard',
  applicationName: 'WATS Admin',
  icons: { icon: '/logo.png', apple: '/logo.png' },
  openGraph: {
    title: 'WATS Admin',
    description: 'WATS Admin Dashboard',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'WATS Admin',
    description: 'WATS Admin Dashboard',
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
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
