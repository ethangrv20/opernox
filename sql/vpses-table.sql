-- ============================================================
-- vpses table — one VPS per user (multi-tenant automation)
-- ============================================================
create table if not exists public.vpses (
  id          uuid    default gen_random_uuid() primary key,
  user_id     uuid    not null references public.profiles(id) on delete cascade,
  interserver_order_id text,
  hostname    text,
  ip          text,
  status      text    not null default 'provisioning'
                  check (status in (
                    'provisioning','bootstrapping','active',
                    'suspended','terminated'
                  )),
  platform    text    default 'kvm',
  os          text    default 'windowsr2',
  slices      integer default 8,
  location    integer default 1,
  location_name text,
  rootpass_encrypted text,
  allocated_at  timestamptz,
  provisioned_at timestamptz,
  bootstrapped_at timestamptz,
  terminated_at timestamptz,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Index for fast lookups by user_id and status
create index if not exists vpses_user_id_idx on public.vpses(user_id);
create index if not exists vpses_status_idx on public.vpses(status);

-- RLS
alter table public.vpses enable row level security;

create policy "Users can view own VPS"
  on public.vpses for select
  using (auth.uid() = user_id);

create policy "Service role can do anything"
  on public.vpses for all
  using (true)
  with check (true);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger vpses_updated_at
  before update on public.vpses
  for each row execute function public.handle_updated_at();
