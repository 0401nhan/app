import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { scadaInitializer } from '@/lib/scadaInit';
scadaInitializer.initializeService();
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Solar Power Monitoring",
  description: "Solar Power Monitoring System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link 
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" 
          rel="stylesheet"
        />
        <link 
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css" 
          rel="stylesheet"
        />
        <script 
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"
          async
        />
      </head>
      <body className={inter.className}>
        <main className="container-fluid">
          {children}
        </main>
      </body>
    </html>
  );
}