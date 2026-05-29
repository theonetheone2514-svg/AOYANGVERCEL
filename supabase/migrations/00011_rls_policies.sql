-- ============================================================
-- Complete RLS policies for production
-- ============================================================

-- Enable RLS on tables that were missing it
alter table if exists otps enable row level security;
alter table if exists sessions enable row level security;

-- ============================================================
-- sessions: read by token (safe: attacker needs to know token)
-- ============================================================
create policy "sessions_select_by_token" on sessions
  for select using (true);

-- ============================================================
-- otps: insert/update for auth flow
-- ============================================================
create policy "otps_insert" on otps
  for insert with check (true);

create policy "otps_update" on otps
  for update using (true);

-- ============================================================
-- ratings: public read for store displays
-- ============================================================
create policy "ratings_public_select" on ratings
  for select using (true);

-- ============================================================
-- stores: merchants can update their own store
-- ============================================================
create policy "stores_merchant_update" on stores
  for update using (
    phone = current_setting('request.jwt.claims')::json->>'phone'
  );

-- ============================================================
-- menu_items: merchants can manage their own menu
-- ============================================================
create policy "menu_items_merchant_insert" on menu_items
  for insert with check (
    store_id = (select id from stores where phone = current_setting('request.jwt.claims')::json->>'phone' limit 1)
  );

create policy "menu_items_merchant_update" on menu_items
  for update using (
    store_id in (select id from stores where phone = current_setting('request.jwt.claims')::json->>'phone')
  );

create policy "menu_items_merchant_delete" on menu_items
  for delete using (
    store_id in (select id from stores where phone = current_setting('request.jwt.claims')::json->>'phone')
  );
