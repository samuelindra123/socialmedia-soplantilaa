import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/providers/query-provider";
import ToastProvider from "@/providers/toast-provider";
import { SocketProvider } from "@/providers/SocketProvider";
import GlobalUploadStatus from "@/components/uploads/GlobalUploadStatus";
import MaintenanceBanner from "@/components/MaintenanceBanner";
import { MaintenanceProvider } from "@/providers/maintenance-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Soplantila - Mindful Connection",
  description: "A modern digital space for your thoughts, community, and personal growth",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="scroll-smooth">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <MaintenanceProvider>
          <MaintenanceBanner />
          <QueryProvider>
            <SocketProvider>
              {children}
              <GlobalUploadStatus />
              <ToastProvider />
            </SocketProvider>
          </QueryProvider>
        </MaintenanceProvider>
      </body>
    </html>
  );
}
