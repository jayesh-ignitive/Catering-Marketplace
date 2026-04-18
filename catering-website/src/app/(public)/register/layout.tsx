import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register",
  description: "Create a catering account.",
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
