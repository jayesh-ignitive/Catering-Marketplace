import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

/** Bust Next.js `fetchHomeHeroSlidesCached` after admin CRUD. */
export async function POST() {
  revalidateTag("catalog-home-banners", "max");
  return NextResponse.json({ revalidated: true });
}
