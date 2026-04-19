import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catering listing packages",
  description:
    "Compare Bharat Catering directory plans for kitchens and catering brands — visibility, profile depth, and lead features.",
};

export default function PackagesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
