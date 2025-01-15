-- Enable auth schema
create schema if not exists auth;

-- Create auth tables
create table if not exists auth.users (
  id uuid references auth.users primary key,
  email text unique,
  name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table auth.users enable row level security;

-- Create policies
create policy "Users can read own data" on auth.users
  for select using (auth.uid() = id);

create policy "Users can update own data" on auth.users
  for update using (auth.uid() = id);

-- Create auth functions
create or replace function auth.get_user_by_email(p_email text)
returns auth.users as $$
begin
  return (
    select users.*
    from auth.users as users
    where users.email = p_email
  );
end;
$$ language plpgsql security definer;

