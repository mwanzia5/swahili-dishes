import { getAdminClient } from "lib/insforge/admin";

export interface RecipeProductLink {
  recipe_id: string;
  recipe_title: string;
  ingredients: Array<{
    name: string;
    quantity: string;
    product_id: string | null;
    product_name: string | null;
    product_price: number | null;
    product_slug: string | null;
  }>;
  total_cart_value: number;
}

export async function getRecipeWithProducts(recipeId: string): Promise<RecipeProductLink | null> {
  const admin = getAdminClient();

  const { data: recipe } = await admin.database
    .from("recipes").select("id, title").eq("id", recipeId).single();

  if (!recipe) return null;

  const { data: ingredients } = await admin.database
    .from("recipe_ingredients").select("*, products(name, price, slug)")
    .eq("recipe_id", recipeId).order("sort_order");

  if (!ingredients) return null;

  const linked = ingredients.map((ing: any) => ({
    name: ing.name,
    quantity: ing.quantity || "",
    product_id: ing.product_id,
    product_name: ing.products?.name || null,
    product_price: ing.products ? Number(ing.products.price) : null,
    product_slug: ing.products?.slug || null,
  }));

  const total = linked.reduce((sum: number, i) => sum + (i.product_price || 0), 0);

  return {
    recipe_id: recipe.id,
    recipe_title: recipe.title,
    ingredients: linked,
    total_cart_value: total,
  };
}

export async function addRecipeIngredientsToCart(
  recipeId: string,
  cartId: string
): Promise<{ added: number; skipped: number }> {
  const admin = getAdminClient();
  const recipe = await getRecipeWithProducts(recipeId);
  if (!recipe) return { added: 0, skipped: 0 };

  let added = 0;
  let skipped = 0;

  for (const ing of recipe.ingredients) {
    if (!ing.product_id) { skipped++; continue; }

    // Check if already in cart
    const { data: existing } = await admin.database
      .from("cart_items").select("id, quantity")
      .eq("cart_id", cartId).eq("product_id", ing.product_id).maybeSingle();

    if (existing) {
      await admin.database
        .from("cart_items").update({ quantity: existing.quantity + 1 })
        .eq("id", existing.id);
    } else {
      await admin.database.from("cart_items").insert({
        cart_id: cartId,
        product_id: ing.product_id,
        quantity: 1,
        unit_price: ing.product_price || 0,
      });
    }
    added++;
  }

  return { added, skipped };
}

export async function getRecipeProductsForDisplay(recipeSlug: string): Promise<Array<{
  name: string;
  quantity: string;
  product_id: string | null;
  product_name: string | null;
  product_price: number | null;
  product_slug: string | null;
  image_url: string | null;
}>> {
  const admin = getAdminClient();

  const { data: recipe } = await admin.database
    .from("recipes").select("id").eq("slug", recipeSlug).single();

  if (!recipe) return [];

  const { data: ingredients } = await admin.database
    .from("recipe_ingredients").select("*, products(name, price, slug, image_url)")
    .eq("recipe_id", recipe.id).order("sort_order");

  if (!ingredients) return [];

  return ingredients.map((ing: any) => ({
    name: ing.name,
    quantity: ing.quantity || "",
    product_id: ing.product_id,
    product_name: ing.products?.name || null,
    product_price: ing.products ? Number(ing.products.price) : null,
    product_slug: ing.products?.slug || null,
    image_url: ing.products?.image_url || null,
  }));
}
