import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '나의 철학 별자리',
  description: '당신의 키워드가 별이 되고, 연결이 별자리가 됩니다',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}


