import type { Metadata, Viewport } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ReactQueryProvider } from "@/components/providers/query-provider";
import { AppShell } from "@/components/AppShell";
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Zapia AI",
  description: "Next-gen WhatsApp Automation Platform",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Zapia AI",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#09090b", // Dark theme matching zinc
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className, "antialiased bg-background text-foreground overflow-hidden h-screen w-screen")}>
        <ReactQueryProvider>
          <AppShell>
            {children}
          </AppShell>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
