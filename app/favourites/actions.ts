"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "app/auth/actions";
import { createInsForgeServerClient } from "lib/insforge/server";

export type FavouriteResult = { fav: boolean; error?: string };

/**
 * Add or remove a product from the signed-in user's favourites.
 * RLS scopes reads/writes to auth.uid().
 */
export async function toggleFavourite(productId: string): Promise<FavouriteResult> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { fav: false, error: "Please sign in to save favourites." };
    }

    const db = await createInsForgeServerClient();
    const existing = await db.database
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .maybeSingle();

    if (!existing.error && existing.data) {
      await db.database.from("favorites").delete().eq("id", (existing.data as { id: string }).id);
      revalidatePath("/account");
      return { fav: false };
    }

    await db.database.from("favorites").insert([{ user_id: user.id, product_id: productId }]);
    revalidatePath("/account");
    return { fav: true };
  } catch (e) {
    console.error("toggleFavourite error:", e);
    return { fav: false, error: "Could not update favourites. Please try again." };
  }
}

/**
 * Read the signed-in user's favourite product ids (for heart states).
 */
export async function getFavouriteIds(): Promise<Set<string>> {
  const user = await getSessionUser();
  if (!user) return new Set();

  const db = await createInsForgeServerClient();
  const { data, error } = await db.database
    .from("favorites")
    .select("product_id")
    .eq("user_id", user.id);

  if (error) return new Set();
  return new Set((data as { product_id: string }[]).map((f) => f.product_id));
}