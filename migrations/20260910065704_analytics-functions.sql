-- Swahili Dishes — analytics RPC functions
-- SECURITY DEFINER; all callers must pass is_staff().

-- ─────────────────────────────────────────────────────────────
-- dashboard_stats(p_days) — KPI aggregates + time series
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.dashboard_stats(p_days INTEGER DEFAULT 30)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_today_start TIMESTAMPTZ := date_trunc('day', NOW());
  v_yesterday_start TIMESTAMPTZ := v_today_start - INTERVAL '1 day';
  v_result JSONB;
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  WITH today_totals AS (
    SELECT
      COALESCE(SUM(total), 0)::NUMERIC(12,2) AS revenue,
      COUNT(*)::BIGINT AS orders,
      COUNT(DISTINCT user_id)::BIGINT AS customers,
      CASE WHEN COUNT(*) > 0 THEN (SUM(total) / COUNT(*))::NUMERIC(12,2) ELSE 0 END AS aov
    FROM public.orders
    WHERE status NOT IN ('CANCELLED', 'REFUNDED')
      AND created_at >= v_today_start
      AND created_at < v_today_start + INTERVAL '1 day'
  ),
  prev_totals AS (
    SELECT
      COALESCE(SUM(total), 0)::NUMERIC(12,2) AS revenue,
      COUNT(*)::BIGINT AS orders,
      COUNT(DISTINCT user_id)::BIGINT AS customers,
      CASE WHEN COUNT(*) > 0 THEN (SUM(total) / COUNT(*))::NUMERIC(12,2) ELSE 0 END AS aov
    FROM public.orders
    WHERE status NOT IN ('CANCELLED', 'REFUNDED')
      AND created_at >= v_yesterday_start
      AND created_at < v_today_start
  ),
  sales_series AS (
    SELECT
      gs.day,
      COALESCE((SELECT SUM(o.total) FROM public.orders o
                WHERE o.status NOT IN ('CANCELLED', 'REFUNDED')
                  AND o.created_at >= gs.day
                  AND o.created_at < gs.day + INTERVAL '1 day'), 0)::NUMERIC(12,2) AS revenue,
      (SELECT COUNT(*) FROM public.orders o
        WHERE o.status NOT IN ('CANCELLED', 'REFUNDED')
          AND o.created_at >= gs.day
          AND o.created_at < gs.day + INTERVAL '1 day')::BIGINT AS orders,
      (SELECT COUNT(DISTINCT o.user_id) FROM public.orders o
        WHERE o.status NOT IN ('CANCELLED', 'REFUNDED')
          AND o.user_id IS NOT NULL
          AND o.created_at >= gs.day
          AND o.created_at < gs.day + INTERVAL '1 day')::BIGINT AS customers
    FROM generate_series(date_trunc('day', NOW())::date - (p_days - 1), date_trunc('day', NOW())::date, '1 day') AS gs(day)
  )
  SELECT jsonb_build_object(
    'currency', 'KES',
    'today', jsonb_build_object(
      'revenue', (SELECT revenue FROM today_totals),
      'orders', (SELECT orders FROM today_totals),
      'customers', (SELECT customers FROM today_totals),
      'aov', (SELECT aov FROM today_totals)
    ),
    'deltas', jsonb_build_object(
      'revenue', (SELECT CASE WHEN t.revenue = 0 THEN 0
                              ELSE ((t.revenue - p.revenue) / t.revenue) * 100 END::NUMERIC(8,2) FROM today_totals t, prev_totals p),
      'orders', (SELECT CASE WHEN t.orders = 0 THEN 0
                             ELSE ((t.orders - p.orders) / t.orders) * 100 END::NUMERIC(8,2) FROM today_totals t, prev_totals p),
      'customers', (SELECT CASE WHEN t.customers = 0 THEN 0
                                ELSE ((t.customers - p.customers) / t.customers) * 100 END::NUMERIC(8,2) FROM today_totals t, prev_totals p),
      'aov', (SELECT CASE WHEN t.aov = 0 THEN 0
                          ELSE ((t.aov - p.aov) / t.aov) * 100 END::NUMERIC(8,2) FROM today_totals t, prev_totals p)
    ),
    'revenue_series', jsonb_agg(jsonb_build_object('date', to_char(day, 'YYYY-MM-DD'), 'value', revenue)
      ORDER BY day),
    'orders_series', jsonb_agg(jsonb_build_object('date', to_char(day, 'YYYY-MM-DD'), 'value', orders)
      ORDER BY day),
    'customers_series', jsonb_agg(jsonb_build_object('date', to_char(day, 'YYYY-MM-DD'), 'value', customers)
      ORDER BY day)
  ) INTO v_result
  FROM sales_series;

  RETURN v_result;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- top_products(p_days, p_limit) — best selling dishes
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.top_products(p_days INTEGER DEFAULT 30, p_limit INTEGER DEFAULT 8)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE v_result JSONB;
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  SELECT jsonb_agg(row)
  INTO v_result
  FROM (
    SELECT jsonb_build_object(
      'product_id', oi.product_id,
      'name', oi.product_name,
      'quantity', SUM(oi.quantity),
      'revenue', SUM(oi.quantity * oi.unit_price)
    ) AS row
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE o.status NOT IN ('CANCELLED', 'REFUNDED')
      AND o.created_at >= date_trunc('day', NOW()) - (p_days - 1) * INTERVAL '1 day'
    GROUP BY oi.product_id, oi.product_name
    ORDER BY SUM(oi.quantity * oi.unit_price) DESC
    LIMIT p_limit
  ) t;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- order_status_counts() — distribution of order statuses
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.order_status_counts()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE v_result JSONB;
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  SELECT jsonb_agg(jsonb_build_object('status', status, 'count', cnt))
  INTO v_result
  FROM (SELECT status, COUNT(*) AS cnt FROM public.orders GROUP BY status) t;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- Users: grant execute
-- ─────────────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION public.dashboard_stats(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.top_products(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.order_status_counts() TO authenticated;