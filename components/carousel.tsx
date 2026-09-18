import { getFeaturedProducts } from "lib/insforge/storefront";
import Link from "next/link";
import { GridTileImage } from "./grid/tile";

export async function Carousel() {
  const products = await getFeaturedProducts();

  if (!products?.length) return null;

  const carouselProducts = [...products, ...products, ...products];

  return (
    <div className="w-full overflow-x-auto pb-6 pt-1">
      <ul className="flex animate-carousel gap-4">
        {carouselProducts.map((product, i) => {
          const image = (product.images as any)?.[0];
          const imageUrl = image?.url ?? "/images/placeholder.webp";

          return (
            <li
              key={`${product.id}${i}`}
              className="relative aspect-square h-[30vh] max-h-[275px] w-2/3 max-w-[475px] flex-none md:w-1/3"
            >
              <Link
                href={`/product/${product.slug}`}
                className="relative h-full w-full"
              >
                <GridTileImage
                  alt={product.name}
                  label={{
                    title: product.name,
                    amount: product.price,
                    currencyCode: "KES",
                  }}
                  src={imageUrl}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
