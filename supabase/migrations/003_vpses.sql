-- ============================================================
-- vpses table — tracks each client's VPS instance
-- One VPS per client (Model B architecture)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.vpses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  interserver_order_id TEXT,
  hostname TEXT NOT NULL,
  ip TEXT,
  status TEXT NOT NULL DEFAULT 'provisioning' CHECK (status IN (
    'provisioning',   -- VPS ordered, waiting for boot
    'booting',        -- VPS is online, running bootstrap
    'installing',     -- Bootstrap done, installing AdsPower
    'ready',          -- Fully configured and operational
    'stopped',        -- VPS powered off
    'terminated'      -- VPS destroyed/cancelled
  )),
  platform TEXT NOT NULL DEFAULT 'kvm',           -- kvm, openvz, etc.
  os TEXT NOT NULL DEFAULT 'windowsr2',            -- windowsr2, windows2019, linux, etc.
  slices INTEGER NOT NULL DEFAULT 8,              -- number of slices (8 = $40/mo)
  location INTEGER NOT NULL DEFAULT 1,           -- Interserver datacenter: 1=NJ, 2=LA, 3=Dallas
  location_name TEXT DEFAULT 'Secaucus NJ',
  rootpass_encrypted TEXT,                        -- AES-encrypted VPS root password (AES-256-GCM)
  adspower_profile_id TEXT,                       -- AdsPower browser profile ID
  ads_power_config JSONB,                         -- Proxy + browser config for this VPS
  provisioned_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  terminated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER vpses_updated_at
  BEFORE UPDATE ON public.vpses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS: clients can only see their own VPS
ALTER TABLE public.vpses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own VPS" ON public.vpses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Clients can insert own VPS" ON public.vpses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Clients can update own VPS" ON public.vpses
  FOR UPDATE USING (auth.uid() = user_id);

-- Service role can do everything (for job-agent + provisioner)
CREATE POLICY "Service role can do everything on vpses" ON public.vpses
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- profiles table — add interserver_customer_id if needed
-- (Optional: track Interserver customer ID for billing lookups)
-- ============================================================
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS interserver_customer_id TEXT;

-- ============================================================
-- Indexes for common queries
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_vpses_user_id ON public.vpses(user_id);
CREATE INDEX IF NOT EXISTS idx_vpses_status ON public.vpses(status);
CREATE INDEX IF NOT EXISTS idx_vpses_interserver_order_id ON public.vpses(interserver_order_id);

-- ============================================================
-- NOTE: You must also create the Interserver API credentials
-- in your Supabase project secrets / Edge Function env:
--   INTERSERVER_USER=ethangrv@gmail.com
--   INTERSERVER_PASS=2dcebtqS!
--   INTERSERVER_WSDL=https://my.interserver.net/api.php?wsdl
-- ============================================================
