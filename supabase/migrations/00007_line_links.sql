-- LINE user ID links for direct OTP delivery
alter table customers add column if not exists line_user_id text;
alter table stores add column if not exists line_user_id text;
alter table riders add column if not exists line_user_id text;

create index if not exists idx_customers_line on customers(line_user_id);
create index if not exists idx_stores_line on stores(line_user_id);
create index if not exists idx_riders_line on riders(line_user_id);
