export type MenuItem = {
  title: string;
  path: string;
};

export const DEFAULT_MENU: MenuItem[] = [
  { title: "Menu", path: "/menu" },
  { title: "Recipes", path: "/recipes" },
  { title: "About", path: "/about" },
  { title: "Contact", path: "/contact" },
];

export const DEFAULT_FOOTER_MENU: MenuItem[] = [
  { title: "About Us", path: "/about" },
  { title: "Contact", path: "/contact" },
  { title: "Menu", path: "/menu" },
  { title: "Recipes", path: "/recipes" },
  { title: "Privacy Policy", path: "/privacy" },
  { title: "Terms of Service", path: "/terms" },
];

export type SortFilterItem = {
  title: string;
  slug: string | null;
  sort: string;
  order: "asc" | "desc";
};

export const defaultSort: SortFilterItem = {
  title: "Relevance",
  slug: null,
  sort: "created_at",
  order: "desc",
};

export const sorting: SortFilterItem[] = [
  defaultSort,
  {
    title: "Popular",
    slug: "popular-desc",
    sort: "rating_count",
    order: "desc",
  },
  {
    title: "Newest",
    slug: "newest-desc",
    sort: "created_at",
    order: "desc",
  },
  {
    title: "Price: Low to high",
    slug: "price-asc",
    sort: "price",
    order: "asc",
  },
  {
    title: "Price: High to low",
    slug: "price-desc",
    sort: "price",
    order: "desc",
  },
];

export const SWAHILI_DISH_CATEGORIES = [
  { slug: "pilau", name: "Pilau", emoji: "" },
  { slug: "biryani", name: "Biryani", emoji: "" },
  { slug: "chapati", name: "Chapati", emoji: "" },
  { slug: "viazi", name: "Viazi", emoji: "" },
  { slug: "samaki", name: "Samaki", emoji: "" },
  { slug: "chicken", name: "Chicken", emoji: "" },
  { slug: "beef", name: "Beef", emoji: "" },
  { slug: "vegetarian", name: "Vegetarian", emoji: "" },
  { slug: "breakfast", name: "Breakfast", emoji: "" },
  { slug: "drinks", name: "Drinks", emoji: "" },
  { slug: "desserts", name: "Desserts", emoji: "" },
];

export const ORDER_STATUSES = [
  { value: "PENDING_PAYMENT", label: "Pending Payment", color: "text-yellow-500" },
  { value: "PAID", label: "Paid", color: "text-green-500" },
  { value: "CONFIRMED", label: "Confirmed", color: "text-green-500" },
  { value: "PREPARING", label: "Preparing", color: "text-orange-500" },
  { value: "READY", label: "Ready", color: "text-blue-500" },
  { value: "OUT_FOR_DELIVERY", label: "Out for Delivery", color: "text-blue-500" },
  { value: "DELIVERED", label: "Delivered", color: "text-emerald-500" },
  { value: "PICKED_UP", label: "Picked Up", color: "text-emerald-500" },
  { value: "CANCELLED", label: "Cancelled", color: "text-red-500" },
  { value: "REFUNDED", label: "Refunded", color: "text-red-500" },
] as const;