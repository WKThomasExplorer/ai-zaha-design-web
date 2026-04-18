import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import { Providers } from '@/components/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Zaha Home Design - Facade Renovation Tool',
  description:
    'Transform your home facade with AI. Upload your building photo, describe your dream design, and get stunning renovation renders instantly.',
  keywords: [
    'facade design',
    'home renovation',
    'exterior design',
    'AI design',
    'architectural visualization',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          <Inspector />
          {children}
        </Providers>
      </body>
    </html>
  );
}
