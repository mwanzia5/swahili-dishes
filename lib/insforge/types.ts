export type Role = "CUSTOMER" | "STAFF" | "ADMIN";

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: Role;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: string;
  compare_at_price: string | null;
  currency: string;
  category_id: string | null;
  image_url: string | null;
  ingredients: string[];
  allergens: string[];
  prep_time_minutes: number | null;
  is_published: boolean;
  is_available: boolean;
  is_featured: boolean;
  is_popular: boolean;
  rating: string;
  rating_count: number;
  created_at: string;
  updated_at: string;
  category?: Category | null;
  images?: ProductImage[];
  variants?: ProductVariant[];
};

export type ProductImage = {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
  created_at: string;
};

export type ProductVariant = {
  id: string;
  product_id: string;
  title: string;
  price: string;
  type: "PORTION" | "EXTRA";
  is_active: boolean;
  options: Record<string, string> | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type CartItemExtra = {
  id: string;
  title: string;
  price: string;
};

export type CartItem = {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price: string;
  extras: CartItemExtra[];
  notes: string | null;
  created_at: string;
  product?: Product | null;
};

export type Cart = {
  id: string;
  user_id: string | null;
  session_token: string | null;
  status: "ACTIVE" | "CHECKED_OUT" | "ABANDONED";
  created_at: string;
  updated_at: string;
  delivery_fee?: string;
  discount?: string;
  items?: CartItem[];
  /** Computed fields — populated by readCart(), not from DB */
  total_quantity?: number;
  subtotal?: number;
  total?: number;
};

export type Address = {
  id: string;
  user_id: string;
  county: string;
  area: string;
  estate: string | null;
  street: string | null;
  instructions: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "PICKED_UP"
  | "CANCELLED"
  | "REFUNDED";

export type FulfillmentType = "DELIVERY" | "PICKUP";

export type Order = {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  status: OrderStatus;
  fulfillment_type: FulfillmentType;
  address_id: string | null;
  delivery_county: string | null;
  delivery_area: string | null;
  delivery_estate: string | null;
  delivery_street: string | null;
  delivery_instructions: string | null;
  subtotal: string;
  delivery_fee: string;
  discount: string;
  total: string;
  currency: string;
  payment_method: "DARJ" | "STRIPE" | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price: string;
  quantity: number;
  extras: CartItemExtra[];
  notes: string | null;
  created_at: string;
};

export type OrderStatusHistory = {
  id: string;
  order_id: string;
  status: OrderStatus | string;
  note: string | null;
  changed_by: string | null;
  created_at: string;
};

export type PaymentProvider = "DARJ" | "STRIPE";
export type PaymentStatus =
  | "PENDING"
  | "INITIATED"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

export type Payment = {
  id: string;
  order_id: string;
  provider: PaymentProvider;
  provider_reference: string | null;
  amount: string;
  currency: string;
  status: PaymentStatus;
  method: "mpesa" | "card";
  meta: Record<string, unknown>;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PaymentAttempt = {
  id: string;
  payment_id: string;
  attempt_type: "STK_PUSH" | "CHECKOUT_SESSION";
  status: string;
  request_payload: Record<string, unknown>;
  response_payload: Record<string, unknown>;
  result_code: string | null;
  result_desc: string | null;
  mpesa_receipt: string | null;
  phone: string | null;
  created_at: string;
};

export type RecipeStatus =
  | "DRAFT"
  | "SCRAPED"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "PUBLISHED"
  | "REJECTED";

export type Recipe = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  hero_image_url: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: number | null;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  instructions: string[];
  status: RecipeStatus;
  source_url: string | null;
  source_name: string | null;
  created_at: string;
  updated_at: string;
  recipe_ingredients?: RecipeIngredient[];
};

export type RecipeIngredient = {
  id: string;
  recipe_id: string;
  product_id: string | null;
  name: string;
  quantity: string | null;
  sort_order: number;
  created_at: string;
};

export type RecipeSource = {
  id: string;
  source_name: string;
  source_domain: string;
  source_url: string;
  image_url: string | null;
  scraped_at: string | null;
  status: RecipeStatus;
  created_at: string;
  updated_at: string;
};

export type Review = {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
};

export type Favorite = {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
};

export type AIConversation = {
  id: string;
  user_id: string | null;
  title: string;
  source: "web" | "voice";
  created_at: string;
  updated_at: string;
};

export type AIMessage = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "tool" | "system";
  content: string;
  tool_calls: Record<string, unknown>[];
  metadata: Record<string, unknown>;
  created_at: string;
};

export type AIRecommendation = {
  id: string;
  conversation_id: string | null;
  user_id: string | null;
  product_id: string;
  reason: string | null;
  clicked: boolean;
  added_to_cart: boolean;
  created_at: string;
};

export type ScrapeJob = {
  id: string;
  status: "RUNNING" | "COMPLETED" | "FAILED";
  source_url: string | null;
  source_domain: string | null;
  result_count: number;
  error: string | null;
  created_at: string;
  updated_at: string;
};

export type Ingredient = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type InventoryItem = {
  id: string;
  ingredient_id: string | null;
  quantity: string;
  unit: string;
  min_stock: string;
  supplier: string | null;
  status: "OK" | "LOW" | "OUT";
  created_at: string;
  updated_at: string;
};

export type AnalyticsEventType =
  | "page_view"
  | "product_view"
  | "search"
  | "add_to_cart"
  | "checkout_started"
  | "payment_started"
  | "payment_success"
  | "order_created"
  | "order_completed"
  | "recipe_view"
  | "ai_message"
  | "ai_recipe_request"
  | "ai_recommendation"
  | "ai_product_click"
  | "voice_query";

export type AnalyticsEvent = {
  id: string;
  event_type: AnalyticsEventType;
  user_id: string | null;
  session_id: string | null;
  product_id: string | null;
  order_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
};

export type DashboardStats = {
  currency: string;
  today: {
    revenue: number;
    orders: number;
    customers: number;
    aov: number;
  };
  deltas: {
    revenue: number;
    orders: number;
    customers: number;
    aov: number;
  };
  revenue_series: { date: string; value: number }[];
  orders_series: { date: string; value: number }[];
  customers_series: { date: string; value: number }[];
};

export type TopProductsResult = {
  product_id: string | null;
  name: string;
  quantity: number;
  revenue: number;
};