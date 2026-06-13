import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { LazyToast } from "@/components/LazyToast";
import { seoConfig } from "@/lib/seo";
import { AppProviders } from "./providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: seoConfig.defaultTitle,
    template: seoConfig.titleTemplate,
  },
  description: seoConfig.description,
  metadataBase: new URL(seoConfig.baseUrl),
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: ["/favicon.svg"],
    apple: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    type: "website",
    siteName: seoConfig.siteName,
    title: seoConfig.defaultTitle,
    description: seoConfig.description,
    images: [{ url: seoConfig.defaultOgImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: seoConfig.defaultTitle,
    description: seoConfig.description,
    images: [seoConfig.defaultOgImage],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} h-full antialiased`}>
      <head>
        <link rel="preconnect" href="https://cdn.caterersspace.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.bharatcaterhub.com" crossOrigin="anonymous" />
      </head>
      <body className="flex min-h-screen flex-col bg-white font-sans text-gray-800">
        <AppProviders>
          {children}
          <LazyToast />
        </AppProviders>
      </body>
    </html>
  );
}
