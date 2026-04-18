import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in",
  description: "Sign in to your Bharat Catering caterer account.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
