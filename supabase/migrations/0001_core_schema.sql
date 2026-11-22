-- CRUNCH core schema (Supabase / Postgres). Security is enforced here with RLS, never in the client.
-- Writes that move money or grant access (purchases, entitlements, ratings, roles) are server-only.

create extension if not exists pg_trgm;

create type user_role as enum ('user','moderator','admin');
create type recipe_status as enum ('draft','published','unpublished','removed');
create type recipe_visibility as enum ('private','public','marketplace');
create type payment_status as enum ('pending','paid','refund_requested','refunded','failed');

-- Profiles mirror auth.users; role and age are written only by server code (service role).
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (username ~ '^[a-z0-9_]{3,30}$'),
  profile_image text,
  bio text default '' check (length(bio) <= 500),
  birth_year int check (birth_year between 1900 and 2100),
  role user_role not null default 'user',
  preferences jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Allergy data is sensitive: kept in its own table, owner-only, never joined into public views.
create table private_health (
  user_id uuid primary key references profiles(id) on delete cascade,
  allergies text[] not null default '{}',
  diet text[] not null default '{}'
);

create table ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null,
  description text default '',
  flavor_profile jsonb not null default '{}',
  texture text[] not null default '{}',
  allergens text[] not null default '{}',
  nutrition jsonb,
  image text,
  created_by uuid references profiles(id),
  approved boolean not null default true
);
create index ingredients_name_trgm on ingredients using gin (name gin_trgm_ops);

create table recipes (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references profiles(id) on delete cascade,
  title text not null check (length(title) between 3 and 120),
  description text not null default '',
  image text,
  price_cents int not null default 0 check (price_cents between 0 and 5000),
  rating numeric(3,2) not null default 0,
  rating_count int not null default 0,
  visibility recipe_visibility not null default 'private',
  status recipe_status not null default 'draft',
  source text not null default 'manual' check (source in ('manual','ai','combination','import')),
  meta jsonb not null default '{}',  -- cuisine, meal, times, servings, difficulty, diet, allergens, nutrition
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index recipes_public_idx on recipes (status, visibility, created_at desc);
create index recipes_creator_idx on recipes (creator_id, status);
create index recipes_title_trgm on recipes using gin (title gin_trgm_ops);

-- Full recipe body. For paid recipes this is readable only by creator, buyers and admins.
create table recipe_content (
  recipe_id uuid primary key references recipes(id) on delete cascade,
  ingredients jsonb not null default '[]',
  instructions jsonb not null default '[]'
);

create table combinations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null default 'Untitled combination',
  ingredients jsonb not null default '[]',
  notes text not null default '',
  generated_recipes jsonb not null default '[]',
  created_at timestamptz not null default now()
);
create index combinations_user_idx on combinations (user_id, created_at desc);

create table purchases (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references profiles(id),
  recipe_id uuid not null references recipes(id),
  transaction_id text unique,
  amount_cents int not null,
  payment_status payment_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (buyer_id, recipe_id)
);

create table collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null, description text default '', image text
);
create table collection_recipes (
  collection_id uuid references collections(id) on delete cascade,
  recipe_id uuid references recipes(id) on delete cascade,
  position int not null default 0,
  primary key (collection_id, recipe_id)
);

create table posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  content text not null check (length(content) <= 2000),
  images text[] not null default '{}',
  recipe_id uuid references recipes(id) on delete set null,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index posts_feed_idx on posts (created_at desc) where not hidden;

create table comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  parent_id uuid references comments(id) on delete cascade,
  content text not null check (length(content) <= 1000),
  created_at timestamptz not null default now()
);
create index comments_post_idx on comments (post_id, created_at);

create table likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  target_id uuid not null,
  target_type text not null check (target_type in ('post','comment','recipe','review')),
  unique (user_id, target_id, target_type)
);
create table follows (
  follower_id uuid references profiles(id) on delete cascade,
  following_id uuid references profiles(id) on delete cascade,
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
create table blocks (
  blocker_id uuid references profiles(id) on delete cascade,
  blocked_id uuid references profiles(id) on delete cascade,
  primary key (blocker_id, blocked_id)
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  recipe_id uuid not null references recipes(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  content text not null default '' check (length(content) <= 2000),
  verified_purchase boolean not null default false, -- set by trigger, never by client
  created_at timestamptz not null default now(),
  unique (user_id, recipe_id)
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null, content text not null, read_status boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on notifications (user_id, read_status, created_at desc);

create table shopping_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null, items jsonb not null default '[]'
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  target_type text not null check (target_type in ('recipe','creator','post','review','comment','copyright')),
  target_id uuid not null, reason text not null check (length(reason) <= 1000),
  status text not null default 'open' check (status in ('open','actioned','dismissed')),
  created_at timestamptz not null default now()
);

create table recipe_notes (  -- private cookbook notes/status; owner-only
  user_id uuid references profiles(id) on delete cascade,
  recipe_id uuid references recipes(id) on delete cascade,
  note text default '', cook_status text check (cook_status in ('want_to_try','planned','cooked','favorite')),
  saved boolean not null default false,
  primary key (user_id, recipe_id)
);

create table ai_usage (
  id bigserial primary key,
  user_id uuid references profiles(id) on delete set null,
  function_name text not null, tokens_in int default 0, tokens_out int default 0,
  cost_micros bigint default 0, created_at timestamptz not null default now()
);

-- ---------- helpers ----------
create function is_staff() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role in ('moderator','admin'));
$$;
create function is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;
create function owns_recipe(rid uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from purchases where buyer_id = auth.uid() and recipe_id = rid and payment_status = 'paid');
$$;

-- verified_purchase and rating aggregates are computed, not client-supplied
create function review_before() returns trigger language plpgsql security definer set search_path = public as $$
declare p int; c uuid;
begin
  select price_cents, creator_id into p, c from recipes where id = new.recipe_id;
  if c = new.user_id then raise exception 'creators cannot review their own recipe'; end if;
  new.verified_purchase := exists (select 1 from purchases where buyer_id = new.user_id and recipe_id = new.recipe_id and payment_status = 'paid');
  if p > 0 and not new.verified_purchase then raise exception 'only buyers can review paid recipes'; end if;
  return new;
end $$;
create trigger reviews_before before insert or update on reviews for each row execute function review_before();

create function review_after() returns trigger language plpgsql security definer set search_path = public as $$
declare rid uuid := coalesce(new.recipe_id, old.recipe_id);
begin
  update recipes set rating = coalesce((select round(avg(rating),2) from reviews where recipe_id = rid),0),
                     rating_count = (select count(*) from reviews where recipe_id = rid) where id = rid;
  return null;
end $$;
create trigger reviews_after after insert or update or delete on reviews for each row execute function review_after();

-- block privilege escalation: role/birth_year changes only via service role
create function profile_guard() returns trigger language plpgsql as $$
begin
  if auth.uid() is not null and (new.role is distinct from old.role or new.birth_year is distinct from old.birth_year) and not is_admin() then
    raise exception 'role and birth_year cannot be changed by the client';
  end if;
  return new;
end $$;
create trigger profiles_guard before update on profiles for each row execute function profile_guard();

-- ---------- row level security ----------
do $$ declare t text; begin
  for t in select unnest(array['profiles','private_health','ingredients','recipes','recipe_content','combinations','purchases',
    'collections','collection_recipes','posts','comments','likes','follows','blocks','reviews','notifications','shopping_lists',
    'reports','recipe_notes','ai_usage']) loop
    execute format('alter table %I enable row level security', t);
  end loop; end $$;

create policy profiles_read on profiles for select using (true);
create policy profiles_insert on profiles for insert with check (id = auth.uid() and role = 'user');
create policy profiles_update on profiles for update using (id = auth.uid() or is_admin());
create policy health_owner on private_health for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy ing_read on ingredients for select using (approved or created_by = auth.uid() or is_staff());
create policy ing_insert on ingredients for insert with check (created_by = auth.uid() and approved = false);
create policy ing_staff on ingredients for all using (is_staff());

create policy recipes_read on recipes for select using (
  (status = 'published' and visibility in ('public','marketplace')) or creator_id = auth.uid() or is_staff());
create policy recipes_insert on recipes for insert with check (creator_id = auth.uid() and rating = 0 and rating_count = 0);
create policy recipes_update on recipes for update using (creator_id = auth.uid() or is_staff())
  with check (creator_id = auth.uid() or is_staff());
create policy recipes_delete on recipes for delete using (creator_id = auth.uid() or is_admin());

-- the gate: free published recipes are public; paid ones need purchase/ownership
create policy content_read on recipe_content for select using (
  exists (select 1 from recipes r where r.id = recipe_id and (
    r.creator_id = auth.uid() or is_staff()
    or (r.status = 'published' and r.price_cents = 0)
    or owns_recipe(r.id))));
create policy content_write on recipe_content for all
  using (exists (select 1 from recipes r where r.id = recipe_id and r.creator_id = auth.uid()))
  with check (exists (select 1 from recipes r where r.id = recipe_id and r.creator_id = auth.uid()));

create policy combos_owner on combinations for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy purchases_read on purchases for select using (buyer_id = auth.uid() or is_admin()); -- no write policy: server only
create policy coll_owner on collections for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy collr_owner on collection_recipes for all
  using (exists (select 1 from collections c where c.id = collection_id and c.user_id = auth.uid()))
  with check (exists (select 1 from collections c where c.id = collection_id and c.user_id = auth.uid()));

create policy posts_read on posts for select using ((not hidden
  and not exists (select 1 from blocks b where b.blocker_id = posts.user_id and b.blocked_id = auth.uid())) or user_id = auth.uid() or is_staff());
create policy posts_write on posts for insert with check (user_id = auth.uid() and hidden = false);
create policy posts_update on posts for update using (user_id = auth.uid() or is_staff());
create policy posts_delete on posts for delete using (user_id = auth.uid() or is_staff());

create policy comments_read on comments for select using (true);
create policy comments_write on comments for insert with check (user_id = auth.uid());
create policy comments_delete on comments for delete using (user_id = auth.uid() or is_staff());
create policy likes_read on likes for select using (true);
create policy likes_own on likes for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy follows_read on follows for select using (true);
create policy follows_own on follows for all using (follower_id = auth.uid()) with check (follower_id = auth.uid());
create policy blocks_own on blocks for all using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

create policy reviews_read on reviews for select using (true);
create policy reviews_insert on reviews for insert with check (user_id = auth.uid());
create policy reviews_update on reviews for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy reviews_delete on reviews for delete using (user_id = auth.uid() or is_staff());

create policy notif_owner on notifications for select using (user_id = auth.uid());
create policy notif_mark on notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy lists_owner on shopping_lists for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy reports_create on reports for insert with check (reporter_id = auth.uid());
create policy reports_read on reports for select using (reporter_id = auth.uid() or is_staff());
create policy reports_staff on reports for update using (is_staff());
create policy notes_owner on recipe_notes for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy usage_read on ai_usage for select using (user_id = auth.uid() or is_admin()); -- inserts: service role only
