-- Add unique constraint on customer_id so upsert works correctly
-- Instead of inserting a new row every order, it updates the existing one
alter table customer_locations
  add constraint customer_locations_customer_id_key unique (customer_id);
