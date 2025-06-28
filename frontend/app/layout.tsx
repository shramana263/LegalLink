import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "../components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LegalLink - Connect with Legal Experts",
  description:
    "AI-powered legal assistance platform connecting users with verified advocates",
  generator: "v0.dev",
  icons: {
    icon: [
      {
        url: "/logo.svg",
        sizes: "64x64", // Larger size
        type: "image/svg+xml",
      },
      {
        url: "/logo.svg",
        sizes: "32x32",
        type: "image/svg+xml",
      }
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider defaultTheme="light">
          <LanguageProvider>
            <AuthProvider>
              {children}
              <Toaster />
              {/* Hidden Google Translate Element */}
              <div id="google_translate_element" style={{ display: 'none' }}></div>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
