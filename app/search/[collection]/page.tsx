import { getProductsByCategorySlug } from "lib/insforge/storefront";
import { Metadata } from "next";
import { notFound } from "next/navigation";

import Grid from "components/grid";
import ProductGridItems from "components/layout/product-grid-items";
import { defaultSort, sorting } from "lib/constants";

export async function generateMetadata(props: {
  params: Promise<{ collection: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const { products } = await getProductsByCategorySlug(params.collection, { limit: 1 });

  if (products.length === 0) return notFound();

  return {
    title: params.collection.charAt(0).toUpperCase() + params.collection.slice(1),
    description: `Browse our ${params.collection} dishes`,
  };
}

export default async function CategoryPage(props: {
  params: Promise<{ collection: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const { sort } = searchParams as { [key: string]: string };
  const { sort: sortCol, order } =
    sorting.find((item) => item.slug === sort) || defaultSort;

  const { products } = await getProductsByCategorySlug(params.collection, {
    sort: sortCol,
    order,
  });

  return (
    <section>
      {products.length === 0 ? (
        <p className="py-3 text-lg">{`No products found in this collection`}</p>
      ) : (
        <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <ProductGridItems products={products} />
        </Grid>
      )}
    </section>
  );
}
