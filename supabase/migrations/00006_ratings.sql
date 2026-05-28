-- Ratings / Reviews
create table if not exists ratings (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  customer_id uuid references customers(id),
  store_id text references stores(id),
  rating int not null check (rating >= 1 and rating <= 5),
  review text,
  created_at timestamptz default now()
);

create index if not exists idx_ratings_store on ratings(store_id);
alter table ratings enable row level security;
create policy "Ratings are publicly readable" on ratings for select using (true);
