-- Add line_user_id to stores for LINE push notifications
alter table stores add column if not exists line_user_id text;
