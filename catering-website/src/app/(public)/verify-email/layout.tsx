import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify email",
  description: "Confirm your email to activate your catering account.",
};

export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
