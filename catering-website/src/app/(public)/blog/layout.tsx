import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Insights",
  description: "Catering guides, trends, and planning tips from Bharat Catering.",
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
