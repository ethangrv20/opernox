-- ============================================
-- OPERNOX JOB QUEUE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- Jobs table: queues automation jobs for VPS agents
CREATE TABLE IF NOT EXISTS jobs (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  "platform" TEXT NOT NULL CHECK ("platform" IN ('x', 'linkedin', 'tiktok', 'instagram', 'heygen', 'ugc', 'outreach')),
  "job_type" TEXT NOT NULL,
  "payload" JSONB NOT NULL DEFAULT '{}',
  "status" TEXT NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  "result" JSONB,
  "error" TEXT,
  "vps_id" TEXT,
  "started_at" TIMESTAMPTZ,
  "completed_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_status_platform ON jobs(status, platform) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_jobs" ON jobs
  FOR ALL USING (user_id = auth.uid());

-- ============================================
-- X_CONNECTIONS -- stored Twitter OAuth tokens
-- ============================================
CREATE TABLE IF NOT EXISTS x_connections (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  "screen_name" TEXT,
  "oauth_token" TEXT,
  "oauth_token_secret" TEXT,
  "oauth_verifier" TEXT,
  "status" TEXT DEFAULT 'pending' CHECK ("status" IN ('pending', 'connected', 'disconnected', 'error')),
  "connected_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("user_id")
);

ALTER TABLE x_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_x_connection" ON x_connections
  FOR ALL USING (user_id = auth.uid());

-- ============================================
-- SCHEDULED_POSTS -- scheduled posts for all platforms
-- ============================================
CREATE TABLE IF NOT EXISTS scheduled_posts (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  "platform" TEXT NOT NULL CHECK ("platform" IN ('x', 'linkedin', 'tiktok', 'instagram', 'heygen', 'ugc')),
  "post_text" TEXT NOT NULL,
  "media_url" TEXT,
  "media_type" TEXT CHECK ("media_type" IN ('image', 'video', 'none')),
  "scheduled_for" TIMESTAMPTZ NOT NULL,
  "status" TEXT DEFAULT 'scheduled' CHECK ("status" IN ('scheduled', 'published', 'failed', 'cancelled')),
  "published_at" TIMESTAMPTZ,
  "external_id" TEXT,
  "error" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_scheduled_posts" ON scheduled_posts
  FOR ALL USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_for ON scheduled_posts(scheduled_for) WHERE status = 'scheduled';

-- ============================================
-- VPS_AGENTS -- track registered VPS agents
-- ============================================
CREATE TABLE IF NOT EXISTS vps_agents (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  "vps_name" TEXT NOT NULL,
  "vps_id" TEXT NOT NULL,
  "status" TEXT DEFAULT 'online' CHECK ("status" IN ('online', 'offline', 'busy')),
  "last_ping" TIMESTAMPTZ DEFAULT NOW(),
  "capabilities" JSONB DEFAULT '[]'::jsonb,
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE vps_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_vps_agents" ON vps_agents
  FOR ALL USING (user_id = auth.uid());
