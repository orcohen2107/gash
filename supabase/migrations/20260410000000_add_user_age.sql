-- Add age column to users table for onboarding profile
alter table users add column if not exists age integer check (age between 16 and 100);
