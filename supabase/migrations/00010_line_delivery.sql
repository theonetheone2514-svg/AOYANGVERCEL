-- Add delivery fields and step tracking for LINE Bot order flow
alter table line_user_states add column if not exists step text default null;
alter table line_user_states add column if not exists delivery_address text default null;
alter table line_user_states add column if not exists delivery_lat numeric default null;
alter table line_user_states add column if not exists delivery_lng numeric default null;