import { GridTileImage } from "components/grid/tile";
import Footer from "components/layout/footer";
import { Gallery } from "components/product/gallery";
import { ProductDescription } from "components/product/product-description";
import { ProductViewTracker } from "components/crm/product-view-tracker";
import { getSessionUser } from "app/auth/actions";
import { getFavouriteIds } from "app/favourites/actions";
import { getProductBySlug, getRelatedProducts } from "lib/insforge/storefront";
import type { ProductImage } from "lib/insforge/types";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export async function generateMetadata(props: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const product = await getProductBySlug(params.handle);

  if (!product) return notFound();

  const image = (product.images as ProductImage[])?.[0];

  return {
    title: product.name,
    description: product.description || product.name,
    openGraph: image
      ? {
          images: [
            {
              url: image.url,
              width: 800,
              height: 800,
              alt: image.alt_text || product.name,
            },
          ],
        }
      : null,
  };
}

export default async function ProductPage(props: {
  params: Promise<{ handle: string }>;
}) {
  const params = await props.params;
  const product = await getProductBySlug(params.handle);

  if (!product) return notFound();

  const images = (product.images as ProductImage[]) ?? [];
  const user = await getSessionUser();
  const favIds = user ? await getFavouriteIds() : new Set<string>();
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.name,
    image: images[0]?.url,
    offers: {
      "@type": "AggregateOffer",
      availability: product.is_available
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      priceCurrency: "KES",
      highPrice: product.price,
      lowPrice: product.price,
    },
  };

  return (
    <>
      <ProductViewTracker productId={product.id} productName={product.name} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd),
        }}
      />
      <div className="mx-auto max-w-(--breakpoint-2xl) px-4">
        <div className="flex flex-col rounded-lg border border-neutral-800 bg-indigo-950 p-8 md:p-12 lg:flex-row lg:gap-8">
          <div className="h-full w-full basis-full lg:basis-4/6">
            <Suspense
              fallback={
                <div className="relative aspect-square h-full max-h-[550px] w-full overflow-hidden" />
              }
            >
              <Gallery
                images={images.slice(0, 5).map((image) => ({
                  src: image.url,
                  altText: image.alt_text ?? product.name,
                }))}
              />
            </Suspense>
          </div>

          <div className="basis-full lg:basis-2/6">
            <Suspense fallback={null}>
              <ProductDescription
                product={product}
                favourited={favIds.has(product.id)}
                signedIn={!!user}
              />
            </Suspense>
          </div>
        </div>
        <RelatedProducts productId={product.id} categoryId={product.category_id} />
      </div>
      <Footer />
    </>
  );
}

async function RelatedProducts({ productId, categoryId }: { productId: string; categoryId: string | null }) {
  const relatedProducts = await getRelatedProducts(productId, categoryId);

  if (!relatedProducts.length) return null;

  return (
    <div className="py-8">
      <h2 className="mb-4 text-2xl font-bold text-white">Related Products</h2>
      <ul className="flex w-full gap-4 overflow-x-auto pt-1">
        {relatedProducts.map((product) => {
          const image = (product.images as any)?.[0];
          const imageUrl = image?.url ?? "/images/placeholder.webp";

          return (
            <li
              key={product.id}
              className="aspect-square w-full flex-none min-[475px]:w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5"
            >
              <Link
                className="relative h-full w-full"
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
                  sizes="(min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, (min-width: 475px) 50vw, 100vw"
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
