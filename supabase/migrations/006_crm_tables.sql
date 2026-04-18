-- CRM Tables Migration
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/ujdegmhsvwymxzezwwna/sql
-- These tables are NOT part of the standard Opernox schema — they're new for CRM

BEGIN;

-- Enable UUID extension (may already be enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- CRM CONTACTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.crm_contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company_name TEXT,
  company_id UUID,
  website TEXT,
  industry TEXT,
  source TEXT DEFAULT 'manual' CHECK (source IN ('scrape', 'manual', 'api', 'outreach')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'active', 'converted', 'churned')),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS crm_contacts_user_id_idx ON public.crm_contacts(user_id);
CREATE INDEX IF NOT EXISTS crm_contacts_user_status_idx ON public.crm_contacts(user_id, status);
CREATE INDEX IF NOT EXISTS crm_contacts_user_email_idx ON public.crm_contacts(user_id, email);

-- ============================================================
-- CRM COMPANIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.crm_companies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  domain TEXT,
  industry TEXT,
  size TEXT CHECK (size IN ('startup', 'smb', 'mid', 'enterprise')),
  website TEXT,
  social_handles JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS crm_companies_user_id_idx ON public.crm_companies(user_id);
CREATE INDEX IF NOT EXISTS crm_companies_user_domain_idx ON public.crm_companies(user_id, domain);

-- ============================================================
-- CRM DEALS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.crm_deals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  value NUMERIC(12,2),
  stage TEXT DEFAULT 'lead' CHECK (stage IN ('lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  contact_id UUID,
  company_id UUID,
  expected_close DATE,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT crm_deals_contact_fk FOREIGN KEY (contact_id) REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  CONSTRAINT crm_deals_company_fk FOREIGN KEY (company_id) REFERENCES public.crm_companies(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS crm_deals_user_id_idx ON public.crm_deals(user_id);
CREATE INDEX IF NOT EXISTS crm_deals_user_stage_idx ON public.crm_deals(user_id, stage);

-- ============================================================
-- CRM ACTIVITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.crm_activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'scrape_run', 'post_published', 'dm_sent', 'dm_reply',
    'contact_created', 'deal_created', 'deal_stage_changed',
    'note_added', 'task_completed', 'api_import'
  )),
  contact_id UUID,
  company_id UUID,
  deal_id UUID,
  actor TEXT DEFAULT 'system' CHECK (actor IN ('client', 'system', 'api')),
  summary TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT crm_activities_contact_fk FOREIGN KEY (contact_id) REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  CONSTRAINT crm_activities_company_fk FOREIGN KEY (company_id) REFERENCES public.crm_companies(id) ON DELETE SET NULL,
  CONSTRAINT crm_activities_deal_fk FOREIGN KEY (deal_id) REFERENCES public.crm_deals(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS crm_activities_user_created_idx ON public.crm_activities(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS crm_activities_user_contact_idx ON public.crm_activities(user_id, contact_id);
CREATE INDEX IF NOT EXISTS crm_activities_user_type_idx ON public.crm_activities(user_id, type);

-- ============================================================
-- CRM TASKS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.crm_tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  contact_id UUID,
  company_id UUID,
  deal_id UUID,
  due_at TIMESTAMPTZ,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT crm_tasks_contact_fk FOREIGN KEY (contact_id) REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  CONSTRAINT crm_tasks_company_fk FOREIGN KEY (company_id) REFERENCES public.crm_companies(id) ON DELETE SET NULL,
  CONSTRAINT crm_tasks_deal_fk FOREIGN KEY (deal_id) REFERENCES public.crm_deals(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS crm_tasks_user_completed_due_idx ON public.crm_tasks(user_id, completed, due_at);

-- ============================================================
-- CRM NOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.crm_notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID,
  company_id UUID,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT crm_notes_contact_fk FOREIGN KEY (contact_id) REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  CONSTRAINT crm_notes_company_fk FOREIGN KEY (company_id) REFERENCES public.crm_companies(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS crm_notes_user_contact_idx ON public.crm_notes(user_id, contact_id);
CREATE INDEX IF NOT EXISTS crm_notes_user_company_idx ON public.crm_notes(user_id, company_id);

-- ============================================================
-- UPDATED_AT TRIGGER (auto-set updated_at on row update)
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS crm_contacts_updated_at ON public.crm_contacts;
CREATE TRIGGER crm_contacts_updated_at BEFORE UPDATE ON public.crm_contacts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS crm_companies_updated_at ON public.crm_companies;
CREATE TRIGGER crm_companies_updated_at BEFORE UPDATE ON public.crm_companies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS crm_deals_updated_at ON public.crm_deals;
CREATE TRIGGER crm_deals_updated_at BEFORE UPDATE ON public.crm_deals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS crm_tasks_updated_at ON public.crm_tasks;
CREATE TRIGGER crm_tasks_updated_at BEFORE UPDATE ON public.crm_tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMIT;
