create extension if not exists pgcrypto;

create table public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  primary_email text not null unique,
  google_id text unique,
  college_email text unique,
  is_verified boolean not null default false,
  password_hash text,
  role text not null default 'student' check (role in ('student', 'admin')),
  college text not null,
  rating_avg numeric not null default 0,
  rating_count integer not null default 0,
  xp integer not null default 0,
  badges text[] not null default '{}',
  streak integer not null default 0,
  leaderboard_opt_in boolean not null default false,
  last_activity_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('gig', 'rental')),
  icon text,
  unique (name, type)
);

create table public.gigs (
  id uuid primary key default gen_random_uuid(),
  poster_id uuid not null references public.users(id) on delete cascade,
  accepted_by_id uuid references public.users(id) on delete set null,
  title text not null,
  description text not null,
  price numeric not null check (price >= 0),
  category text not null,
  location_details text not null default '',
  requirement_notes text not null default '',
  search_embedding double precision[],
  status text not null default 'open' check (status in ('open', 'accepted', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.rentals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text not null,
  price_per_day numeric not null check (price_per_day >= 0),
  category text not null,
  specs jsonb not null default '{"brand":"","model":"","condition":"good","includesAccessories":[]}'::jsonb,
  pickup_location text not null default '',
  availability_notes text not null default '',
  search_embedding double precision[],
  status text not null default 'available' check (status in ('available', 'rented', 'maintenance')),
  availability_calendar text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('gig', 'rental')),
  gig_id uuid references public.gigs(id) on delete set null,
  rental_id uuid references public.rentals(id) on delete set null,
  buyer_id uuid not null references public.users(id) on delete restrict,
  seller_id uuid not null references public.users(id) on delete restrict,
  amount numeric not null check (amount >= 0),
  status text not null default 'pending' check (status in ('pending', 'held_in_escrow', 'completed', 'cancelled')),
  rental_start_date timestamptz,
  rental_end_date timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((type = 'gig' and gig_id is not null and rental_id is null) or (type = 'rental' and rental_id is not null and gig_id is null))
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.users(id) on delete cascade,
  receiver_id uuid not null references public.users(id) on delete cascade,
  body text not null,
  read boolean not null default false,
  sent_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('gig_accepted', 'gig_completed', 'rental_booked', 'rental_returned', 'new_message', 'new_rating', 'system')),
  payload jsonb not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  rater_id uuid not null references public.users(id) on delete cascade,
  ratee_id uuid not null references public.users(id) on delete cascade,
  stars integer not null check (stars between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create table public.otp_verifications (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  otp_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0 check (attempts between 0 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index gigs_status_category_idx on public.gigs (status, category);
create index gigs_poster_id_idx on public.gigs (poster_id);
create index rentals_status_category_idx on public.rentals (status, category);
create index rentals_owner_id_idx on public.rentals (owner_id);
create index transactions_buyer_id_idx on public.transactions (buyer_id);
create index transactions_seller_id_idx on public.transactions (seller_id);
create index messages_conversation_idx on public.messages (sender_id, receiver_id, sent_at desc);
create index notifications_user_read_idx on public.notifications (user_id, read, created_at desc);
create index ratings_ratee_id_idx on public.ratings (ratee_id);
create index otp_verifications_expires_at_idx on public.otp_verifications (expires_at);
