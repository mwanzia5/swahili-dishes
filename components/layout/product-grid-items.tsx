import Grid from "components/grid";
import { GridTileImage } from "components/grid/tile";
import type { Product } from "lib/insforge/types";
import { formatPrice } from "lib/utils";
import Link from "next/link";

export default function ProductGridItems({
  products,
}: {
  products: Product[];
}) {
  return (
    <>
      {products.map((product) => {
        const image = (product.images as any)?.[0];
        const imageUrl = image?.url ?? "/images/placeholder.webp";

        return (
          <Grid.Item key={product.id} className="animate-fadeIn">
            <Link
              className="relative inline-block h-full w-full"
              href={`/product/${product.slug}`}
              prefetch={true}
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
                sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
              />
            </Link>
          </Grid.Item>
        );
      })}
    </>
  );
}
