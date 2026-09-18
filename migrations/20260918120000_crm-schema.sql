-- Swahili Dishes — CRM / Lead-Generation schema
-- Leads, events, scoring, automation, opportunities, TV sessions.

-- ─────────────────────────────────────────────────────────────
-- leads
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  anonymous_id TEXT,
  name TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  location TEXT,
  source TEXT NOT NULL DEFAULT 'DIRECT'
    CHECK (source IN ('DIRECT','GOOGLE','INSTAGRAM','FACEBOOK','TIKTOK','WHATSAPP','YOUTUBE','TV','QR_CODE','REFERRAL','EMAIL','CAMPAIGN')),
  source_campaign TEXT,
  source_content TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lead_score INTEGER NOT NULL DEFAULT 0,
  lead_temperature TEXT NOT NULL DEFAULT 'COLD'
    CHECK (lead_temperature IN ('COLD','WARM','HOT')),
  status TEXT NOT NULL DEFAULT 'NEW'
    CHECK (status IN ('NEW','CONTACTED','QUALIFIED','INTERESTED','CONVERTED','LOST')),
  intent TEXT DEFAULT 'BROWSE'
    CHECK (intent IN ('BROWSE','RECIPE','PURCHASE','CATERING','RESELLER','PARTNERSHIP')),
  interests TEXT[] NOT NULL DEFAULT '{}',
  preferred_foods TEXT[] NOT NULL DEFAULT '{}',
  viewed_products UUID[] NOT NULL DEFAULT '{}',
  viewed_recipes UUID[] NOT NULL DEFAULT '{}',
  watched_videos UUID[] NOT NULL DEFAULT '{}',
  cart_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_orders INTEGER NOT NULL DEFAULT 0,
  total_spent NUMERIC(12,2) NOT NULL DEFAULT 0,
  catering_guest_count INTEGER,
  catering_event_type TEXT,
  catering_event_date TIMESTAMPTZ,
  catering_budget NUMERIC(12,2),
  catering_location TEXT,
  notes TEXT,
  assigned_admin UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ai_classification JSONB NOT NULL DEFAULT '{}',
  consent_marketing BOOLEAN NOT NULL DEFAULT FALSE,
  consent_whatsapp BOOLEAN NOT NULL DEFAULT FALSE,
  consent_email BOOLEAN NOT NULL DEFAULT FALSE,
  preferred_contact TEXT DEFAULT 'email'
    CHECK (preferred_contact IN ('email','phone','whatsapp','sms')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads_select_staff" ON public.leads
  FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY "leads_insert_anon" ON public.leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (TRUE);

CREATE POLICY "leads_update_staff" ON public.leads
  FOR UPDATE TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY "leads_delete_staff" ON public.leads
  FOR DELETE TO authenticated
  USING (public.is_staff());

CREATE INDEX idx_leads_user ON public.leads (user_id);
CREATE INDEX idx_leads_anonymous ON public.leads (anonymous_id);
CREATE INDEX idx_leads_email ON public.leads (email);
CREATE INDEX idx_leads_phone ON public.leads (phone);
CREATE INDEX idx_leads_status ON public.leads (status);
CREATE INDEX idx_leads_temperature ON public.leads (lead_temperature);
CREATE INDEX idx_leads_score ON public.leads (lead_score DESC);
CREATE INDEX idx_leads_source ON public.leads (source);
CREATE INDEX idx_leads_created ON public.leads (created_at DESC);
CREATE INDEX idx_leads_last_activity ON public.leads (last_activity_at DESC);

-- ─────────────────────────────────────────────────────────────
-- lead_events (activity timeline)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.lead_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  score_delta INTEGER NOT NULL DEFAULT 0,
  source TEXT,
  content_id UUID,
  content_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_events_select_staff" ON public.lead_events
  FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY "lead_events_insert_anon" ON public.lead_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (TRUE);

CREATE INDEX idx_lead_events_lead ON public.lead_events (lead_id, created_at DESC);
CREATE INDEX idx_lead_events_type ON public.lead_events (event_type);

-- ─────────────────────────────────────────────────────────────
-- lead_scoring_rules (configurable scoring)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.lead_scoring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL UNIQUE,
  score_value INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.lead_scoring_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_scoring_rules_read" ON public.lead_scoring_rules
  FOR SELECT TO anon, authenticated
  USING (TRUE);

CREATE POLICY "lead_scoring_rules_write_staff" ON public.lead_scoring_rules
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- Seed default scoring rules
INSERT INTO public.lead_scoring_rules (event_type, score_value, description) VALUES
  ('PAGE_VIEW', 1, 'Viewed a page'),
  ('PRODUCT_VIEW', 3, 'Viewed a product'),
  ('PRODUCT_VIEW_MULTI', 5, 'Multiple product views'),
  ('RECIPE_VIEW', 2, 'Viewed a recipe'),
  ('VIDEO_VIEW', 2, 'Watched a video'),
  ('SEARCH', 2, 'Performed a search'),
  ('AI_CHAT', 4, 'Started AI conversation'),
  ('AI_RECOMMENDATION', 3, 'Received AI recommendation'),
  ('RECIPE_DOWNLOAD', 5, 'Downloaded a recipe'),
  ('ADD_TO_CART', 10, 'Added item to cart'),
  ('REMOVE_FROM_CART', -2, 'Removed item from cart'),
  ('CHECKOUT_STARTED', 15, 'Started checkout'),
  ('CHECKOUT_ABANDONED', 12, 'Abandoned checkout'),
  ('PURCHASE_COMPLETED', 30, 'Completed purchase'),
  ('WHATSAPP_CLICK', 15, 'Clicked WhatsApp'),
  ('PHONE_CLICK', 10, 'Clicked phone number'),
  ('EMAIL_CLICK', 8, 'Clicked email link'),
  ('CATERING_REQUEST', 25, 'Requested catering'),
  ('NEWSLETTER_SIGNUP', 5, 'Signed up for newsletter'),
  ('LEAD_CAPTURED', 3, 'Provided contact info'),
  ('QR_SCAN', 5, 'Scanned QR code'),
  ('TV_SESSION', 3, 'Started TV session'),
  ('TV_CONTENT_VIEW', 2, 'Viewed content on TV'),
  ('TV_TO_PHONE_CONNECTION', 8, 'Connected TV to phone'),
  ('REPEATED_VISIT', 5, 'Returning visitor');

-- ─────────────────────────────────────────────────────────────
-- automation_rules
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_event TEXT NOT NULL,
  conditions JSONB NOT NULL DEFAULT '{}',
  actions JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  execution_count INTEGER NOT NULL DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "automation_rules_read" ON public.automation_rules
  FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY "automation_rules_write_staff" ON public.automation_rules
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- ─────────────────────────────────────────────────────────────
-- automation_runs (execution log)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  trigger_event TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING','RUNNING','SUCCESS','FAILED','CANCELLED')),
  result JSONB NOT NULL DEFAULT '{}',
  error TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "automation_runs_select_staff" ON public.automation_runs
  FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY "automation_runs_insert_anon" ON public.automation_runs
  FOR INSERT TO anon, authenticated
  WITH CHECK (TRUE);

CREATE INDEX idx_automation_runs_rule ON public.automation_runs (rule_id);
CREATE INDEX idx_automation_runs_lead ON public.automation_runs (lead_id);
CREATE INDEX idx_automation_runs_status ON public.automation_runs (status);

-- ─────────────────────────────────────────────────────────────
-- communication_consent
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.communication_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email','sms','whatsapp','push')),
  consented BOOLEAN NOT NULL DEFAULT FALSE,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (lead_id, channel)
);

ALTER TABLE public.communication_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "communication_consents_select_staff" ON public.communication_consents
  FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY "communication_consents_insert_anon" ON public.communication_consents
  FOR INSERT TO anon, authenticated
  WITH CHECK (TRUE);

-- ─────────────────────────────────────────────────────────────
-- message_logs
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email','sms','whatsapp','push')),
  template TEXT,
  subject TEXT,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'QUEUED'
    CHECK (status IN ('QUEUED','SENT','DELIVERED','READ','FAILED')),
  provider TEXT,
  provider_ref TEXT,
  error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ
);

ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "message_logs_select_staff" ON public.message_logs
  FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY "message_logs_insert_anon" ON public.message_logs
  FOR INSERT TO anon, authenticated
  WITH CHECK (TRUE);

CREATE INDEX idx_message_logs_lead ON public.message_logs (lead_id);
CREATE INDEX idx_message_logs_status ON public.message_logs (status);

-- ─────────────────────────────────────────────────────────────
-- opportunities (catering / high-value deals)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  value NUMERIC(12,2) NOT NULL DEFAULT 0,
  stage TEXT NOT NULL DEFAULT 'PROSPECTING'
    CHECK (stage IN ('PROSPECTING','QUALIFICATION','PROPOSAL','NEGOTIATION','CLOSED_WON','CLOSED_LOST')),
  probability INTEGER NOT NULL DEFAULT 10 CHECK (probability BETWEEN 0 AND 100),
  expected_close_date TIMESTAMPTZ,
  notes TEXT,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "opportunities_select_staff" ON public.opportunities
  FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY "opportunities_insert_staff" ON public.opportunities
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff());

CREATE POLICY "opportunities_update_staff" ON public.opportunities
  FOR UPDATE TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE INDEX idx_opportunities_lead ON public.opportunities (lead_id);
CREATE INDEX idx_opportunities_stage ON public.opportunities (stage);

-- ─────────────────────────────────────────────────────────────
-- tv_sessions / tv_pairings
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.tv_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  content_viewed JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.tv_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tv_sessions_insert_anon" ON public.tv_sessions
  FOR INSERT TO anon, authenticated
  WITH CHECK (TRUE);

CREATE POLICY "tv_sessions_select_staff" ON public.tv_sessions
  FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY "tv_sessions_update_staff" ON public.tv_sessions
  FOR UPDATE TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE INDEX idx_tv_sessions_device ON public.tv_sessions (device_id);
CREATE INDEX idx_tv_sessions_token ON public.tv_sessions (session_token);

CREATE TABLE public.tv_pairings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tv_session_id UUID NOT NULL REFERENCES public.tv_sessions(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  pairing_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  paired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.tv_pairings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tv_pairings_insert_anon" ON public.tv_pairings
  FOR INSERT TO anon, authenticated
  WITH CHECK (TRUE);

CREATE POLICY "tv_pairings_select_staff" ON public.tv_pairings
  FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY "tv_pairings_update_anon" ON public.tv_pairings
  FOR UPDATE TO anon, authenticated
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE INDEX idx_tv_pairings_token ON public.tv_pairings (pairing_token);

-- ─────────────────────────────────────────────────────────────
-- Lead scoring function
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.calculate_lead_temperature(p_score INTEGER)
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN p_score >= 51 THEN 'HOT'
    WHEN p_score >= 21 THEN 'WARM'
    ELSE 'COLD'
  END;
$$;

-- ─────────────────────────────────────────────────────────────
-- Trigger: update lead score + temperature on event insert
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_lead_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rule_score INTEGER;
  v_new_score INTEGER;
BEGIN
  -- Look up scoring rule
  SELECT score_value INTO v_rule_score
  FROM public.lead_scoring_rules
  WHERE event_type = NEW.event_type AND is_active = TRUE;

  IF v_rule_score IS NULL THEN
    v_rule_score := 0;
  END IF;

  NEW.score_delta := v_rule_score;

  -- Update lead score
  UPDATE public.leads
  SET lead_score = GREATEST(0, lead_score + v_rule_score),
      lead_temperature = public.calculate_lead_temperature(lead_score + v_rule_score),
      last_activity_at = NOW(),
      updated_at = NOW()
  WHERE id = NEW.lead_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_lead_event_scoring
  BEFORE INSERT ON public.lead_events
  FOR EACH ROW EXECUTE FUNCTION public.handle_lead_event();

-- ─────────────────────────────────────────────────────────────
-- Grants
-- ─────────────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT SELECT, INSERT ON public.lead_events TO authenticated;
GRANT SELECT, UPDATE ON public.lead_scoring_rules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_rules TO authenticated;
GRANT SELECT, INSERT ON public.automation_runs TO authenticated;
GRANT SELECT, INSERT ON public.communication_consents TO authenticated;
GRANT SELECT, INSERT ON public.message_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.opportunities TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.tv_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.tv_pairings TO authenticated;

GRANT INSERT ON public.leads TO anon;
GRANT INSERT ON public.lead_events TO anon;
GRANT INSERT ON public.communication_consents TO anon;
GRANT INSERT ON public.message_logs TO anon;
GRANT INSERT ON public.tv_sessions TO anon;
GRANT INSERT ON public.tv_pairings TO anon;

-- ─────────────────────────────────────────────────────────────
-- updated_at triggers
-- ─────────────────────────────────────────────────────────────
CREATE TRIGGER leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER lead_scoring_rules_updated_at BEFORE UPDATE ON public.lead_scoring_rules
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER automation_rules_updated_at BEFORE UPDATE ON public.automation_rules
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER opportunities_updated_at BEFORE UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
