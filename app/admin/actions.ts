"use server";

import { cookies } from "next/headers";
import { getAdminClient } from "lib/insforge/admin";
import { searchDishImage } from "lib/ai/images";

async function requireAdmin() {
  const store = await cookies();
  const userId = store.get("swahili_user_id")?.value;
  if (!userId) return null;
  const admin = getAdminClient();
  const { data } = await admin.database.from("profiles").select("role").eq("id", userId).single();
  if (!data || !["ADMIN", "STAFF"].includes(data.role)) return null;
  return userId;
}

export async function updateOrderStatus(orderId: string, newStatus: string) {
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Unauthorized" };

  const admin = getAdminClient();
  const { error } = await admin.database
    .from("orders")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", orderId);

  if (error) return { error: error.message };

  await admin.database.from("order_status_history").insert({
    order_id: orderId,
    status: newStatus,
    changed_by: adminId,
  });

  return { success: true };
}

export async function toggleProductPublish(productId: string, published: boolean) {
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Unauthorized" };

  const admin = getAdminClient();
  const { error } = await admin.database
    .from("products")
    .update({ is_published: published, updated_at: new Date().toISOString() })
    .eq("id", productId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function updateOrderFulfillment(orderId: string, fulfillmentType: string) {
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Unauthorized" };

  const admin = getAdminClient();
  const { error } = await admin.database
    .from("orders")
    .update({ fulfillment_type: fulfillmentType, updated_at: new Date().toISOString() })
    .eq("id", orderId);

  if (error) return { error: error.message };
  return { success: true };
}

/**
 * Fetch images for products that don't have one, using Firecrawl.
 */
export async function batchFetchProductImages(): Promise<{
  processed: number;
  updated: number;
  errors: string[];
}> {
  const adminId = await requireAdmin();
  if (!adminId) return { processed: 0, updated: 0, errors: ["Unauthorized"] };

  const admin = getAdminClient();

  const { data: products } = await admin.database
    .from("products")
    .select("id, name, image_url")
    .or("image_url.is.null,image_url.eq.")
    .eq("is_published", true)
    .limit(20);

  if (!products || products.length === 0) {
    return { processed: 0, updated: 0, errors: [] };
  }

  let updated = 0;
  const errors: string[] = [];

  for (const product of products) {
    try {
      const imageUrl = await searchDishImage(product.name);
      if (imageUrl) {
        await admin.database
          .from("products")
          .update({ image_url: imageUrl })
          .eq("id", product.id);

        const { count } = await admin.database
          .from("product_images")
          .select("*", { count: "exact", head: true })
          .eq("product_id", product.id);

        await admin.database.from("product_images").insert({
          product_id: product.id,
          url: imageUrl,
          alt_text: product.name,
          sort_order: count || 0,
        });

        updated++;
      }
      await new Promise((r) => setTimeout(r, 500));
    } catch (e: any) {
      errors.push(`${product.name}: ${e.message}`);
    }
  }

  return { processed: products.length, updated, errors };
}
