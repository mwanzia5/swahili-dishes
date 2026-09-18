"use client";

import { useRef, useState } from "react";

/* ── Recipe data ─────────────────────────────────────── */

const recipeMeta: Record<
  string,
  {
    time: string;
    image: string;
    ingredients: { name: string; qty: string }[];
    steps: { title: string; text: string }[];
  }
> = {
  "Zanzibar Pilau, step by step": {
    time: "1h 20m",
    image: "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80",
    ingredients: [
      { name: "Basmati rice", qty: "2 cups" },
      { name: "Beef, cubed", qty: "500 g" },
      { name: "Onions, thin-sliced", qty: "3 large" },
      { name: "Whole cloves", qty: "8" },
      { name: "Cinnamon stick", qty: "1" },
      { name: "Cardamom pods", qty: "6" },
      { name: "Garlic-ginger paste", qty: "2 tbsp" },
      { name: "Beef stock", qty: "3 cups" },
      { name: "Ghee or cooking oil", qty: "3 tbsp" },
    ],
    steps: [
      { title: "Caramelise the onions", text: "Fry the sliced onions in ghee over medium heat for 15–18 minutes, stirring often, until deep golden brown. Set half aside for garnish." },
      { title: "Bloom the whole spices", text: "Add cloves, cinnamon and cardamom to the remaining onions and oil. Fry for 60 seconds until fragrant." },
      { title: "Brown the beef", text: "Stir in the garlic-ginger paste, then add the beef. Sear on all sides for 6–8 minutes." },
      { title: "Braise", text: "Pour in the stock, cover, and simmer on low for 40 minutes until the beef is tender." },
      { title: "Add the rice", text: "Stir in washed basmati, season with salt, and bring back to a gentle simmer." },
      { title: "Steam and rest", text: "Cover tightly and cook on the lowest heat for 15 minutes, then rest off the heat for 10 minutes before fluffing." },
      { title: "Serve", text: "Top with the reserved fried onions and a side of kachumbari." },
    ],
  },
  "Crisp Turmeric Bhajia": {
    time: "25 min",
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80",
    ingredients: [
      { name: "Gram flour (besan)", qty: "1 cup" },
      { name: "Potatoes, sliced thin", qty: "3 medium" },
      { name: "Turmeric powder", qty: "1 tsp" },
      { name: "Green chilli, minced", qty: "1" },
      { name: "Fresh coriander, chopped", qty: "2 tbsp" },
      { name: "Salt", qty: "to taste" },
      { name: "Water", qty: "½ cup" },
      { name: "Oil for deep frying", qty: "enough to submerge" },
    ],
    steps: [
      { title: "Make the batter", text: "Whisk gram flour, turmeric, chilli, coriander, salt and water into a smooth, thick batter that coats a spoon." },
      { title: "Coat the potatoes", text: "Toss potato slices in the batter until each piece is evenly covered." },
      { title: "Fry", text: "Heat oil to 170 °C. Fry in batches for 3–4 minutes until golden and crisp. Drain on paper towels." },
      { title: "Serve", text: "Serve hot with coriander chutney or tamarind dip." },
    ],
  },
  "Coconut Fish Curry (Mchuzi wa Samaki)": {
    time: "40 min",
    image: "https://images.unsplash.com/photo-1626200926749-1f4c9b28c5eb?auto=format&fit=crop&w=800&q=80",
    ingredients: [
      { name: "Reef fish fillets", qty: "500 g" },
      { name: "Coconut milk", qty: "400 ml" },
      { name: "Onion, diced", qty: "1 large" },
      { name: "Tomatoes, chopped", qty: "2" },
      { name: "Tamarind paste", qty: "1 tbsp" },
      { name: "Curry leaves", qty: "8–10" },
      { name: "Garlic-ginger paste", qty: "1 tbsp" },
      { name: "Green chilli", qty: "1" },
      { name: "Oil", qty: "2 tbsp" },
    ],
    steps: [
      { title: "Sauté aromatics", text: "Heat oil, fry onion until soft, add garlic-ginger paste and curry leaves, cook 2 minutes." },
      { title: "Build the sauce", text: "Add tomatoes and tamarind, cook until tomatoes break down. Pour in coconut milk and simmer 10 minutes." },
      { title: "Cook the fish", text: "Nestle fillets into the sauce, cover, and poach on low heat for 8–10 minutes until fish is cooked through." },
      { title: "Serve", text: "Garnish with fresh coriander and serve with wali wa nazi (coconut rice)." },
    ],
  },
  "Cardamom Mandazi": {
    time: "50 min",
    image: "https://images.unsplash.com/photo-1533910534207-90f31029a78e?auto=format&fit=crop&w=600&q=80",
    ingredients: [
      { name: "All-purpose flour", qty: "2 cups" },
      { name: "Sugar", qty: "¼ cup" },
      { name: "Coconut milk", qty: "¾ cup" },
      { name: "Cardamom, ground", qty: "1 tsp" },
      { name: "Baking powder", qty: "1 tsp" },
      { name: "Pinch of salt", qty: "" },
      { name: "Oil for frying", qty: "enough to submerge" },
    ],
    steps: [
      { title: "Make the dough", text: "Mix flour, sugar, cardamom, baking powder and salt. Add coconut milk and knead into a soft dough." },
      { title: "Rest", text: "Cover and rest for 20 minutes so the gluten relaxes." },
      { title: "Shape", text: "Roll out to 1 cm thickness and cut into triangles or rounds." },
      { title: "Fry", text: "Deep-fry in hot oil (170 °C) until puffed and golden, about 2 minutes per side." },
    ],
  },
  "Six-Hour Nyama Choma Marinade": {
    time: "6h marinade",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
    ingredients: [
      { name: "Goat or beef chunks", qty: "1 kg" },
      { name: "Garlic, minced", qty: "6 cloves" },
      { name: "Fresh ginger, grated", qty: "2 tbsp" },
      { name: "Cumin, ground", qty: "1 tsp" },
      { name: "Paprika", qty: "1 tsp" },
      { name: "Lemon juice", qty: "3 tbsp" },
      { name: "Oil", qty: "2 tbsp" },
      { name: "Salt & black pepper", qty: "to taste" },
    ],
    steps: [
      { title: "Mix the marinade", text: "Combine garlic, ginger, cumin, paprika, lemon juice, oil, salt and pepper in a bowl." },
      { title: "Coat the meat", text: "Toss the meat in the marinade, cover, and refrigerate for at least 6 hours (overnight is best)." },
      { title: "Grill", text: "Bring to room temperature, then grill over hot charcoal for 8–12 minutes, turning often, until charred outside and pink inside." },
      { title: "Rest and serve", text: "Rest 5 minutes, then serve with kachumbari and ugali." },
    ],
  },
  "Soft, Layered Chapati": {
    time: "35 min",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
    ingredients: [
      { name: "All-purpose flour", qty: "2 cups" },
      { name: "Warm water", qty: "¾ cup" },
      { name: "Salt", qty: "1 tsp" },
      { name: "Oil or ghee", qty: "3 tbsp" },
    ],
    steps: [
      { title: "Make the dough", text: "Mix flour and salt, add water gradually, knead for 8 minutes until smooth. Oil the surface and rest 20 minutes." },
      { title: "Laminate", text: "Divide into balls, roll each thin, brush with oil, then fold into a square or coil. Roll out again." },
      { title: "Cook", text: "Heat a dry pan, cook each chapati 1–2 minutes per side until brown spots appear. Brush with ghee." },
      { title: "Serve", text: "Stack and wrap in a clean cloth to keep soft. Serve with any curry or stew." },
    ],
  },
  "Five-Minute Kachumbari": {
    time: "10 min",
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80",
    ingredients: [
      { name: "Tomatoes, diced", qty: "2 large" },
      { name: "Red onion, thin-sliced", qty: "1" },
      { name: "Fresh coriander, chopped", qty: "2 tbsp" },
      { name: "Lemon juice", qty: "1 tbsp" },
      { name: "Green chilli, minced", qty: "1" },
      { name: "Salt", qty: "to taste" },
    ],
    steps: [
      { title: "Combine", text: "Toss tomatoes, onion, coriander and chilli in a bowl." },
      { title: "Dress", text: "Squeeze lemon juice over, season with salt, and toss gently." },
      { title: "Serve immediately", text: "Best fresh — serve alongside any grilled meat, pilau, or biryani." },
    ],
  },
};

const recipeCards = [
  { title: "Crisp Turmeric Bhajia", desc: "Get the fritters crunchy on the outside and soft inside with one gram-flour trick.", time: "25 min", difficulty: "Easy", img: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80" },
  { title: "Coconut Fish Curry (Mchuzi wa Samaki)", desc: "Fresh coconut milk, curry leaves and tamarind — the coastal curry base explained.", time: "40 min", difficulty: "Medium", img: "https://images.unsplash.com/photo-1626200926749-1f4c9b28c5eb?auto=format&fit=crop&w=600&q=80" },
  { title: "Cardamom Mandazi", desc: "Pillowy coconut-milk doughnuts, fried golden — perfect with morning chai.", time: "50 min", difficulty: "Easy", img: "https://images.unsplash.com/photo-1533910534207-90f31029a78e?auto=format&fit=crop&w=600&q=80" },
  { title: "Six-Hour Nyama Choma Marinade", desc: "The garlic, ginger and spice rub behind our charcoal-grilled goat.", time: "6h marinade", difficulty: "Medium", img: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80" },
  { title: "Soft, Layered Chapati", desc: "The lamination method that gives chapati its flaky layers, done by hand.", time: "35 min", difficulty: "Medium", img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80" },
  { title: "Five-Minute Kachumbari", desc: "The bright, crunchy salad that cuts through every rich coastal dish.", time: "10 min", difficulty: "Easy", img: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80" },
];

const defaultRecipe = recipeMeta["Zanzibar Pilau, step by step"]!;

export default function RecipesPage() {
  const featuredRef = useRef<HTMLDivElement>(null);

  const [activeRecipe, setActiveRecipe] = useState("Zanzibar Pilau, step by step");
  const recipe = recipeMeta[activeRecipe] ?? defaultRecipe;

  const scrollToFeatured = (title: string) => {
    setActiveRecipe(title);
    // Scroll to the featured section
    featuredRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div>
      {/* Page header */}
      <section
        className="py-16"
        style={{ borderBottom: "1px solid var(--color-indigo-line)", background: "radial-gradient(ellipse at 80% 0%, rgba(226,161,58,.10), transparent 55%)" }}
      >
        <div className="mx-auto max-w-[1180px] px-8">
          <p className="mb-[14px] text-[0.82rem] text-cream-300">
            <a href="/" className="text-gold-400">Home</a> / <span>Recipes</span>
          </p>
          <h1 className="mb-[10px] text-[clamp(2.4rem,4.2vw,3.8rem)] font-medium text-cream-050" style={{ fontFamily: "var(--font-display)" }}>
            From our kitchen to yours
          </h1>
          <p className="mx-auto max-w-xl text-cream-300">
            The techniques and family recipes behind our coastal dishes — so you can cook the coast at home.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="mx-auto max-w-[1180px] px-8">

          {/* Featured recipe */}
          <div ref={featuredRef} className="mb-[90px] grid gap-14 lg:grid-cols-[.9fr_1.1fr] lg:items-start">
            {/* Left: image + ingredients */}
            <div>
              <div className="arch-frame mb-[26px]" style={{ aspectRatio: "4/5" }}>
                <img
                  key={activeRecipe}
                  src={recipe.image}
                  alt={activeRecipe}
                />
              </div>
              <h3 className="mb-[18px] text-[1.3rem] font-semibold text-cream-050" style={{ fontFamily: "var(--font-display)" }}>
                Ingredients <span className="text-[0.85rem] font-normal text-cream-300">— serves 4</span>
              </h3>
              <ul>
                {recipe.ingredients.map((ing) => (
                  <li
                    key={ing.name}
                    className="flex justify-between border-b border-indigo-line py-3 text-[0.9rem]"
                  >
                    <span>{ing.name}</span>
                    <span className="font-semibold text-gold-100">{ing.qty}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: steps */}
            <div>
              <span className="mb-4 block text-[0.82rem] font-semibold text-gold-400">Featured recipe · {recipe.time}</span>
              <h2 className="mb-6 text-[clamp(1.9rem,3vw,2.6rem)] text-cream-050" style={{ fontFamily: "var(--font-display)" }}>
                {activeRecipe}
              </h2>
              <p className="mb-8 max-w-[62ch] text-cream-300">
                The secret isn&apos;t a long ingredient list — it&apos;s patience with the onions and whole spices bloomed in hot fat before anything else goes in the pot.
              </p>

              <div className="mt-2.5">
                {recipe.steps.map((step, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[44px_1fr] gap-[18px] border-b border-indigo-line py-[22px] last:border-b-0"
                  >
                    <span
                      className="flex h-[44px] w-[44px] items-center justify-center rounded-full border border-gold-400 text-[1.1rem] text-gold-400"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {i + 1}
                    </span>
                    <div>
                      <h4 className="mb-1.5 text-[0.98rem] font-bold text-cream-050" style={{ fontFamily: "var(--font-body)" }}>{step.title}</h4>
                      <p className="m-0 text-[0.9rem] text-cream-300">{step.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <a href="/menu" className="btn btn-primary mt-[30px]">
                Order it instead
              </a>
            </div>
          </div>

          {/* Section head */}
          <div className="mb-[46px] flex flex-wrap items-end justify-between gap-6">
            <div>
              <span className="mb-2 block text-[0.82rem] font-semibold text-gold-400">More from the coast</span>
              <h2 className="mb-2 text-[clamp(1.9rem,3vw,2.6rem)] text-cream-050" style={{ fontFamily: "var(--font-display)" }}>
                Recipes to try at home
              </h2>
            </div>
            <p className="text-cream-300">Simple techniques, real coastal spice blends.</p>
          </div>

          {/* Recipe grid */}
          <div className="recipe-grid">
            {recipeCards.map((r) => (
              <article key={r.title} className="recipe-card group">
                <div className="recipe-media">
                  <img src={r.img} alt={r.title} />
                </div>
                <div className="recipe-body">
                  <div className="recipe-meta mb-[10px]">
                    <span>{r.time}</span>
                    <span>{r.difficulty}</span>
                  </div>
                  <h3 className="mb-2 text-[1.08rem] font-semibold text-cream-050" style={{ fontFamily: "var(--font-display)" }}>
                    {r.title}
                  </h3>
                  <p className="mb-[14px] text-[0.87rem] text-cream-300">
                    {r.desc}
                  </p>
                  <button
                    className="read-link text-[0.84rem] font-bold text-gold-100"
                    onClick={() => scrollToFeatured(r.title)}
                  >
                    Read the recipe →
                  </button>
                </div>
              </article>
            ))}
          </div>

        </div>
      </section>
    </div>
  );
}


