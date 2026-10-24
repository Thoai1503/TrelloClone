import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";

import CurrentUserProvider from "./providers/CurrentUserProvider";

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
  title: "Trang chủ | Trello",
  description: "Quản lý công việc và không gian làm việc của bạn.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Suspense fallback={<div className="min-h-screen bg-[#f7f8fa]" />}>
          <CurrentUserProvider>{children}</CurrentUserProvider>
        </Suspense>
      </body>
    </html>
  );
}
