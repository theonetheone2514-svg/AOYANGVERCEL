-- Stores
create table if not exists stores (
  id text primary key,
  name text not null,
  phone text unique not null,
  status text default 'open' check (status in ('open', 'closed')),
  wait_time int default 20,
  image_url text,
  created_at timestamptz default now()
);

-- Menu items
create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  store_id text not null references stores(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null,
  image_url text,
  category text,
  stock int default 0,
  created_at timestamptz default now()
);

-- Customers (linked to auth.users)
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users,
  phone text unique not null,
  name text,
  points int default 0,
  created_at timestamptz default now()
);

-- Riders (linked to auth.users)
create table if not exists riders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users,
  phone text unique not null,
  name text,
  earnings numeric(10,2) default 0,
  jobs_count int default 0,
  zone_id text,
  online boolean default false,
  lat numeric,
  lng numeric,
  created_at timestamptz default now()
);

-- Orders
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id),
  store_id text not null references stores(id),
  rider_id uuid references riders(id),
  status text default 'รอดำเนินการ'
    check (status in ('รอดำเนินการ','กำลังเตรียมอาหาร','พร้อมจัดส่ง','กำลังจัดส่ง','จัดส่งสำเร็จ','ยกเลิก')),
  total numeric(10,2) not null default 0,
  delivery_fee numeric(10,2) default 10,
  lat numeric,
  lng numeric,
  address text,
  payment_method text default 'cash' check (payment_method in ('cash', 'transfer')),
  zone_id text,
  note text,
  created_at timestamptz default now()
);

-- Order items
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  menu_id uuid references menu_items(id),
  name text not null,
  qty int not null default 1,
  price numeric(10,2) not null
);

-- Zones
create table if not exists zones (
  id text primary key,
  name text not null,
  lat numeric not null,
  lng numeric not null,
  radius numeric default 3.0,
  status text default 'open' check (status in ('open', 'closed'))
);

-- Settings (key-value store)
create table if not exists settings (
  key text primary key,
  value text not null
);

-- Customer locations
create table if not exists customer_locations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  lat numeric,
  lng numeric,
  address text,
  created_at timestamptz default now()
);

-- OTPs (for LINE OTP auth)
create table if not exists otps (
  phone text primary key,
  otp text not null,
  expires_at timestamptz not null,
  used boolean default false,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_menu_store on menu_items(store_id);
create index if not exists idx_orders_store on orders(store_id);
create index if not exists idx_orders_customer on orders(customer_id);
create index if not exists idx_orders_rider on orders(rider_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_created on orders(created_at);
create index if not exists idx_order_items_order on order_items(order_id);
create index if not exists idx_customer_phone on customers(phone);
create index if not exists idx_rider_phone on riders(phone);

-- Enable RLS
alter table stores enable row level security;
alter table menu_items enable row level security;
alter table customers enable row level security;
alter table riders enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table zones enable row level security;
alter table settings enable row level security;
alter table customer_locations enable row level security;

-- Default RLS policies (public read for stores, menu, zones)
create policy "Stores are publicly readable" on stores for select using (true);
create policy "Menu items are publicly readable" on menu_items for select using (true);
create policy "Zones are publicly readable" on zones for select using (true);
create policy "Settings are publicly readable" on settings for select using (true);

-- Insert default settings
insert into settings (key, value) values ('delivery_fee', '10') on conflict (key) do nothing;
insert into settings (key, value) values ('radius', '3') on conflict (key) do nothing;
insert into settings (key, value) values ('commission_rate', '0.15') on conflict (key) do nothing;
insert into settings (key, value) values ('markup', '0') on conflict (key) do nothing;

-- Insert default zones
insert into zones (id, name, lat, lng, radius, status) values
  ('Z01', 'โซนกลาง', 17.293067, 103.969910, 4.5, 'open')
on conflict (id) do nothing;
