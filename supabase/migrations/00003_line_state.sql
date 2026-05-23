-- LINE user session state for Bot interactions
create table if not exists line_user_states (
  line_user_id text primary key,
  current_store_id text,
  cart jsonb default '[]'::jsonb,
  updated_at timestamptz default now()
);
