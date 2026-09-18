import { createInsForgeServerClient } from "./server";
import type { Category, Product, ProductImage, ProductVariant, Recipe } from "./types";

// ─────────────────────────────────────────────────────────────
// Public storefront reads (anonymous session, RLS returns published only)
// ─────────────────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  const db = await createInsForgeServerClient();
  const { data, error } = await db.database
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name");

  if (error) {
    console.error("getCategories error:", error);
    return [];
  }
  return (data as Category[]) ?? [];
}

export async function getProducts(): Promise<Product[]> {
  const db = await createInsForgeServerClient();
  const { data, error } = await db.database
    .from("products")
    .select("*, category:categories!products_category_id_fkey(id, slug, name), images:product_images(*), variants:product_variants(*)")
    .eq("is_published", true)
    .order("is_featured", { ascending: false })
    .order("is_popular", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getProducts error:", error);
    return [];
  }
  return (data as Product[]) ?? [];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const db = await createInsForgeServerClient();
  const { data, error } = await db.database
    .from("products")
    .select("*, category:categories!products_category_id_fkey(id, slug, name), images:product_images(*), variants:product_variants(*)")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !data) {
    console.error("getProductBySlug error:", error);
    return null;
  }
  return data as Product;
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const db = await createInsForgeServerClient();
  const { data, error } = await db.database
    .from("products")
    .select("*, category:categories!products_category_id_fkey(id, slug, name), images:product_images(*), variants:product_variants(*)")
    .eq("is_published", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    console.error("getFeaturedProducts error:", error);
    return [];
  }
  return (data as Product[]) ?? [];
}

export async function getPopularProducts(): Promise<Product[]> {
  const db = await createInsForgeServerClient();
  const { data, error } = await db.database
    .from("products")
    .select("*, category:categories!products_category_id_fkey(id, slug, name), images:product_images(*), variants:product_variants(*)")
    .eq("is_published", true)
    .eq("is_popular", true)
    .order("rating", { ascending: false })
    .limit(6);

  if (error) {
    console.error("getPopularProducts error:", error);
    return [];
  }
  return (data as Product[]) ?? [];
}

export async function getProductsByCategorySlug(
  categorySlug: string,
  options?: {
    limit?: number;
    offset?: number;
    sort?: string;
    order?: "asc" | "desc";
    minPrice?: number;
    maxPrice?: number;
    available?: boolean;
  },
): Promise<{ products: Product[]; count: number }> {
  const db = await createInsForgeServerClient();
  let query = db.database
    .from("products")
    .select(
      "*, category:categories!products_category_id_fkey(id, slug, name), images:product_images(*), variants:product_variants(*)",
      { count: "exact" },
    )
    .eq("is_published", true)
    .eq("category.slug", categorySlug);

  if (options?.available === true) {
    query = query.eq("is_available", true);
  }
  if (typeof options?.minPrice === "number") {
    query = query.gte("price", options.minPrice);
  }
  if (typeof options?.maxPrice === "number") {
    query = query.lte("price", options.maxPrice);
  }

  const sortCol = options?.sort ?? "created_at";
  const ascending = options?.order === "asc";
  query = query.order(sortCol, { ascending }).range(options?.offset ?? 0, (options?.offset ?? 0) + (options?.limit ?? 50) - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("getProductsByCategorySlug error:", error);
    return { products: [], count: 0 };
  }

  return { products: (data as Product[]) ?? [], count: count ?? 0 };
}

export async function searchProducts(
  query: string,
  options?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    available?: boolean;
    sort?: string;
    order?: "asc" | "desc";
    limit?: number;
    offset?: number;
  },
): Promise<{ products: Product[]; count: number }> {
  const db = await createInsForgeServerClient();
  let q = db.database
    .from("products")
    .select(
      "*, category:categories!products_category_id_fkey(id, slug, name), images:product_images(*), variants:product_variants(*)",
      { count: "exact" },
    )
    .eq("is_published", true)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`);

  if (options?.category) {
    q = q.eq("category.slug", options.category);
  }
  if (typeof options?.minPrice === "number") {
    q = q.gte("price", options.minPrice);
  }
  if (typeof options?.maxPrice === "number") {
    q = q.lte("price", options.maxPrice);
  }
  if (options?.available === true) {
    q = q.eq("is_available", true);
  }

  const sortCol = options?.sort ?? "created_at";
  const ascending = options?.order === "asc";
  q = q.order(sortCol, { ascending }).range(options?.offset ?? 0, (options?.offset ?? 0) + (options?.limit ?? 50) - 1);

  const { data, error, count } = await q;

  if (error) {
    console.error("searchProducts error:", error);
    return { products: [], count: 0 };
  }

  return { products: (data as Product[]) ?? [], count: count ?? 0 };
}

export async function getRelatedProducts(productId: string, categoryId: string | null, limit = 5): Promise<Product[]> {
  const db = await createInsForgeServerClient();
  let q = db.database
    .from("products")
    .select("*, category:categories!products_category_id_fkey(id, slug, name), images:product_images(*), variants:product_variants(*)")
    .eq("is_published", true)
    .neq("id", productId)
    .limit(limit)
    .order("rating", { ascending: false });

  if (categoryId) {
    q = q.eq("category_id", categoryId);
  }

  const { data, error } = await q;
  if (error) return [];
  return (data as Product[]) ?? [];
}

export async function getRecipes(): Promise<Recipe[]> {
  const db = await createInsForgeServerClient();
  const { data, error } = await db.database
    .from("recipes")
    .select("*, recipe_ingredients(*)")
    .eq("status", "PUBLISHED")
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data as Recipe[]) ?? [];
}

export async function getRecipeBySlug(slug: string): Promise<Recipe | null> {
  const db = await createInsForgeServerClient();
  const { data, error } = await db.database
    .from("recipes")
    .select("*, recipe_ingredients(*)")
    .eq("slug", slug)
    .eq("status", "PUBLISHED")
    .maybeSingle();

  if (error || !data) return null;
  return data as Recipe;
}

export async function getProductByHandle(handle: string) {
  return getProductBySlug(handle);
}

export async function getMenu() {
  return getCategories();
}

export async function getCollection(handle: string) {
  return getProductsByCategorySlug(handle);
}

export async function getCollectionProducts(args: { collection: string; reverse?: boolean; sortKey?: string }) {
  const products = await getProductsByCategorySlug(args.collection);
  return products.products;
}