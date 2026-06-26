import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Student Verification Portal | AI Integrated Academy Argungu",
  description: "Secure data verification portal for parents of AI Integrated Academy Argungu. Review, confirm, and correct your child's enrollment records.",
  keywords: "AI Integrated Academy, Argungu, student data verification, parent portal, admission verification",
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
