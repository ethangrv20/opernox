-- Add payment_status to profiles table
-- Tracks wire payment lifecycle: pending_wire → paid → vps_approved → vps_active

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending_wire'
CHECK (payment_status IN ('pending_wire', 'paid', 'vps_approved', 'vps_active'));

-- Add business_name if it doesn't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS business_name TEXT;

-- Add interserver_customer_id for reference
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS interserver_customer_id TEXT;

-- Add wire_notes for Ethan's internal notes
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS wire_notes TEXT;
