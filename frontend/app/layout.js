import './globals.css';
import { Fraunces, Inter, Space_Grotesk } from 'next/font/google';
import Providers from './providers';

const grotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-grotesk', display: 'swap' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
// brand wordmark only
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', style: ['normal', 'italic'], weight: ['500'], display: 'swap' });

export const metadata = {
  title: 'Doctor Tracker',
  description: 'Manage doctors and their patients',
};

export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#0D1117' };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${grotesk.variable} ${inter.variable} ${fraunces.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
