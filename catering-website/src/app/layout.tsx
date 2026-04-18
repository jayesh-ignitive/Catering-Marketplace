import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ToastContainer } from "react-toastify";
import { AppProviders } from "./providers";
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Catering Website",
    template: "%s | Catering Website",
  },
  description: "Find caterers by city and service — Next.js and NestJS catalog API.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} h-full antialiased`}>
      <body className="flex min-h-screen flex-col bg-[var(--background)] font-sans text-[var(--foreground)]">
        <AppProviders>
          {children}
          <ToastContainer position="top-right" theme="colored" hideProgressBar closeOnClick />
        </AppProviders>
      </body>
    </html>
  );
}
