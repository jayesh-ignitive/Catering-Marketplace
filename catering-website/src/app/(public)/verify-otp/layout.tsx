import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Enter verification code",
  description: "Confirm your email with the 6-digit code we sent you.",
};

export default function VerifyOtpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
