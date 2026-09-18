import { NextRequest, NextResponse } from "next/server";
import { searchDishImage } from "lib/ai/images";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query) {
    return NextResponse.json({ error: "q parameter required" }, { status: 400 });
  }

  try {
    const imageUrl = await searchDishImage(query);
    if (!imageUrl) {
      return NextResponse.json({ error: "No image found" }, { status: 404 });
    }
    return NextResponse.json({ imageUrl, query });
  } catch (error: any) {
    console.error("Image search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
