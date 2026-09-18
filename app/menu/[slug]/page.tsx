import Link from "next/link";
import { notFound } from "next/navigation";
import Grid from "components/grid";
import ProductGridItems from "components/layout/product-grid-items";
import { getCategories, getProductsByCategorySlug } from "lib/insforge/storefront";

export const metadata = {
  title: "Menu",
};

export default async function MenuCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [categories, { products }] = await Promise.all([
    getCategories(),
    getProductsByCategorySlug(slug),
  ]);

  if (products.length === 0) notFound();

  const category = categories.find((c) => c.slug === slug);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      <header className="py-12 text-center">
        <Link
          href="/menu"
          className="mb-4 inline-block text-sm text-neutral-500 hover:text-white"
        >
          ← Full menu
        </Link>
        <h1 className="text-3xl font-semibold text-white md:text-4xl">
          {category?.name ?? slug.charAt(0).toUpperCase() + slug.slice(1)}
        </h1>
        {category?.description ? (
          <p className="mx-auto mt-3 max-w-xl text-neutral-500">
            {category.description}
          </p>
        ) : null}
      </header>

      <nav className="mb-10 flex flex-wrap justify-center gap-2" aria-label="Menu categories">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/menu/${c.slug}`}
            className={
              c.slug === slug
                ? "rounded-full border border-[var(--color-gold-400)] bg-[var(--color-gold-400)]/10 px-4 py-1.5 text-sm text-white"
                : "rounded-full border border-neutral-800 px-4 py-1.5 text-sm text-neutral-400 transition hover:border-[var(--color-gold-400)] hover:text-white"
            }
          >
            {c.name}
          </Link>
        ))}
      </nav>

      <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <ProductGridItems products={products} />
      </Grid>
    </div>
  );
}