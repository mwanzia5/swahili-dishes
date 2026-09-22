"use client";

import { useState, useTransition } from "react";
import { useCart } from "components/cart/cart-context";
import { addItem } from "components/cart/actions";

const categories = ["All dishes", "Starters", "Mains", "Grills", "Sides & salads", "Desserts", "Drinks"];

const categoryMap: Record<string, string> = {
  "All dishes": "all",
  "Starters": "starters",
  "Mains": "mains",
  "Grills": "grills",
  "Sides & salads": "sides",
  "Desserts": "desserts",
  "Drinks": "drinks",
};

const dishes = [
  { name: "Sambusa za Nyama", desc: "Crisp pastry, spiced minced beef, tamarind dip.", price: "KSh 350", priceNum: 350, img: "/images/dishes/sambusa.webp", cat: "starters", tag: "" },
  { name: "Bhajia", desc: "Turmeric potato fritters, coriander chutney.", price: "KSh 300", priceNum: 300, img: "/images/dishes/bhajia.webp", cat: "starters", tag: "" },
  { name: "Mkate wa Mayai", desc: "Zanzibar-style egg bread, sweet chilli sauce.", price: "KSh 280", priceNum: 280, img: "/images/dishes/mkate-wa-mayai.webp", cat: "starters", tag: "" },
  { name: "Mchuzi wa Pweza (small)", desc: "Baby octopus in coconut and chilli broth.", price: "KSh 420", priceNum: 420, img: "/images/dishes/octopus.webp", cat: "starters", tag: "" },
  { name: "Zanzibar Pilau", desc: "Basmati, clove, cardamom, slow-braised beef.", price: "KSh 850", priceNum: 850, img: "/images/dishes/pilau.webp", cat: "mains", tag: "Best seller" },
  { name: "Mchuzi wa Samaki", desc: "Reef fish in coconut curry, tamarind and curry leaf.", price: "KSh 950", priceNum: 950, img: "/images/dishes/samaki-wa-kupaka.webp", cat: "mains", tag: "" },
  { name: "Wali wa Nazi", desc: "Coconut rice, lentil stew, fried plantain.", price: "KSh 700", priceNum: 700, img: "/images/dishes/wali-wa-nazi.webp", cat: "mains", tag: "" },
  { name: "Biryani ya Nyama", desc: "Layered rice, saffron, slow-cooked beef, crisp onions.", price: "KSh 900", priceNum: 900, img: "/images/dishes/biryani.webp", cat: "mains", tag: "" },
  { name: "Mchuzi wa Pweza", desc: "Whole octopus, coconut milk, tomato and chilli.", price: "KSh 980", priceNum: 980, img: "/images/dishes/octopus.webp", cat: "mains", tag: "New" },
  { name: "Nyama Choma", desc: "Charcoal-grilled goat, kachumbari, ugali on the side.", price: "KSh 1,100", priceNum: 1100, img: "/images/dishes/nyama-choma.webp", cat: "grills", tag: "Best seller" },
  { name: "Mishkaki ya Prawns", desc: "Char-grilled prawn skewers, garlic-lime butter.", price: "KSh 1,250", priceNum: 1250, img: "/images/dishes/mishkaki-prawns.webp", cat: "grills", tag: "" },
  { name: "Mishkaki ya Kuku", desc: "Marinated chicken skewers, coconut chilli glaze.", price: "KSh 980", priceNum: 980, img: "/images/dishes/mishkaki-kuku.webp", cat: "grills", tag: "" },
  { name: "Samaki wa Kuchoma", desc: "Whole grilled reef fish, lime and pili pili.", price: "KSh 1,400", priceNum: 1400, img: "/images/dishes/samaki-wa-kuchoma.webp", cat: "grills", tag: "" },
  { name: "Kachumbari", desc: "Tomato, red onion, chilli and coriander salad.", price: "KSh 220", priceNum: 220, img: "/images/dishes/kachumbari.webp", cat: "sides", tag: "" },
  { name: "Ugali na Sukuma", desc: "Maize meal with braised collard greens.", price: "KSh 250", priceNum: 250, img: "/images/dishes/ugali.webp", cat: "sides", tag: "" },
  { name: "Chapati (2 pcs)", desc: "Layered flatbread, made fresh to order.", price: "KSh 150", priceNum: 150, img: "/images/dishes/chapati.webp", cat: "sides", tag: "" },
  { name: "Mandazi", desc: "Coconut milk doughnuts, cardamom sugar.", price: "KSh 260", priceNum: 260, img: "/images/dishes/mandazi.webp", cat: "desserts", tag: "" },
  { name: "Vitumbua", desc: "Fermented rice and coconut cakes, cardamom.", price: "KSh 240", priceNum: 240, img: "/images/dishes/vitumbua.webp", cat: "desserts", tag: "" },
  { name: "Ukwaju Juice", desc: "Chilled tamarind, ginger and brown sugar.", price: "KSh 250", priceNum: 250, img: "/images/dishes/ukwaju.webp", cat: "drinks", tag: "" },
  { name: "Chai ya Tangawizi", desc: "Ginger and cardamom spiced milk tea.", price: "KSh 180", priceNum: 180, img: "/images/dishes/chai.webp", cat: "drinks", tag: "" },
  { name: "Madafu", desc: "Chilled young coconut, served whole.", price: "KSh 200", priceNum: 200, img: "/images/dishes/madafu.webp", cat: "drinks", tag: "" },
];

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [addedName, setAddedName] = useState<string | null>(null);
  const { addCartItem } = useCart();

  const filtered = dishes.filter((d) => {
    const matchCat = activeCategory === "all" || d.cat === activeCategory;
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const [isPending, startTransition] = useTransition();

  const handleAddToCart = (dish: (typeof dishes)[number], qty: number) => {
    // Optimistic UI update
    addCartItem({
      id: `menu-${Date.now()}-${dish.name.replace(/\s+/g, "-").toLowerCase()}`,
      cart_id: "",
      product_id: `menu-${dish.name.replace(/\s+/g, "-").toLowerCase()}`,
      variant_id: null,
      quantity: qty,
      unit_price: String(dish.priceNum),
      extras: [],
      notes: null,
      created_at: new Date().toISOString(),
    });

    // Fire server action (non-blocking) to persist to DB
    startTransition(() => {
      addItem(null, {
        productId: `menu-${dish.name.replace(/\s+/g, "-").toLowerCase()}`,
        variantId: null,
        quantity: qty,
        unitPrice: String(dish.priceNum),
      }).catch(() => {});
    });

    setAddedName(dish.name);
    setTimeout(() => setAddedName(null), 1500);
  };

  return (
    <div>
      {/* Page header */}
      <section
        className="py-12 sm:py-16"
        style={{ borderBottom: "1px solid var(--color-indigo-line)", background: "radial-gradient(ellipse at 80% 0%, rgba(226,161,58,.10), transparent 55%)" }}
      >
        <div className="mx-auto max-w-[1180px] px-4 sm:px-8">
          <p className="mb-[14px] text-[0.82rem] text-cream-300">
            <a href="/" className="text-gold-400">Home</a> / <span>Menu</span>
          </p>
          <h1 className="mb-[10px] text-[clamp(1.8rem,4.2vw,3.8rem)] font-medium text-cream-050" style={{ fontFamily: "var(--font-display)" }}>
            The full menu
          </h1>
          <p className="mx-auto max-w-xl text-cream-300">
            Thirty-six coastal recipes, cooked to order. Filter by course, or search for something specific.
          </p>
        </div>
      </section>

      {/* Menu content */}
      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-[1180px] px-4 sm:px-8">
          {/* Search box (mobile) */}
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

          {/* Toolbar */}
          <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            {/* Category pills */}
            <div className="flex flex-wrap gap-2 sm:gap-3" style={{ marginBottom: 0 }}>
              {categories.map((cat) => {
                const val = categoryMap[cat] ?? "all";
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(val)}
                    className={`cat-pill text-xs sm:text-[0.86rem] ${activeCategory === val ? "active" : ""}`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Search box (desktop) */}
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

          {/* Dish grid */}
          <div className="dish-grid">
            {filtered.map((dish) => (
              <DishCard key={dish.name} dish={dish} onAdd={handleAddToCart} addedName={addedName} />
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
  dish,
  onAdd,
  addedName,
}: {
  dish: (typeof dishes)[number];
  onAdd: (dish: (typeof dishes)[number], qty: number) => void;
  addedName: string | null;
}) {
  const [qty, setQty] = useState(1);
  const justAdded = addedName === dish.name;

  return (
    <article className="dish-card">
      <div className="dish-media">
        <img src={dish.img} alt={dish.name} />
        <span className="dish-price">{dish.price}</span>
        {dish.tag && <span className="dish-tag">{dish.tag}</span>}
      </div>
      <div className="dish-body">
        <h3 style={{ fontFamily: "var(--font-display)" }}>{dish.name}</h3>
        <p>{dish.desc}</p>
        <div className="dish-foot">
          <div className="qty-box">
            <button onClick={() => setQty(Math.max(1, qty - 1))}>–</button>
            <span>{qty}</span>
            <button onClick={() => setQty(qty + 1)}>+</button>
          </div>
          <button
            className="add-btn"
            aria-label={`Add ${dish.name} to cart`}
            onClick={() => onAdd(dish, qty)}
            style={justAdded ? { background: "var(--color-gold-500)", transform: "scale(1.1)" } : undefined}
          >
            {justAdded ? "✓" : "+"}
          </button>
        </div>
      </div>
    </article>
  );
}
