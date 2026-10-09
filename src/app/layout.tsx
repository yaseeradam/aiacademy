import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Integrated Academy Argungu | Student Verification Portal",
  description: "Official Student Information System & Verification Portal for AI Integrated Academy Argungu. Review, verify, and access official student academic records.",
  keywords: "AI Integrated Academy, Argungu, student data verification, parent portal, admission verification, SIS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50">
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
