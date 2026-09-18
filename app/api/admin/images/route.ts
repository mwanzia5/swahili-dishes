import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@insforge/sdk/ssr";
import { getAdminClient } from "lib/insforge/admin";

async function requireAdmin() {
  const store = await cookies();
  const userId = store.get("swahili_user_id")?.value;
  if (!userId) return null;
  const admin = getAdminClient();
  const { data } = await admin.database.from("profiles").select("role").eq("id", userId).single();
  if (!data || !["ADMIN", "STAFF"].includes(data.role)) return null;
  return userId;
}

export async function PUT(req: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { product_id, image_url, alt_text } = body;

  if (!product_id || !image_url) {
    return NextResponse.json({ error: "product_id and image_url required" }, { status: 400 });
  }

  const admin = getAdminClient();

  // Update product's main image_url
  const { error: updateErr } = await admin.database
    .from("products")
    .update({ image_url })
    .eq("id", product_id);

  if (updateErr) {
    console.error("Product image update error:", updateErr);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }

  // Also add to product_images table
  const { count } = await admin.database
    .from("product_images")
    .select("*", { count: "exact", head: true })
    .eq("product_id", product_id);

  const { error: imgErr } = await admin.database
    .from("product_images")
    .insert({
      product_id,
      url: image_url,
      alt_text: alt_text || null,
      sort_order: count || 0,
    });

  if (imgErr) {
    console.error("Product image insert error:", imgErr);
  }

  return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { product_id, image_url, alt_text } = body;

  if (!product_id || !image_url) {
    return NextResponse.json({ error: "product_id and image_url required" }, { status: 400 });
  }

  const admin = getAdminClient();

  // Add image to product_images table
  const { count } = await admin.database
    .from("product_images")
    .select("*", { count: "exact", head: true })
    .eq("product_id", product_id);

  const { data, error } = await admin.database
    .from("product_images")
    .insert({
      product_id,
      url: image_url,
      alt_text: alt_text || null,
      sort_order: count || 0,
    })
    .select()
    .single();

  if (error) {
    console.error("Product image add error:", error);
    return NextResponse.json({ error: "Failed to add image" }, { status: 500 });
  }

  return NextResponse.json({ success: true, image: data });
}

export async function DELETE(req: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { image_id } = body;

  if (!image_id) {
    return NextResponse.json({ error: "image_id required" }, { status: 400 });
  }

  const admin = getAdminClient();
  const { error } = await admin.database.from("product_images").delete().eq("id", image_id);

  if (error) {
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
