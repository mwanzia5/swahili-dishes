import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "lib/insforge/admin";
import { getRecipeWithProducts, addRecipeIngredientsToCart } from "lib/crm/recipe-products";

export async function GET(req: NextRequest) {
  const recipeId = req.nextUrl.searchParams.get("recipe_id");
  if (!recipeId) {
    return NextResponse.json({ error: "recipe_id required" }, { status: 400 });
  }

  const data = await getRecipeWithProducts(recipeId);
  if (!data) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { recipe_id, cart_id } = body;

  if (!recipe_id || !cart_id) {
    return NextResponse.json({ error: "recipe_id and cart_id required" }, { status: 400 });
  }

  const result = await addRecipeIngredientsToCart(recipe_id, cart_id);
  return NextResponse.json(result);
}
