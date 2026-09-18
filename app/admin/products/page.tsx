import Link from "next/link";
import { getAdminClient } from "lib/insforge/admin";
import { formatPrice } from "lib/utils";
import { ProductPublishToggle } from "components/admin/product-publish-toggle";
import { ProductImageManager } from "components/admin/product-image-manager";
import { FetchImagesButton } from "components/admin/fetch-images-button";

export const metadata = {
  title: "Products",
};

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const admin = getAdminClient();

  const { data } = await admin.database
    .from("products")
    .select(
      "id, name, slug, price, image_url, category:categories!products_category_id_fkey(name), is_published, is_available, is_featured, rating, rating_count",
    )
    .order("created_at", { ascending: false })
    .limit(200);

const products = (data as unknown) as {
  id: string;
  name: string;
  slug: string;
  price: string;
  image_url: string | null;
  category?: { name: string } | null;
  is_published: boolean;
  is_available: boolean;
  is_featured: boolean;
  rating: string;
  rating_count: number;
}[];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-medium text-white">Products</h2>
        <div className="flex items-center gap-4">
          <FetchImagesButton />
          <p className="text-xs text-neutral-500">{products.length} products</p>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-indigo-line p-10 text-center text-neutral-600">
          <p>No products found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-xs text-neutral-500">
                <th className="pb-3 font-medium">Image</th>
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Category</th>
                <th className="pb-3 font-medium">Price</th>
                <th className="pb-3 font-medium">Rating</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Image</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-neutral-800/50 hover:bg-neutral-900/50">
                  <td className="py-3 pr-4">
                    <ClientImageCell
                      productId={product.id}
                      productName={product.name}
                      imageUrl={product.image_url}
                    />
                  </td>
                  <td className="py-3">
                    <Link href={`/product/${product.slug}`} className="font-medium text-white hover:underline">
                      {product.name}
                    </Link>
                  </td>
                  <td className="py-3 text-cream-300">{product.category?.name ?? "—"}</td>
                  <td className="py-3 text-cream-300">{formatPrice(Number(product.price))}</td>
                  <td className="py-3 text-cream-300">
                    {product.rating} ({product.rating_count})
                  </td>
                  <td className="py-3">
                    <ProductPublishToggle
                      productId={product.id}
                      published={product.is_published}
                    />
                  </td>
                  <td className="py-3">
                    <ProductImageManager
                      productId={product.id}
                      productName={product.name}
                      currentImageUrl={product.image_url}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Client wrapper for the image cell to handle state updates
function ClientImageCell({
  productId,
  productName,
  imageUrl,
}: {
  productId: string;
  productName: string;
  imageUrl: string | null;
}) {
  return (
    <div className="h-12 w-12 overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={productName}
          className="h-full w-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/images/dishes/placeholder.webp";
          }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-neutral-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
    </div>
  );
}
