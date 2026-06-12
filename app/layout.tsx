import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SI-TAMU MAKO",
  description: "Sistem Informasi Tamu Markas Komando"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
