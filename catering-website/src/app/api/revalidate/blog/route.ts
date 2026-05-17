import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  revalidateTag("catalog-blog", "max");
  try {
    const body = (await request.json()) as { slug?: string };
    if (body.slug?.trim()) {
      revalidateTag(`blog-${body.slug.trim()}`, "max");
    }
  } catch {
    /* empty body is fine */
  }
  return NextResponse.json({ revalidated: true });
}
