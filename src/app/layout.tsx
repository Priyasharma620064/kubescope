import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AppShell } from '@/components/layout/app-shell';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'KubeScope — Kubernetes Observability & Debugging Workbench',
  description:
    'A full-stack Kubernetes operations platform for cluster debugging, observability, configuration management, and workload diagnostics.',
  keywords: [
    'kubernetes',
    'observability',
    'debugging',
    'dashboard',
    'devops',
    'sre',
    'platform-engineering',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
