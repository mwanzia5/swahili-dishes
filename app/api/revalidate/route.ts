import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json().catch(() => ({}));
    const path = (body.path as string) || "/";

    revalidatePath(path);

    return NextResponse.json({ revalidated: true, path, now: Date.now() });
  } catch (error) {
    return NextResponse.json(
      { error: "Error revalidating", details: String(error) },
      { status: 500 },
    );
  }
}