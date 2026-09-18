-- Swahili Dishes — core schema
-- Tables, role helpers, RLS policies, indexes, triggers, grants.

-- ─────────────────────────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'CUSTOMER' CHECK (role IN ('CUSTOMER', 'STAFF', 'ADMIN')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- Role helpers (SECURITY DEFINER, profile-based authorization)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT public.current_user_role() = 'ADMIN'
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT public.current_user_role() IN ('ADMIN', 'STAFF')
$$;

CREATE OR REPLACE FUNCTION public.is_staff_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT public.is_staff()
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own_or_staff" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_staff());

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() AND NOT public.is_staff());

CREATE POLICY "profiles_update_own_or_staff" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_staff())
  WITH CHECK (id = auth.uid() OR public.is_staff());

-- ─────────────────────────────────────────────────────────────
-- categories
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select_public" ON public.categories
  FOR SELECT TO anon, authenticated
  USING (is_active = TRUE OR public.is_staff());

CREATE POLICY "categories_write_staff" ON public.categories
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE INDEX idx_categories_slug ON public.categories (slug);

-- ─────────────────────────────────────────────────────────────
-- products
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  compare_at_price NUMERIC(12,2) CHECK (compare_at_price >= 0),
  currency TEXT NOT NULL DEFAULT 'KES',
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  image_url TEXT,
  ingredients TEXT[] NOT NULL DEFAULT '{}',
  allergens TEXT[] NOT NULL DEFAULT '{}',
  prep_time_minutes INTEGER,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_popular BOOLEAN NOT NULL DEFAULT FALSE,
  rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_select_public" ON public.products
  FOR SELECT TO anon, authenticated
  USING (is_published = TRUE OR public.is_staff());

CREATE POLICY "products_write_staff" ON public.products
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE INDEX idx_products_slug ON public.products (slug);
CREATE INDEX idx_products_category ON public.products (category_id);
CREATE INDEX idx_products_created_at ON public.products (created_at DESC);
CREATE INDEX idx_products_featured ON public.products (is_featured) WHERE is_featured;
CREATE INDEX idx_products_popular ON public.products (is_popular) WHERE is_popular;

-- ─────────────────────────────────────────────────────────────
-- product_images
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_images_select_public" ON public.product_images
  FOR SELECT TO anon, authenticated
  USING (TRUE);

CREATE POLICY "product_images_write_staff" ON public.product_images
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE INDEX idx_product_images_product ON public.product_images (product_id);

-- ─────────────────────────────────────────────────────────────
-- product_variants (portions & extras)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  type TEXT NOT NULL DEFAULT 'PORTION' CHECK (type IN ('PORTION', 'EXTRA')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_variants_select_public" ON public.product_variants
  FOR SELECT TO anon, authenticated
  USING (TRUE);

CREATE POLICY "product_variants_write_staff" ON public.product_variants
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE INDEX idx_product_variants_product ON public.product_variants (product_id);

-- ─────────────────────────────────────────────────────────────
-- ingredients / inventory_items
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ingredients_select_public" ON public.ingredients
  FOR SELECT TO anon, authenticated
  USING (TRUE);

CREATE POLICY "ingredients_write_staff" ON public.ingredients
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE TABLE public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE CASCADE,
  quantity NUMERIC(12,2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'kg',
  min_stock NUMERIC(12,2) NOT NULL DEFAULT 0,
  supplier TEXT,
  status TEXT NOT NULL DEFAULT 'OK' CHECK (status IN ('OK', 'LOW', 'OUT')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inventory_select_staff" ON public.inventory_items
  FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY "inventory_write_staff" ON public.inventory_items
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE INDEX idx_inventory_ingredient ON public.inventory_items (ingredient_id);

-- ─────────────────────────────────────────────────────────────
-- recipes / recipe_ingredients / recipe_sources / scrape_jobs
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  hero_image_url TEXT,
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  servings INTEGER DEFAULT 1,
  difficulty TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
  instructions TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT', 'SCRAPED', 'PENDING_REVIEW', 'APPROVED', 'PUBLISHED', 'REJECTED')),
  source_url TEXT,
  source_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recipes_select_public" ON public.recipes
  FOR SELECT TO anon, authenticated
  USING (status = 'PUBLISHED' OR public.is_staff());

CREATE POLICY "recipes_write_staff" ON public.recipes
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE INDEX idx_recipes_slug ON public.recipes (slug);
CREATE INDEX idx_recipes_status ON public.recipes (status);
CREATE INDEX idx_recipes_created_at ON public.recipes (created_at DESC);

CREATE TABLE public.recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  quantity TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recipe_ingredients_select_public" ON public.recipe_ingredients
  FOR SELECT TO anon, authenticated
  USING (TRUE);

CREATE POLICY "recipe_ingredients_write_staff" ON public.recipe_ingredients
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE INDEX idx_recipe_ingredients_recipe ON public.recipe_ingredients (recipe_id);

CREATE TABLE public.recipe_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name TEXT NOT NULL,
  source_domain TEXT NOT NULL,
  source_url TEXT NOT NULL UNIQUE,
  image_url TEXT,
  scraped_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'SCRAPED'
    CHECK (status IN ('SCRAPED', 'PENDING_REVIEW', 'APPROVED', 'PUBLISHED', 'REJECTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.recipe_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recipe_sources_read_staff" ON public.recipe_sources
  FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY "recipe_sources_write_staff" ON public.recipe_sources
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE INDEX idx_recipe_sources_status ON public.recipe_sources (status);

CREATE TABLE public.scrape_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'RUNNING' CHECK (status IN ('RUNNING', 'COMPLETED', 'FAILED')),
  source_url TEXT,
  source_domain TEXT,
  result_count INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.scrape_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scrape_jobs_staff" ON public.scrape_jobs
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- ─────────────────────────────────────────────────────────────
-- carts / cart_items (guest carts are server-managed)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CHECKED_OUT', 'ABANDONED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "carts_select_own" ON public.carts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "carts_insert_own" ON public.carts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "carts_update_own" ON public.carts
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "carts_delete_own" ON public.carts
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX idx_carts_user ON public.carts (user_id);
CREATE INDEX idx_carts_session ON public.carts (session_token);

CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  extras JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cart_items_select_own" ON public.cart_items
  FOR SELECT TO authenticated
  USING (cart_id IN (SELECT c.id FROM public.carts c WHERE c.user_id = auth.uid()));

CREATE POLICY "cart_items_write_own" ON public.cart_items
  FOR ALL TO authenticated
  USING (cart_id IN (SELECT c.id FROM public.carts c WHERE c.user_id = auth.uid()))
  WITH CHECK (cart_id IN (SELECT c.id FROM public.carts c WHERE c.user_id = auth.uid()));

CREATE INDEX idx_cart_items_cart ON public.cart_items (cart_id);
CREATE INDEX idx_cart_items_product ON public.cart_items (product_id);

-- ─────────────────────────────────────────────────────────────
-- addresses
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  county TEXT NOT NULL,
  area TEXT NOT NULL,
  estate TEXT,
  street TEXT,
  instructions TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "addresses_own" ON public.addresses
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_addresses_user ON public.addresses (user_id);

-- ─────────────────────────────────────────────────────────────
-- orders
-- ─────────────────────────────────────────────────────────────
CREATE SEQUENCE public.order_number_seq START 1000;

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE DEFAULT ('SD-' || lpad(to_char(nextval('public.order_number_seq'), 'FM999999'), 4, '0')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING_PAYMENT' CHECK (
    status IN ('PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'PREPARING', 'READY',
               'OUT_FOR_DELIVERY', 'DELIVERED', 'PICKED_UP', 'CANCELLED', 'REFUNDED')
  ),
  fulfillment_type TEXT NOT NULL CHECK (fulfillment_type IN ('DELIVERY', 'PICKUP')),
  address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
  delivery_county TEXT,
  delivery_area TEXT,
  delivery_estate TEXT,
  delivery_street TEXT,
  delivery_instructions TEXT,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  delivery_fee NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
  discount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  total NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  currency TEXT NOT NULL DEFAULT 'KES',
  payment_method TEXT CHECK (payment_method IN ('DARJ', 'STRIPE')),
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_select_own_or_staff" ON public.orders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff());

CREATE POLICY "orders_insert_staff" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff());

CREATE POLICY "orders_update_staff" ON public.orders
  FOR UPDATE TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE INDEX idx_orders_status ON public.orders (status);
CREATE INDEX idx_orders_user ON public.orders (user_id);
CREATE INDEX idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX idx_orders_customer_phone ON public.orders (customer_phone);

-- order access helper (depends on public.orders)
CREATE OR REPLACE FUNCTION public.can_access_order(p_order_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = p_order_id
      AND (o.user_id = auth.uid() OR public.is_staff())
  )
$$;

-- ─────────────────────────────────────────────────────────────
-- order_items / order_status_history
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  extras JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_items_select_own_or_staff" ON public.order_items
  FOR SELECT TO authenticated
  USING (public.can_access_order(order_id) OR public.is_staff());

CREATE POLICY "order_items_write_staff" ON public.order_items
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE INDEX idx_order_items_order ON public.order_items (order_id);

CREATE TABLE public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_status_history_select_own_or_staff" ON public.order_status_history
  FOR SELECT TO authenticated
  USING (public.can_access_order(order_id) OR public.is_staff());

CREATE POLICY "order_status_history_write_staff" ON public.order_status_history
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE INDEX idx_order_status_history_order ON public.order_status_history (order_id);

-- ─────────────────────────────────────────────────────────────
-- payments / payment_attempts
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('DARJ', 'STRIPE')),
  provider_reference TEXT UNIQUE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'KES',
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'INITIATED', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED')),
  method TEXT NOT NULL DEFAULT 'mpesa' CHECK (method IN ('mpesa', 'card')),
  meta JSONB NOT NULL DEFAULT '{}',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select_own_or_staff" ON public.payments
  FOR SELECT TO authenticated
  USING (public.can_access_order(order_id) OR public.is_staff());

CREATE POLICY "payments_write_staff" ON public.payments
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE INDEX idx_payments_reference ON public.payments (provider_reference);
CREATE INDEX idx_payments_order ON public.payments (order_id);
CREATE INDEX idx_payments_status ON public.payments (status);

CREATE TABLE public.payment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  attempt_type TEXT NOT NULL CHECK (attempt_type IN ('STK_PUSH', 'CHECKOUT_SESSION')),
  status TEXT NOT NULL DEFAULT 'PENDING',
  request_payload JSONB NOT NULL DEFAULT '{}',
  response_payload JSONB NOT NULL DEFAULT '{}',
  result_code TEXT,
  result_desc TEXT,
  mpesa_receipt TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_attempts_staff" ON public.payment_attempts
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE INDEX idx_payment_attempts_payment ON public.payment_attempts (payment_id);
CREATE INDEX idx_payment_attempts_phone ON public.payment_attempts (phone);

-- ─────────────────────────────────────────────────────────────
-- reviews / favorites
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, user_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_select_public" ON public.reviews
  FOR SELECT TO anon, authenticated
  USING (TRUE);

CREATE POLICY "reviews_insert_own" ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "reviews_update_own" ON public.reviews
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "reviews_delete_own_or_staff" ON public.reviews
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_staff());

CREATE INDEX idx_reviews_product ON public.reviews (product_id);
CREATE INDEX idx_reviews_user ON public.reviews (user_id);

CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favorites_own" ON public.favorites
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_favorites_user ON public.favorites (user_id);
CREATE INDEX idx_favorites_product ON public.favorites (product_id);

-- ─────────────────────────────────────────────────────────────
-- ai_conversations / ai_messages / ai_recommendations
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New conversation',
  source TEXT NOT NULL DEFAULT 'web' CHECK (source IN ('web', 'voice')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_conversations_select_own_or_staff" ON public.ai_conversations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff());

CREATE POLICY "ai_conversations_insert_own" ON public.ai_conversations
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "ai_conversations_update_own" ON public.ai_conversations
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_ai_conversations_user ON public.ai_conversations (user_id);
CREATE INDEX idx_ai_conversations_created ON public.ai_conversations (created_at DESC);

CREATE TABLE public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'tool', 'system')),
  content TEXT NOT NULL DEFAULT '',
  tool_calls JSONB NOT NULL DEFAULT '[]',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_messages_select_own_or_staff" ON public.ai_messages
  FOR SELECT TO authenticated
  USING (conversation_id IN (SELECT c.id FROM public.ai_conversations c WHERE c.user_id = auth.uid()) OR public.is_staff());

CREATE POLICY "ai_messages_insert_own" ON public.ai_messages
  FOR INSERT TO authenticated
  WITH CHECK (conversation_id IN (SELECT c.id FROM public.ai_conversations c WHERE c.user_id = auth.uid()));

CREATE INDEX idx_ai_messages_conversation ON public.ai_messages (conversation_id, created_at);

CREATE TABLE public.ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  reason TEXT,
  clicked BOOLEAN NOT NULL DEFAULT FALSE,
  added_to_cart BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_recommendations_select_own_or_staff" ON public.ai_recommendations
  FOR SELECT TO authenticated
  USING ((user_id = auth.uid() OR conversation_id IN (SELECT c.id FROM public.ai_conversations c WHERE c.user_id = auth.uid())) OR public.is_staff());

CREATE POLICY "ai_recommendations_write_own_or_staff" ON public.ai_recommendations
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_staff())
  WITH CHECK (user_id = auth.uid() OR public.is_staff());

CREATE INDEX idx_ai_recommendations_user ON public.ai_recommendations (user_id);
CREATE INDEX idx_ai_recommendations_product ON public.ai_recommendations (product_id);

-- ─────────────────────────────────────────────────────────────
-- analytics_events
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'page_view', 'product_view', 'search', 'add_to_cart', 'checkout_started',
    'payment_started', 'payment_success', 'order_created', 'order_completed',
    'recipe_view', 'ai_message', 'ai_recipe_request', 'ai_recommendation',
    'ai_product_click', 'voice_query'
  )),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analytics_events_insert" ON public.analytics_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (TRUE);

CREATE POLICY "analytics_events_select_staff" ON public.analytics_events
  FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE INDEX idx_analytics_events_type ON public.analytics_events (event_type, created_at DESC);
CREATE INDEX idx_analytics_events_created ON public.analytics_events (created_at DESC);
CREATE INDEX idx_analytics_events_user ON public.analytics_events (user_id);
CREATE INDEX idx_analytics_events_product ON public.analytics_events (product_id);

-- ─────────────────────────────────────────────────────────────
-- Grants
-- ─────────────────────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON public.categories, public.products, public.product_images,
  public.product_variants, public.ingredients, public.recipes,
  public.recipe_ingredients, public.reviews TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses, public.favorites,
  public.carts, public.cart_items, public.ai_conversations, public.ai_messages,
  public.ai_recommendations TO authenticated;
GRANT SELECT, UPDATE ON public.orders, public.order_items,
  public.order_status_history, public.payments TO authenticated;
GRANT INSERT ON public.analytics_events TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories, public.products,
  public.product_images, public.product_variants, public.ingredients,
  public.recipes, public.recipe_ingredients, public.recipe_sources,
  public.scrape_jobs, public.inventory_items, public.payment_attempts,
  public.orders, public.order_items, public.order_status_history,
  public.payments, public.reviews TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- updated_at triggers
-- ─────────────────────────────────────────────────────────────
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER product_variants_updated_at BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER ingredients_updated_at BEFORE UPDATE ON public.ingredients
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER inventory_items_updated_at BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER recipes_updated_at BEFORE UPDATE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER recipe_sources_updated_at BEFORE UPDATE ON public.recipe_sources
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER scrape_jobs_updated_at BEFORE UPDATE ON public.scrape_jobs
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER carts_updated_at BEFORE UPDATE ON public.carts
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER addresses_updated_at BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER ai_conversations_updated_at BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();