"use client";

import { useState, useTransition } from "react";
import { gsap } from "gsap";
import Link from "next/link";
import { useCart } from "components/cart/cart-context";
import { addItem } from "components/cart/actions";

const categories = ["All", "Mains", "Grills", "Starters", "Drinks"];

const menuItems = [
  {
    id: 1,
    name: "Zanzibar Pilau",
    description: "Basmati, clove, cardamom, slow-braised beef.",
    price: 850,
    image: "/images/dishes/pilau.webp",
    category: "Mains",
    tag: "",
  },
  {
    id: 2,
    name: "Nyama Choma",
    description: "Charcoal-grilled goat, kachumbari, ugali on the side.",
    price: 1100,
    image: "/images/dishes/nyama-choma.webp",
    category: "Grills",
    tag: "Best seller",
  },
  {
    id: 3,
    name: "Mchuzi wa Samaki",
    description: "Reef fish in coconut curry, tamarind and curry leaf.",
    price: 950,
    image: "/images/dishes/samaki-wa-kupaka.webp",
    category: "Mains",
    tag: "",
  },
  {
    id: 4,
    name: "Sambusa za Nyama",
    description: "Crisp pastry, spiced beef, tamarind dip.",
    price: 350,
    image: "/images/dishes/sambusa.webp",
    category: "Starters",
    tag: "",
  },
  {
    id: 5,
    name: "Wali wa Nazi",
    description: "Coconut rice, lentil stew, fried plantain.",
    price: 700,
    image: "/images/dishes/wali-wa-nazi.webp",
    category: "Mains",
    tag: "",
  },
  {
    id: 6,
    name: "Bhajia",
    description: "Turmeric potato fritters, coriander chutney.",
    price: 300,
    image: "/images/dishes/bhajia.webp",
    category: "Starters",
    tag: "",
  },
  {
    id: 7,
    name: "Mishkaki ya Prawns",
    description: "Char-grilled prawn skewers, garlic-lime butter.",
    price: 1250,
    image: "/images/dishes/mishkaki-prawns.webp",
    category: "Grills",
    tag: "New",
  },
  {
    id: 8,
    name: "Ukwaju Juice",
    description: "Chilled tamarind, ginger and brown sugar.",
    price: 250,
    image: "/images/dishes/ukwaju.webp",
    category: "Drinks",
    tag: "",
  },
];

function QuantityBox({ qty, setQty }: { qty: number; setQty: (n: number) => void }) {
  return (
    <div className="qty-box">
      <button aria-label="Decrease" onClick={() => setQty(Math.max(1, qty - 1))}>–</button>
      <span>{qty}</span>
      <button aria-label="Increase" onClick={() => setQty(qty + 1)}>+</button>
    </div>
  );
}

export function MenuPreview() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [addedId, setAddedId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const { addCartItem } = useCart();

  const filteredItems = activeCategory === "All"
    ? menuItems
    : menuItems.filter((item) => item.category === activeCategory);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    gsap.fromTo(
      ".menu-dish-card",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: "power3.out" }
    );
  };

  const handleAddToCart = (item: (typeof menuItems)[number]) => {
    const qty = quantities[item.id] ?? 1;
    addCartItem({
      id: `preview-${item.id}-${Date.now()}`,
      cart_id: "",
      product_id: `menu-${item.name.replace(/\s+/g, "-").toLowerCase()}`,
      variant_id: null,
      quantity: qty,
      unit_price: String(item.price),
      extras: [],
      notes: null,
      created_at: new Date().toISOString(),
    });
    // Fire server action to persist to DB
    startTransition(() => {
      addItem(null, {
        productId: `menu-${item.name.replace(/\s+/g, "-").toLowerCase()}`,
        variantId: undefined,
        quantity: qty,
        unitPrice: String(item.price),
      }).catch(() => {});
    });
    setAddedId(item.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <section className="py-16 sm:py-24" style={{ background: "var(--color-indigo-900)" }} id="menu">
      <div className="mx-auto max-w-[1180px] px-4 sm:px-8">
        {/* Section header */}
        <div className="mb-8 sm:mb-12 flex flex-col gap-4 sm:flex-wrap sm:items-end sm:justify-between sm:gap-6">
          <div>
            <span className="mb-2 block text-[0.82rem] font-semibold text-gold-400">From the kitchen</span>
            <h2 className="mb-2 text-[clamp(1.5rem,3vw,2.6rem)]" style={{ fontFamily: "var(--font-display)" }}>A taste of the menu</h2>
          </div>
          <p className="text-cream-300">Eight coastal favourites, made fresh to order — from Zanzibar to Lamu.</p>
        </div>

        {/* Category pills */}
        <div className="category-rail mb-8 sm:mb-[44px]" data-reveal="fade-up">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`cat-pill text-xs sm:text-[0.86rem] ${activeCategory === category ? "active" : ""}`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Dish grid */}
        <div className="dish-grid" data-reveal-group>
          {filteredItems.map((item) => (
            <article
              key={item.id}
              className="menu-dish-card dish-card"
              data-reveal-item
            >
              <div className="dish-media">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover transition-transform duration-500"
                />
                <span className="dish-price">KSh {item.price.toLocaleString()}</span>
                {item.tag && <span className="dish-tag">{item.tag}</span>}
              </div>
              <div className="dish-body">
                <h3 className="text-[1.08rem] font-semibold text-cream-050" style={{ fontFamily: "var(--font-display)" }}>{item.name}</h3>
                <p className="mb-[14px] text-[0.86rem] text-cream-300">{item.description}</p>
                <div className="dish-foot">
                  <QuantityBox
                    qty={quantities[item.id] ?? 1}
                    setQty={(n) => setQuantities((prev) => ({ ...prev, [item.id]: n }))}
                  />
                  <button
                    className="add-btn"
                    aria-label={`Add ${item.name} to cart`}
                    onClick={() => handleAddToCart(item)}
                    style={addedId === item.id ? { background: "var(--color-gold-500)", transform: "scale(1.1)" } : undefined}
                  >
                    {addedId === item.id ? "✓" : "+"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* View all */}
        <div className="mt-8 sm:mt-[44px] text-center" data-reveal="fade-up">
          <Link href="/menu" className="btn btn-outline">
            See the full menu
          </Link>
        </div>
      </div>
    </section>
  );
}
