import type React from "react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { Analytics } from "@vercel/analytics/react";
import { AuthProvider } from "@/context/AuthContext"; // 1. Import AuthProvider
import "./globals.css";

import { Inter, Roboto_Mono } from "next/font/google";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono = Roboto_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "ConnectSphere", // Updated title
  description: "Created for the ConnectSphere project",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} h-full`} suppressHydrationWarning>
     <body className="font-sans h-full">

        <Suspense fallback={null}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            {/* 2. Wrap children with AuthProvider */}
            <AuthProvider>
              {children}
            </AuthProvider>
            <Analytics />
          </ThemeProvider>
        </Suspense>
      </body>
    </html>
  );
}