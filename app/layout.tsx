import type { Metadata } from "next";
import "./globals.css";
import { branding } from "@/lib/branding";

export const metadata: Metadata = {
  title: `${branding.agencyName} — Invoices & Contracts`,
  description: "Branded invoice and contract generator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
