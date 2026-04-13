-- ============================================
-- OPERNOX JOB QUEUE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- Jobs table: queues automation jobs for VPS agents
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('x', 'linkedin', 'tiktok', 'instagram', 'heygen', 'ugc', 'outreach')),
  job_type TEXT NOT NULL, -- e.g. 'post', 'article', 'dm', 'generate_video', 'scrape_leads'
  payload JSONB NOT NULL DEFAULT '{}', -- job-specific data (post text, target ids, etc.)
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  result JSONB, -- execution result data
  error TEXT, -- error message if failed
  vps_id TEXT, -- which VPS picked up this job
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for polling: find pending jobs for a user's VPS
CREATE INDEX IF NOT EXISTS idx_jobs_status_platform ON jobs(status, platform) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);

-- RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Users can only see jobs for their own account
CREATE POLICY "users_own_jobs" ON jobs
  FOR ALL USING (user_id = auth.uid());

-- VPS agent can update jobs (via service role, not anon key)
-- This is handled by the agent using the service role key

-- Function: mark job as running
CREATE OR REPLACE FUNCTION mark_job_running(job_uuid UUID, vps TEXT)
RETURNS jobs AS $$
  UPDATE jobs SET status = 'running', vps_id = vps, started_at = NOW(), updated_at = NOW()
  WHERE id = job_uuid AND status = 'pending'
  RETURNING *;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: mark job completed
CREATE OR REPLACE FUNCTION mark_job_completed(job_uuid UUID, result_data JSONB)
RETURNS jobs AS $$
  UPDATE jobs SET status = 'completed', result = result_data, completed_at = NOW(), updated_at = NOW()
  WHERE id = job_uuid AND status = 'running'
  RETURNING *;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: mark job failed
CREATE OR REPLACE FUNCTION mark_job_failed(job_uuid UUID, error_message TEXT)
RETURNS jobs AS $$
  UPDATE jobs SET status = 'failed', error = error_message, completed_at = NOW(), updated_at = NOW()
  WHERE id = job_uuid AND status = 'running'
  RETURNING *;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- X_CONNECTIONS — stored Twitter OAuth tokens
-- ============================================
CREATE TABLE IF NOT EXISTS x_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  screen_name TEXT,
  oauth_token TEXT,
  oauth_token_secret TEXT,
  oauth_verifier TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'connected', 'disconnected', 'error')),
  connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE x_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_x_connection" ON x_connections
  FOR ALL USING (user_id = auth.uid());

-- ============================================
-- SCHEDULED_POSTS — scheduled X/LinkedIn posts
-- ============================================
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('x', 'linkedin')),
  post_text TEXT NOT NULL,
  media_url TEXT, -- URL to image/video if attached
  media_type TEXT CHECK (media_type IN ('image', 'video', 'none')),
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'published', 'failed', 'cancelled')),
  published_at TIMESTAMPTZ,
  external_id TEXT, -- tweet/post ID after publishing
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_scheduled_posts" ON scheduled_posts
  FOR ALL USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_for ON scheduled_posts(scheduled_for) WHERE status = 'scheduled';

-- ============================================
-- VPS_REGISTRATIONS — track registered VPS agents
-- ============================================
CREATE TABLE IF NOT EXISTS vps_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vps_name TEXT NOT NULL,
  vps_id TEXT NOT NULL, -- unique identifier for this VPS
  status TEXT DEFAULT 'online' CHECK (status IN ('online', 'offline', 'busy')),
  last_ping TIMESTAMPTZ DEFAULT NOW(),
  capabilities JSONB DEFAULT '[]', -- what this VPS can run
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE vps_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_vps_agents" ON vps_agents
  FOR ALL USING (user_id = auth.uid());
