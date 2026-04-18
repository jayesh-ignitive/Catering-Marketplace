import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse caterers",
  description:
    "Discover Bharat Catering partners for weddings, corporates, and celebrations. Filter by city, service type, and budget.",
};

export default function CaterersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
