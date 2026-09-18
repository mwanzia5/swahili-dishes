import { AddToCart } from "components/cart/add-to-cart";
import { FavouriteButton } from "./favourite-button";
import { formatPrice } from "lib/utils";
import Prose from "components/prose";
import type { Product, ProductVariant } from "lib/insforge/types";
import { VariantSelectorClient } from "./variant-selector-client";

export function ProductDescription({
  product,
  favourited = false,
  signedIn = false,
}: {
  product: Product;
  favourited?: boolean;
  signedIn?: boolean;
}) {
  const variants = (product.variants as ProductVariant[]) ?? [];

  return (
    <>
      <div className="mb-6 flex flex-col border-b pb-6 border-neutral-800">
        <h1 className="mb-2 text-3xl font-medium text-white sm:text-5xl">{product.name}</h1>
        <div className="mr-auto w-auto rounded-full bg-[var(--color-gold-400)] p-2 text-sm text-white font-medium">
          {formatPrice(product.price)}
        </div>
      </div>
      <VariantSelectorClient variants={variants} productId={product.id} productPrice={product.price} />
      {product.description ? (
        <Prose
          className="mb-6 text-sm leading-tight text-white/60"
          html={product.description}
        />
      ) : null}
      <AddToCart product={product} />
      {signedIn ? (
        <FavouriteButton productId={product.id} initialFavourite={favourited} />
      ) : null}
    </>
  );
}
