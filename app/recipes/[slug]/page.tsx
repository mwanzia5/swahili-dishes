import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecipeBySlug } from "lib/insforge/storefront";

function timeLabel(minutes: number | null): string {
  if (!minutes) return "—";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const recipe = await getRecipeBySlug(slug);
  return {
    title: recipe?.title ?? "Recipe",
    description: recipe?.description ?? undefined,
  };
}

export default async function RecipePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const recipe = await getRecipeBySlug(slug);
  if (!recipe) notFound();

  const totalTime =
    (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0);
  const src = recipe.hero_image_url || "/images/placeholder.webp";

  return (
    <article className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href="/recipes"
        className="mb-6 inline-block text-sm text-neutral-500 hover:text-white"
      >
        ← All recipes
      </Link>

      <h1 className="text-3xl font-semibold text-white md:text-4xl">
        {recipe.title}
      </h1>
      {recipe.description ? (
        <p className="mt-3 max-w-2xl text-neutral-500">{recipe.description}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-6 text-sm text-neutral-400">
        <div>
          <span className="block text-xs uppercase tracking-wide text-neutral-600">
            Difficulty
          </span>
          <span className="font-medium capitalize text-white">
            {recipe.difficulty.toLowerCase()}
          </span>
        </div>
        <div>
          <span className="block text-xs uppercase tracking-wide text-neutral-600">
            Servings
          </span>
          <span className="font-medium text-white">{recipe.servings ?? "—"}</span>
        </div>
        <div>
          <span className="block text-xs uppercase tracking-wide text-neutral-600">
            Prep
          </span>
          <span className="font-medium text-white">
            {timeLabel(recipe.prep_time_minutes)}
          </span>
        </div>
        <div>
          <span className="block text-xs uppercase tracking-wide text-neutral-600">
            Cook
          </span>
          <span className="font-medium text-white">
            {timeLabel(recipe.cook_time_minutes)}
          </span>
        </div>
        <div>
          <span className="block text-xs uppercase tracking-wide text-neutral-600">
            Total
          </span>
          <span className="font-medium text-white">{timeLabel(totalTime)}</span>
        </div>
      </div>

      <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={recipe.title}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="mt-10 grid gap-10 md:grid-cols-[1fr_2fr]">
        <section>
          <h2 className="mb-4 text-lg font-medium text-white">Ingredients</h2>
          <ul className="space-y-2 text-neutral-300">
            {(recipe.recipe_ingredients ?? [])
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((ing) => (
                <li
                  key={ing.id}
                  className="flex items-baseline justify-between gap-3 rounded-lg border border-neutral-800 px-3 py-2"
                >
                  <span>{ing.name}</span>
                  {ing.quantity ? (
                    <span className="shrink-0 text-sm text-neutral-500">
                      {ing.quantity}
                    </span>
                  ) : null}
                </li>
              ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-medium text-white">Instructions</h2>
          <ol className="space-y-5">
            {recipe.instructions.map((step, index) => (
              <li key={index} className="flex gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-gold-400)]/15 text-sm font-semibold text-[var(--color-gold-400)]">
                  {index + 1}
                </span>
                <p className="text-neutral-300">{step}</p>
              </li>
            ))}
          </ol>

          {recipe.source_url ? (
            <p className="mt-8 text-sm text-neutral-600">
              Inspired by{" "}
              <a
                href={recipe.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 underline underline-offset-4 hover:text-white"
              >
                {recipe.source_name ?? recipe.source_url}
              </a>
            </p>
          ) : null}
        </section>
      </div>
    </article>
  );
}