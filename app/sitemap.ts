import { getProducts, getCategories } from "lib/insforge/storefront";
import { baseUrl } from "lib/utils";
import { MetadataRoute } from "next";

type Route = {
  url: string;
  lastModified: string;
};

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routesMap = ["", "/menu", "/recipes", "/about", "/contact"].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
  }));

  const categoriesPromise = getCategories().then((categories) =>
    categories.map((cat) => ({
      url: `${baseUrl}/menu/${cat.slug}`,
      lastModified: cat.updated_at ?? new Date().toISOString(),
    })),
  );

  const productsPromise = getProducts().then((products) =>
    products.map((product) => ({
      url: `${baseUrl}/product/${product.slug}`,
      lastModified: product.updated_at ?? new Date().toISOString(),
    })),
  );

  let fetchedRoutes: Route[] = [];

  try {
    fetchedRoutes = (
      await Promise.all([categoriesPromise, productsPromise])
    ).flat();
  } catch (error) {
    throw JSON.stringify(error, null, 2);
  }

  return [...routesMap, ...fetchedRoutes];
}
