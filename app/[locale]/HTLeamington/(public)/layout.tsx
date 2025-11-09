// app/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hot Tacos Leamington',
  description:
    'Hot Tacos Leamington · Fresh tacos y sabores hechos con producto local del corredor agrícola.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
