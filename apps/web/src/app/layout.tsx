import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from 'next/link';
import UserProfile from '@/components/user-profile';
import MainNav from '@/components/main-nav';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZaiHub - AI 模型对比平台",
  description: "多AI模型对比平台，支持同时与多个AI模型对话",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased h-screen flex flex-col overflow-hidden`}> 
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">Z</span>
              </div>
              <span className="text-xl font-bold text-gray-800">ZaiHub</span>
            </Link>
            <nav className="flex items-center gap-6">
              <MainNav />
              <UserProfile />
            </nav>
          </div>
        </header>
        <div className="flex-1 min-h-0">
          {children}
        </div>
      </body>
    </html>
  );
}
