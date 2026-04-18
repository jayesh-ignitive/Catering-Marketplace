import type { Metadata } from "next";
import { Great_Vibes, Inter, Outfit } from "next/font/google";
import { ToastContainer } from "react-toastify";
import { AppProviders } from "./providers";
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "600", "800"],
});

const greatVibes = Great_Vibes({
  variable: "--font-great-vibes",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: {
    default: "Bharat Caterers — India's Trusted Catering Directory",
    template: "%s | Bharat Caterers",
  },
  description:
    "Find the best catering service providers near you. India's trusted catering directory with 10,000+ happy customers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} ${greatVibes.variable} h-full antialiased`}
    >
      <body className="flex min-h-screen flex-col bg-white font-sans text-gray-800">
        <AppProviders>
          {children}
          <ToastContainer position="top-right" theme="colored" hideProgressBar closeOnClick />
        </AppProviders>
      </body>
    </html>
  );
}
