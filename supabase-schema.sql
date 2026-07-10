create table bookings (
  id text primary key,
  service_id text not null,
  service_name text not null,
  service_price integer not null,
  date date not null,
  time text not null,
  pay text not null check (pay in ('online', 'shop')),
  status text not null default 'confirmed' check (status in ('pending', 'confirmed', 'cancelled')),
  stripe_session_id text,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  details text default '',
  total integer not null,
  created_at timestamptz default now()
);

create index bookings_date_idx on bookings (date);
create index bookings_status_idx on bookings (status);
create index bookings_stripe_session_idx on bookings (stripe_session_id);
