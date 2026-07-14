-- Saffron & Sage: authenticated restaurant reservations
-- Run this complete file once in Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text not null,
  guest_name text not null,
  phone text,
  date date not null,
  time time without time zone not null,
  guests integer not null check (guests between 1 and 8),
  occasion text not null default 'Casual dining',
  preferred_dish text,
  seating_preference text not null default 'Best available',
  special_requests text,
  status text not null default 'confirmed'
    check (status in ('confirmed', 'cancelled')),
  created_at timestamptz not null default now(),
  cancelled_at timestamptz
);

create index if not exists reservations_slot_idx
  on public.reservations (date, time, status);

create index if not exists reservations_user_idx
  on public.reservations (user_id, date, time);

alter table public.reservations enable row level security;

-- Customers can read only their own reservations.
drop policy if exists "Customers read their own reservations" on public.reservations;
create policy "Customers read their own reservations"
on public.reservations
for select
to authenticated
using ((select auth.uid()) = user_id);

-- There are deliberately no browser INSERT/UPDATE/DELETE policies.
-- The secure database functions below validate the user and capacity.

create or replace function public.get_slot_availability(
  p_date date,
  p_time time without time zone
)
returns table (capacity integer, booked integer, remaining integer)
language sql
stable
security definer
set search_path = public
as $$
  with slot as (
    select coalesce(sum(r.guests), 0)::integer as seats_booked
    from public.reservations r
    where r.date = p_date
      and r.time = p_time
      and r.status = 'confirmed'
  )
  select
    20::integer as capacity,
    slot.seats_booked as booked,
    greatest(20 - slot.seats_booked, 0)::integer as remaining
  from slot;
$$;

create or replace function public.create_restaurant_reservation(
  p_guest_name text,
  p_phone text,
  p_date date,
  p_time time without time zone,
  p_guests integer,
  p_occasion text,
  p_preferred_dish text,
  p_seating_preference text,
  p_special_requests text
)
returns setof public.reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_user_email text := auth.jwt() ->> 'email';
  v_booked integer;
  v_reservation_id uuid;
begin
  if v_user_id is null then
    raise exception 'You must be signed in to reserve a table.';
  end if;

  if p_date is null or p_time is null then
    raise exception 'Choose a valid reservation date and time.';
  end if;

  if p_date < current_date then
    raise exception 'Reservations cannot be made in the past.';
  end if;

  if p_guests is null or p_guests < 1 or p_guests > 8 then
    raise exception 'A reservation must contain between 1 and 8 guests.';
  end if;

  if length(trim(coalesce(p_guest_name, ''))) < 2 then
    raise exception 'Enter a valid guest name.';
  end if;

  -- Serializes reservations for the same date/time inside the transaction.
  -- This closes the race condition where two guests try to claim the last seats.
  perform pg_advisory_xact_lock(
    hashtextextended(p_date::text || '|' || p_time::text, 0)
  );

  select coalesce(sum(r.guests), 0)::integer
  into v_booked
  from public.reservations r
  where r.date = p_date
    and r.time = p_time
    and r.status = 'confirmed';

  if v_booked + p_guests > 20 then
    raise exception 'Not enough seats remain for this dining time.';
  end if;

  insert into public.reservations (
    user_id,
    user_email,
    guest_name,
    phone,
    date,
    time,
    guests,
    occasion,
    preferred_dish,
    seating_preference,
    special_requests,
    status
  ) values (
    v_user_id,
    v_user_email,
    trim(p_guest_name),
    nullif(trim(coalesce(p_phone, '')), ''),
    p_date,
    p_time,
    p_guests,
    coalesce(nullif(trim(p_occasion), ''), 'Casual dining'),
    nullif(trim(coalesce(p_preferred_dish, '')), ''),
    coalesce(nullif(trim(p_seating_preference), ''), 'Best available'),
    nullif(trim(coalesce(p_special_requests, '')), ''),
    'confirmed'
  )
  returning id into v_reservation_id;

  return query
  select r.*
  from public.reservations r
  where r.id = v_reservation_id;
end;
$$;

create or replace function public.cancel_my_reservation(
  p_reservation_id uuid
)
returns setof public.reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'You must be signed in.';
  end if;

  update public.reservations r
  set
    status = 'cancelled',
    cancelled_at = now()
  where r.id = p_reservation_id
    and r.user_id = v_user_id
    and r.status = 'confirmed';

  if not found then
    raise exception 'Reservation not found or already cancelled.';
  end if;

  return query
  select r.*
  from public.reservations r
  where r.id = p_reservation_id
    and r.user_id = v_user_id;
end;
$$;

revoke all on function public.get_slot_availability(date, time without time zone) from public;
revoke all on function public.create_restaurant_reservation(text, text, date, time without time zone, integer, text, text, text, text) from public;
revoke all on function public.cancel_my_reservation(uuid) from public;

grant execute on function public.get_slot_availability(date, time without time zone) to authenticated;
grant execute on function public.create_restaurant_reservation(text, text, date, time without time zone, integer, text, text, text, text) to authenticated;
grant execute on function public.cancel_my_reservation(uuid) to authenticated;

grant select on public.reservations to authenticated;
