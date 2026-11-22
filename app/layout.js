import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "SMARA KOPI — Penyimpanan, HPP & Operasional Usaha",
  description: "Aplikasi Penyimpanan / Gudang, Penghitungan HPP & Operasional Usaha SMARA KOPI",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#061830] text-white selection:bg-sky-400/30 selection:text-sky-100">
        {children}
      </body>
    </html>
  );
}
