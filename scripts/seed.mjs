/**
 * Seed script — run with: node scripts/seed.mjs
 *
 * Seeds categories, products, product images, variants, and recipes
 * into the InsForge database via the PostgREST API directly.
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local manually
const envPath = resolve(import.meta.dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim();
  env[key] = val;
  if (!process.env[key]) process.env[key] = val;
}

const BASE = process.env.INSFORGE_URL;
const KEY = process.env.INSFORGE_API_KEY;

if (!BASE || !KEY) {
  console.error("INSFORGE_URL and INSFORGE_API_KEY must be set in .env.local");
  process.exit(1);
}

const baseHeaders = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

async function upsert(table, rows, onConflict) {
  const url = `${BASE}/api/database/records/${table}`;
  const params = onConflict ? `?on_conflict=${onConflict}` : "";
  const res = await fetch(`${url}${params}`, {
    method: "POST",
    headers: {
      ...baseHeaders,
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(rows),
  });
  const data = await res.json();
  if (!res.ok && res.status !== 409) {
    console.error(`  ✗ ${table} upsert failed:`, res.status, data);
    return null;
  }
  // On 409 conflict, fall back to per-row update-by-match
  if (res.status === 409) {
    const updated = [];
    for (const row of rows) {
      const keyValue = row[onConflict];
      const patchRes = await fetch(
        `${url}?${onConflict}=eq.${encodeURIComponent(keyValue)}`,
        {
          method: "PATCH",
          headers: baseHeaders,
          body: JSON.stringify(row),
        },
      );
      const patched = await patchRes.json();
      if (patchRes.ok) updated.push(Array.isArray(patched) ? patched[0] : patched);
    }
    return updated;
  }
  return data;
}

async function del(table, filter) {
  const url = `${BASE}/api/database/records/${table}?${filter}`;
  const res = await fetch(url, { method: "DELETE", headers: baseHeaders });
  if (!res.ok) {
    const data = await res.json();
    console.error(`  ✗ ${table} delete failed:`, res.status, data);
  }
}

// ─────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────

const categories = [
  { slug: "pilau", name: "Pilau", description: "Aromatic spiced rice dishes", sort_order: 1, is_active: true },
  { slug: "biryani", name: "Biryani", description: "Layered rice with meat and spices", sort_order: 2, is_active: true },
  { slug: "chapati", name: "Chapati", description: "Soft layered flatbreads", sort_order: 3, is_active: true },
  { slug: "viazi", name: "Viazi", description: "Potato-based dishes", sort_order: 4, is_active: true },
  { slug: "samaki", name: "Samaki", description: "Fresh fish and seafood", sort_order: 5, is_active: true },
  { slug: "chicken", name: "Chicken", description: "Chicken preparations", sort_order: 6, is_active: true },
  { slug: "beef", name: "Beef", description: "Beef and goat meat dishes", sort_order: 7, is_active: true },
  { slug: "vegetarian", name: "Vegetarian", description: "Plant-based dishes", sort_order: 8, is_active: true },
  { slug: "breakfast", name: "Breakfast", description: "Morning meals and snacks", sort_order: 9, is_active: true },
  { slug: "drinks", name: "Drinks", description: "Beverages and juices", sort_order: 10, is_active: true },
  { slug: "desserts", name: "Desserts", description: "Sweet treats", sort_order: 11, is_active: true },
];

const products = [
  { slug: "pilau-mboga", name: "Pilau Mboga", description: "Classic Kenyan pilau rice cooked with aromatic spices — cumin, cardamom, cinnamon, and cloves — with mixed vegetables.", price: "450", cat: "pilau", featured: true, popular: true, spice: "MEDIUM", prep: 45, servings: 2, rating: "4.8", ratingCount: 234, img: "/pilau.webp", variants: [{ title: "Regular", price: "450" }, { title: "Large", price: "700" }] },
  { slug: "pilau-mchuzi", name: "Pilau Mchuzi wa Nyama", description: "Pilau rice served with rich beef curry. The beef is slow-cooked in a tomato-based sauce with onions, garlic, ginger, and traditional spices.", price: "650", cat: "pilau", featured: true, popular: true, spice: "HOT", prep: 60, servings: 2, rating: "4.9", ratingCount: 189, img: "/pilau.webp", variants: [{ title: "Regular", price: "650" }, { title: "Large", price: "950" }] },
  { slug: "biryani-kuku", name: "Biryani ya Kuku", description: "Coastal-style chicken biryani — marinated chicken layered with saffron-infused basmati rice, fried onions, and fresh herbs.", price: "750", cat: "biryani", featured: true, popular: true, spice: "MEDIUM", prep: 90, servings: 2, rating: "4.9", ratingCount: 312, img: "/biryani.webp", variants: [{ title: "Regular", price: "750" }, { title: "Large", price: "1100" }, { title: "Family", price: "1800" }] },
  { slug: "biryani-nyama", name: "Biryani ya Nyama", description: "Beef biryani with tender chunks of beef marinated in yogurt and spices, layered with aromatic rice. A Mombasa specialty.", price: "800", cat: "biryani", featured: false, popular: true, spice: "HOT", prep: 90, servings: 2, rating: "4.7", ratingCount: 156, img: "/biryani.webp", variants: [{ title: "Regular", price: "800" }, { title: "Large", price: "1200" }] },
  { slug: "zurbian", name: "Zurbian", description: "Yemeni-style spiced rice with tender lamb, caramelized onions, and a blend of whole spices.", price: "750", cat: "biryani", featured: false, popular: false, spice: "MEDIUM", prep: 90, servings: 2, rating: "4.6", ratingCount: 78, img: "/zurbian.webp", variants: [{ title: "Regular", price: "750" }, { title: "Large", price: "1100" }] },
  { slug: "chapati", name: "Chapati", description: "Soft, flaky layered flatbread made from wheat flour, ghee, and a touch of sugar. Hand-rolled and cooked on a hot griddle until golden.", price: "150", cat: "chapati", featured: true, popular: true, spice: "MILD", prep: 20, servings: 1, rating: "4.8", ratingCount: 445, img: "/pancake.webp", variants: [{ title: "Single", price: "150" }, { title: "3 Pieces", price: "400" }] },
  { slug: "viazi-karai", name: "Viazi Karai", description: "Deep-fried potato cubes seasoned with turmeric, cumin, and chili. A beloved Kenyan street food.", price: "200", cat: "viazi", featured: false, popular: true, spice: "MEDIUM", prep: 25, servings: 1, rating: "4.6", ratingCount: 198, img: "/bhajia.webp", variants: [{ title: "Regular", price: "200" }, { title: "Large", price: "350" }] },
  { slug: "samaki-kupaka", name: "Samaki wa Kupaka", description: "Grilled fish fillet marinated in coconut cream, lime, and Swahili spice paste. A coastal delicacy.", price: "850", cat: "samaki", featured: true, popular: false, spice: "MEDIUM", prep: 35, servings: 1, rating: "4.9", ratingCount: 87, img: "/samaki wa kupaka.webp", variants: [{ title: "Whole Fillet", price: "850" }, { title: "Half Fillet", price: "500" }] },
  { slug: "seafood-platter", name: "Seafood Platter", description: "A generous mix of grilled prawns, calamari, and fish fillet with coastal spices. Served with pilau rice.", price: "1200", cat: "samaki", featured: true, popular: false, spice: "MEDIUM", prep: 40, servings: 2, rating: "4.8", ratingCount: 64, img: "/seafood.webp", variants: [{ title: "Regular", price: "1200" }] },
  { slug: "kuku-nazi", name: "Kuku wa Nazi", description: "Chicken simmered in rich coconut milk with tomatoes, onions, and a blend of coastal spices.", price: "650", cat: "chicken", featured: true, popular: true, spice: "MEDIUM", prep: 50, servings: 2, rating: "4.8", ratingCount: 267, img: "/shawarma.webp", variants: [{ title: "Regular", price: "650" }, { title: "Large", price: "950" }] },
  { slug: "nyama-choma", name: "Nyama Choma", description: "Charcoal-grilled beef or goat meat, seasoned simply with salt and served with kachumbari and ugali.", price: "700", cat: "beef", featured: true, popular: true, spice: "MILD", prep: 40, servings: 1, rating: "4.7", ratingCount: 321, img: "/shawarma.webp", variants: [{ title: "Beef", price: "700" }, { title: "Goat", price: "850" }] },
  { slug: "mchuzi-nyama", name: "Mchuzi wa Nyama", description: "Slow-cooked beef stew in a rich tomato and onion gravy with potatoes and carrots.", price: "600", cat: "beef", featured: false, popular: true, spice: "MEDIUM", prep: 90, servings: 2, rating: "4.6", ratingCount: 178, img: "/pilau.webp", variants: [{ title: "Regular", price: "600" }, { title: "Large", price: "900" }] },
  { slug: "mahamri", name: "Mahamri", description: "Sweet, fluffy triangular donuts spiced with cardamom and coated in sugar. Best enjoyed with chai.", price: "100", cat: "breakfast", featured: false, popular: true, spice: "MILD", prep: 30, servings: 1, rating: "4.7", ratingCount: 256, img: "/mahamri.webp", variants: [{ title: "3 Pieces", price: "100" }, { title: "6 Pieces", price: "180" }] },
  { slug: "mandazi", name: "Mandazi", description: "East African doughnuts — lightly sweet, cardamom-scented, and deep-fried to golden perfection.", price: "80", cat: "breakfast", featured: false, popular: true, spice: "MILD", prep: 25, servings: 1, rating: "4.5", ratingCount: 389, img: "/mahamri.webp", variants: [{ title: "3 Pieces", price: "80" }, { title: "6 Pieces", price: "150" }] },
  { slug: "chai-tangawizi", name: "Chai Tangawizi", description: "Kenyan spiced ginger tea — black tea simmered with fresh ginger, cloves, and cinnamon.", price: "80", cat: "drinks", featured: false, popular: true, spice: "MILD", prep: 10, servings: 1, rating: "4.8", ratingCount: 412, img: "/pancake.webp", variants: [{ title: "Cup", price: "80" }, { title: "Mug", price: "120" }] },
  { slug: "dawa", name: "Dawa", description: "Kenya's iconic honey-lime-ginger drink. Fresh lime juice, honey, ginger, and crushed ice.", price: "150", cat: "drinks", featured: true, popular: false, spice: "MILD", prep: 5, servings: 1, rating: "4.6", ratingCount: 167, img: "/pancake.webp", variants: [{ title: "Regular", price: "150" }] },
  { slug: "halwa", name: "Halwa ya Tangawizi", description: "Coastal ginger halwa — a dense, fudge-like sweet made from ghee, sugar, ginger, and cardamom.", price: "200", cat: "desserts", featured: false, popular: false, spice: "MILD", prep: 40, servings: 4, rating: "4.7", ratingCount: 89, img: "/kaimati.webp", variants: [{ title: "Small Box", price: "200" }, { title: "Large Box", price: "400" }] },
  { slug: "kaimati", name: "Kaimati", description: "Deep-fried dough balls soaked in sugar syrup — a traditional Swahili sweet.", price: "150", cat: "desserts", featured: false, popular: false, spice: "MILD", prep: 30, servings: 4, rating: "4.5", ratingCount: 67, img: "/kaimati.webp", variants: [{ title: "6 Pieces", price: "150" }, { title: "12 Pieces", price: "280" }] },
];

const recipes = [
  { slug: "perfect-pilau", title: "Perfect Kenyan Pilau", desc: "Master the art of making authentic Kenyan pilau with this step-by-step guide.", cuisine: "Kenyan", difficulty: "MEDIUM", prep: 15, cook: 30, total: 45, servings: 4, img: "/pilau.webp", tags: ["rice", "pilau", "main-course"], ingredients: [{ n: "Basmati rice", q: "2", u: "cups" }, { n: "Beef or chicken", q: "500", u: "g" }, { n: "Onions", q: "2", u: "large" }, { n: "Tomatoes", q: "3", u: "medium" }, { n: "Garlic", q: "4", u: "cloves" }, { n: "Ginger", q: "1", u: "inch" }, { n: "Pilau masala", q: "2", u: "tbsp" }, { n: "Cumin seeds", q: "1", u: "tsp" }, { n: "Cardamom pods", q: "4", u: "pcs" }, { n: "Cinnamon stick", q: "1", u: "piece" }, { n: "Oil", q: "3", u: "tbsp" }, { n: "Salt", q: "1", u: "tsp" }, { n: "Water", q: "3", u: "cups" }], instructions: ["Wash rice and soak in warm water for 20 minutes. Drain.", "Heat oil in a pot. Add cumin seeds, cardamom, and cinnamon. Stir for 30 seconds.", "Add sliced onions and cook until golden brown (8-10 minutes).", "Add minced garlic and ginger. Cook for 1 minute.", "Add cubed meat. Brown on all sides for 5 minutes.", "Add diced tomatoes and pilau masala. Cook until tomatoes break down (5 minutes).", "Add drained rice and stir gently to coat with the spice mixture.", "Add water and salt. Bring to a boil.", "Cover tightly, reduce heat to lowest setting, and cook for 20 minutes.", "Fluff with a fork and serve hot with kachumbari."] },
  { slug: "coconut-chicken", title: "Kuku wa Nazi (Coconut Chicken)", desc: "Creamy coastal coconut chicken curry — a Mombasa classic.", cuisine: "Coastal Kenyan", difficulty: "EASY", prep: 15, cook: 40, total: 55, servings: 4, img: "/shawarma.webp", tags: ["chicken", "coconut", "curry"], ingredients: [{ n: "Chicken pieces", q: "1", u: "kg" }, { n: "Coconut milk", q: "400", u: "ml" }, { n: "Onions", q: "2", u: "large" }, { n: "Tomatoes", q: "3", u: "medium" }, { n: "Garlic", q: "4", u: "cloves" }, { n: "Ginger", q: "1", u: "inch" }, { n: "Curry powder", q: "1", u: "tbsp" }, { n: "Turmeric", q: "1", u: "tsp" }, { n: "Chili flakes", q: "1", u: "tsp" }, { n: "Oil", q: "3", u: "tbsp" }, { n: "Salt", q: "1", u: "tsp" }, { n: "Fresh coriander", q: "2", u: "tbsp" }], instructions: ["Marinate chicken with turmeric, curry powder, and salt for 30 minutes.", "Heat oil in a heavy pot. Brown chicken pieces on all sides. Set aside.", "In the same pot, sauté onions until soft and translucent.", "Add garlic, ginger, and chili. Cook for 1 minute.", "Add diced tomatoes. Cook until soft (5 minutes).", "Return chicken to the pot. Pour in coconut milk.", "Simmer on medium heat for 25-30 minutes until chicken is cooked through.", "Garnish with fresh coriander and serve with rice or chapati."] },
  { slug: "fluffy-chapati", title: "Flaky Kenyan Chapati", desc: "Soft, layered chapati — the secret is in the dough resting and the rolling technique.", cuisine: "Kenyan", difficulty: "MEDIUM", prep: 30, cook: 20, total: 60, servings: 6, img: "/pancake.webp", tags: ["bread", "chapati", "side"], ingredients: [{ n: "All-purpose flour", q: "3", u: "cups" }, { n: "Warm water", q: "1", u: "cup" }, { n: "Salt", q: "1", u: "tsp" }, { n: "Sugar", q: "1", u: "tsp" }, { n: "Vegetable oil", q: "4", u: "tbsp" }], instructions: ["Mix flour, salt, and sugar in a large bowl.", "Add warm water gradually and knead into a soft dough (8-10 minutes).", "Add oil and knead for another 5 minutes until smooth and elastic.", "Cover with a damp cloth and rest for 30 minutes.", "Divide into 6 equal balls.", "Roll each ball into a thin circle. Brush with oil and fold into a triangle.", "Roll out the triangles into thin chapatis.", "Cook on a hot dry pan until bubbles form, flip, brush with oil. Cook until golden spots appear.", "Stack and keep warm in a cloth-lined container."] },
];

// ─────────────────────────────────────────────────────────────
// Seed
// ─────────────────────────────────────────────────────────────

async function seed() {
  console.log("=== Seeding Swahili Dishes ===\n");

  // 1. Categories
  console.log("1/5 Categories...");
  const catRes = await upsert("categories", categories, "slug");
  if (!catRes) process.exit(1);
  const catRows = Array.isArray(catRes) ? catRes : [catRes];
  const catMap = new Map(catRows.map(c => [c.slug, c.id]));
  console.log(`   ✓ ${catRows.length} categories\n`);

  // 2. Products
  console.log("2/5 Products...");
  const prodRows = products.map(p => ({
    slug: p.slug,
    name: p.name,
    description: p.description,
    price: p.price,
    category_id: catMap.get(p.cat) ?? null,
    is_published: true,
    is_featured: p.featured,
    is_popular: p.popular,
    prep_time_minutes: p.prep,
    rating: p.rating,
    rating_count: p.ratingCount,
    is_available: true,
  }));
  const prodRes = await upsert("products", prodRows, "slug");
  if (!prodRes) process.exit(1);
  const prods = Array.isArray(prodRes) ? prodRes : [prodRes];
  const prodMap = new Map(prods.map(p => [p.slug, p.id]));
  console.log(`   ✓ ${prods.length} products\n`);

  // 3. Product images
  console.log("3/5 Product images...");
  // Clear existing images for these products
  const prodIds = [...prodMap.values()];
  await del("product_images", `product_id=in.(${prodIds.join(",")})`);

  const imgRows = products.flatMap(p => {
    const pid = prodMap.get(p.slug);
    return pid ? [{ product_id: pid, url: p.img, alt_text: p.name, sort_order: 0 }] : [];
  });
  if (imgRows.length) {
    const imgRes = await upsert("product_images", imgRows);
    if (imgRes) console.log(`   ✓ ${imgRows.length} images\n`);
  }

  // 4. Product variants
  console.log("4/5 Product variants...");
  await del("product_variants", `product_id=in.(${prodIds.join(",")})`);

  const varRows = products.flatMap(p => {
    const pid = prodMap.get(p.slug);
    return pid ? p.variants.map((v, i) => ({ product_id: pid, title: v.title, price: v.price, type: "PORTION", is_active: true, sort_order: i })) : [];
  });
  if (varRows.length) {
    const varRes = await upsert("product_variants", varRows);
    if (varRes) console.log(`   ✓ ${varRows.length} variants\n`);
  }

  // 5. Recipes
  console.log("5/5 Recipes...");
  for (const r of recipes) {
    const { ingredients, instructions, tags, ...base } = r;
    const recipeRow = {
      slug: base.slug,
      title: base.title,
      description: base.desc,
      hero_image_url: base.img,
      prep_time_minutes: base.prep,
      cook_time_minutes: base.cook,
      servings: base.servings,
      difficulty: base.difficulty.toUpperCase(),
      instructions,
      status: "PUBLISHED",
      source_url: null,
      source_name: null,
    };

    const res = await upsert("recipes", [recipeRow], "slug");
    if (!res) continue;
    const recipe = Array.isArray(res) ? res[0] : res;

    // Clear and re-insert ingredients
    await del("recipe_ingredients", `recipe_id=eq.${recipe.id}`);
    const ingRows = ingredients.map((ing, i) => ({
      recipe_id: recipe.id,
      name: ing.n,
      quantity: `${ing.q} ${ing.u}`.trim(),
      sort_order: i,
    }));
    await upsert("recipe_ingredients", ingRows);
    console.log(`   ✓ ${r.title} (${ingredients.length} ingredients)`);
  }

  console.log("\n=== Seed complete! ===");
}

seed().catch(err => { console.error("Seed failed:", err); process.exit(1); });