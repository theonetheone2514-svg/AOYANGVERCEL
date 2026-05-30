-- ============================================================
-- Public read policies for tables that need client-side SELECT
-- API routes use getSupabaseAdmin() (service_role) for writes.
-- Client components use anon key for reads only.
-- ============================================================

drop policy if exists "stores_public_select" on stores;
create policy "stores_public_select" on stores
  for select using (true);

drop policy if exists "menu_items_public_select" on menu_items;
create policy "menu_items_public_select" on menu_items
  for select using (true);

drop policy if exists "zones_public_select" on zones;
create policy "zones_public_select" on zones
  for select using (true);

drop policy if exists "settings_public_select" on settings;
create policy "settings_public_select" on settings
  for select using (true);

drop policy if exists "customer_locations_public_select" on customer_locations;
create policy "customer_locations_public_select" on customer_locations
  for select using (customer_id = auth.uid());

drop policy if exists "order_items_public_select" on order_items;
create policy "order_items_public_select" on order_items
  for select using (true);
