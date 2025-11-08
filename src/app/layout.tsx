import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Eldergrove Legends',
  description: 'A hand-crafted 2D open-world RPG built with Phaser inside Next.js.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
