"use client";

import { useState, useTransition } from "react";
import { useCart } from "components/cart/cart-context";
import { addItem } from "components/cart/actions";
import type { Product, ProductVariant } from "lib/insforge/types";

const categoryOrder = ["starters", "mains", "grills", "sides", "desserts", "drinks"];

const categoryLabels: Record<string, string> = {
  starters: "Starters",
  mains: "Mains",
  grills: "Grills",
  sides: "Sides & salads",
  desserts: "Desserts",
  drinks: "Drinks",
};

const allCategories = ["all", ...categoryOrder];

interface MenuClientProps {
  initialProducts: Product[];
}

export function MenuClient({ initialProducts }: MenuClientProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [addedName, setAddedName] = useState<string | null>(null);
  const { addCartItem } = useCart();

  const filtered = initialProducts.filter((p) => {
    const matchCat = activeCategory === "all" || p.category?.slug === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const [isPending, startTransition] = useTransition();

  const getDefaultVariant = (product: Product): ProductVariant | null => {
    if (!product.variants?.length) return null;
    return product.variants.find((v) => v.is_active && v.type === "PORTION") ?? product.variants[0] ?? null;
  };

  const handleAddToCart = (product: Product, qty: number) => {
    const variant = getDefaultVariant(product);
    const price = variant?.price ?? product.price;

    addCartItem({
      id: `menu-${Date.now()}-${product.id}`,
      cart_id: "",
      product_id: product.id,
      variant_id: variant?.id ?? null,
      quantity: qty,
      unit_price: String(price),
      extras: [],
      notes: null,
      created_at: new Date().toISOString(),
    });

    startTransition(() => {
      addItem(null, {
        productId: product.id,
        variantId: variant?.id,
        quantity: qty,
        unitPrice: String(price),
      }).catch(() => {});
    });

    setAddedName(product.name);
    setTimeout(() => setAddedName(null), 1500);
  };

  return (
    <div>
      <section
        className="py-12 sm:py-16"
        style={{
          borderBottom: "1px solid var(--color-indigo-line)",
          background: "radial-gradient(ellipse at 80% 0%, rgba(226,161,58,.10), transparent 55%)",
        }}
      >
        <div className="mx-auto max-w-[1180px] px-4 sm:px-8">
          <p className="mb-[14px] text-[0.82rem] text-cream-300">
            <a href="/" className="text-gold-400">Home</a> / <span>Menu</span>
          </p>
          <h1 className="mb-[10px] text-[clamp(1.8rem,4.2vw,3.8rem)] font-medium text-cream-050" style={{ fontFamily: "var(--font-display)" }}>
            The full menu
          </h1>
          <p className="mx-auto max-w-xl text-cream-300">
            Coastal recipes, cooked to order. Filter by course, or search for something specific.
          </p>
        </div>
      </section>

      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-[1180px] px-4 sm:px-8">
          <div className="mb-6 sm:hidden">
            <div className="search-box w-full">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Search dishes…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2 sm:gap-3" style={{ marginBottom: 0 }}>
              {allCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`cat-pill text-xs sm:text-[0.86rem] ${activeCategory === cat ? "active" : ""}`}
                >
                  {cat === "all" ? "All dishes" : categoryLabels[cat] ?? cat}
                </button>
              ))}
            </div>

            <div className="hidden sm:flex search-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Search dishes…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="dish-grid">
            {filtered.map((product) => (
              <DishCard key={product.id} product={product} onAdd={handleAddToCart} addedName={addedName} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="py-16 text-center text-cream-300">
              No dishes found. Try a different search or category.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function DishCard({
  product,
  onAdd,
  addedName,
}: {
  product: Product;
  onAdd: (product: Product, qty: number) => void;
  addedName: string | null;
}) {
  const [qty, setQty] = useState(1);
  const justAdded = addedName === product.name;

  const variant = product.variants?.find((v) => v.is_active && v.type === "PORTION") ?? product.variants?.[0];
  const price = variant?.price ?? product.price;
  const numericPrice = typeof price === "string" ? parseFloat(price) : price;
  const formattedPrice = `KSh ${numericPrice.toLocaleString()}`;

  return (
    <article className="dish-card">
      <div className="dish-media">
        {product.images?.[0]?.url ? (
          <img src={product.images[0].url} alt={product.name} />
        ) : (
          <div className="dish-placeholder" />
        )}
        <span className="dish-price">{formattedPrice}</span>
        {product.is_popular && <span className="dish-tag">Popular</span>}
        {product.is_featured && !product.is_popular && <span className="dish-tag">Featured</span>}
      </div>
      <div className="dish-body">
        <h3 style={{ fontFamily: "var(--font-display)" }}>{product.name}</h3>
        <p>{product.description}</p>
        <div className="dish-foot">
          <div className="qty-box">
            <button onClick={() => setQty(Math.max(1, qty - 1))}>–</button>
            <span>{qty}</span>
            <button onClick={() => setQty(qty + 1)}>+</button>
          </div>
          <button
            className="add-btn"
            aria-label={`Add ${product.name} to cart`}
            onClick={() => onAdd(product, qty)}
            style={justAdded ? { background: "var(--color-gold-500)", transform: "scale(1.1)" } : undefined}
          >
            {justAdded ? "✓" : "+"}
          </button>
        </div>
      </div>
    </article>
  );
}