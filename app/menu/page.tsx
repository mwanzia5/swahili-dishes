import { getProducts } from "lib/insforge/storefront";
import { MenuClient } from "./menu-client";

export default async function MenuPage() {
  const products = await getProducts();

  return <MenuClient initialProducts={products} />;
}