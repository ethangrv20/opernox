-- ============================================================
-- SEO / Brand Monitoring Tables
-- Opernox - monitor module
-- NOTE: user_id is text (not uuid) — matches Opernox accounts/vpses/x_connections pattern
-- ============================================================

-- monitor_keywords — keywords each client tracks
CREATE TABLE IF NOT EXISTS public.monitor_keywords (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  keyword text NOT NULL,
  target_url text,
  search_volume integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, keyword)
);
ALTER TABLE public.monitor_keywords ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients manage own monitor_keywords" ON public.monitor_keywords FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Service role can do everything on monitor_keywords" ON public.monitor_keywords FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_monitor_keywords_user_id ON public.monitor_keywords(user_id);

-- monitor_rankings — daily keyword position history
CREATE TABLE IF NOT EXISTS public.monitor_rankings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  keyword_id uuid REFERENCES public.monitor_keywords(id) ON DELETE CASCADE,
  keyword text NOT NULL,
  position integer,
  search_engine text DEFAULT 'google',
  searched_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.monitor_rankings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients manage own monitor_rankings" ON public.monitor_rankings FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Service role can do everything on monitor_rankings" ON public.monitor_rankings FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_monitor_rankings_user_id ON public.monitor_rankings(user_id);
CREATE INDEX IF NOT EXISTS idx_monitor_rankings_keyword_id ON public.monitor_rankings(keyword_id);

-- monitor_mentions — brand mentions across the web
CREATE TABLE IF NOT EXISTS public.monitor_mentions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  source text NOT NULL,
  source_url text,
  title text,
  snippet text,
  sentiment text DEFAULT 'neutral',
  found_at timestamptz NOT NULL DEFAULT now(),
  alert_sent boolean DEFAULT false
);
ALTER TABLE public.monitor_mentions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients manage own monitor_mentions" ON public.monitor_mentions FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Service role can do everything on monitor_mentions" ON public.monitor_mentions FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_monitor_mentions_user_id ON public.monitor_mentions(user_id);
CREATE INDEX IF NOT EXISTS idx_monitor_mentions_source ON public.monitor_mentions(source);

-- monitor_reviews — reviews from Google, Yelp, Trustpilot, G2
CREATE TABLE IF NOT EXISTS public.monitor_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  platform text NOT NULL,
  platform_review_id text,
  reviewer_name text,
  rating integer,
  review_text text,
  review_url text,
  reviewed_at timestamptz,
  response_sent boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.monitor_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients manage own monitor_reviews" ON public.monitor_reviews FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Service role can do everything on monitor_reviews" ON public.monitor_reviews FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_monitor_reviews_user_id ON public.monitor_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_monitor_reviews_platform ON public.monitor_reviews(platform);

-- monitor_competitors — competitors to track
CREATE TABLE IF NOT EXISTS public.monitor_competitors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  name text NOT NULL,
  domain text,
  social_handles jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.monitor_competitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients manage own monitor_competitors" ON public.monitor_competitors FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Service role can do everything on monitor_competitors" ON public.monitor_competitors FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_monitor_competitors_user_id ON public.monitor_competitors(user_id);
