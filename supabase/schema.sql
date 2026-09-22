-- =====================================================================
-- Shop Billing App - database schema
-- Paste this whole file into the Supabase SQL editor and click "Run".
-- It is safe to run more than once.
-- =====================================================================

-- ---------------------------------------------------------------------
-- TABLES
-- ---------------------------------------------------------------------
create table if not exists public.shops (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(trim(name)) between 1 and 100),
  address      text,
  phone        text check (phone is null or phone ~ '^[0-9]{10}$'),
  gst_number   text,
  owner_id     uuid not null references auth.users (id) on delete restrict,
  bill_counter integer not null default 0,      -- last used bill number of this shop
  created_at   timestamptz not null default now()
);

create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  shop_id    uuid not null references public.shops (id) on delete cascade,
  role       text not null check (role in ('owner', 'staff')),
  name       text not null,
  phone      text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists profiles_shop_idx on public.profiles (shop_id);

create table if not exists public.products (
  id              uuid primary key default gen_random_uuid(),
  shop_id         uuid not null references public.shops (id) on delete cascade,
  name            text not null check (char_length(trim(name)) between 1 and 120),
  price           numeric(12, 2) not null check (price > 0),
  stock           numeric(12, 3) not null default 0 check (stock >= 0),
  unit            text not null default 'pcs',
  low_stock_limit numeric(12, 3) not null default 5 check (low_stock_limit >= 0),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists products_shop_name_idx on public.products (shop_id, lower(name));

create table if not exists public.bills (
  id             uuid primary key default gen_random_uuid(),
  shop_id        uuid not null references public.shops (id) on delete cascade,
  bill_number    integer not null,
  customer_name  text,
  customer_phone text check (customer_phone is null or customer_phone ~ '^[0-9]{10}$'),
  subtotal       numeric(12, 2) not null check (subtotal >= 0),
  discount       numeric(12, 2) not null default 0 check (discount >= 0),
  total          numeric(12, 2) not null check (total >= 0),
  payment_type   text not null check (payment_type in ('cash', 'upi', 'udhaar')),
  created_by     uuid not null references auth.users (id),
  client_ref     uuid,                            -- stops duplicate bills on retry
  created_at     timestamptz not null default now(),
  unique (shop_id, bill_number)
);
create index if not exists bills_shop_created_idx on public.bills (shop_id, created_at desc);
create index if not exists bills_created_by_idx on public.bills (created_by, created_at desc);
create unique index if not exists bills_client_ref_idx
  on public.bills (shop_id, client_ref) where client_ref is not null;

create table if not exists public.bill_items (
  id           uuid primary key default gen_random_uuid(),
  bill_id      uuid not null references public.bills (id) on delete cascade,
  shop_id      uuid not null references public.shops (id) on delete cascade,
  product_id   uuid references public.products (id) on delete set null,
  product_name text not null,                     -- copy at time of sale
  unit         text not null,
  price        numeric(12, 2) not null,           -- copy at time of sale
  quantity     numeric(12, 3) not null check (quantity > 0),
  line_total   numeric(12, 2) not null
);
create index if not exists bill_items_bill_idx on public.bill_items (bill_id);
create index if not exists bill_items_shop_idx on public.bill_items (shop_id);

create table if not exists public.staff_invites (
  id         uuid primary key default gen_random_uuid(),
  shop_id    uuid not null references public.shops (id) on delete cascade,
  phone      text not null check (phone ~ '^[0-9]{10}$'),
  name       text,
  created_at timestamptz not null default now(),
  unique (shop_id, phone)
);
create index if not exists staff_invites_phone_idx on public.staff_invites (phone);

-- ---------------------------------------------------------------------
-- HELPER FUNCTIONS (used by the RLS policies)
-- security definer = they can read profiles without triggering RLS again
-- ---------------------------------------------------------------------
create or replace function public.current_shop_id()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select shop_id from public.profiles where id = auth.uid()
$$;

create or replace function public.is_owner()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'owner')
$$;

-- ---------------------------------------------------------------------
-- PRIVILEGES (least privilege; RLS below narrows it to the own shop)
-- ---------------------------------------------------------------------
revoke all on public.shops, public.profiles, public.products, public.bills,
              public.bill_items, public.staff_invites from anon, authenticated;

grant select on public.shops to authenticated;
grant update (name, address, phone, gst_number) on public.shops to authenticated;
grant select, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select on public.bills, public.bill_items to authenticated;   -- writes only via create_bill()
grant select, insert, delete on public.staff_invites to authenticated;

-- ---------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table public.shops         enable row level security;
alter table public.profiles      enable row level security;
alter table public.products      enable row level security;
alter table public.bills         enable row level security;
alter table public.bill_items    enable row level security;
alter table public.staff_invites enable row level security;

-- shops: members read their shop, only the owner edits it. Created via create_shop().
drop policy if exists shops_select on public.shops;
create policy shops_select on public.shops for select to authenticated
  using (id = public.current_shop_id());
drop policy if exists shops_update on public.shops;
create policy shops_update on public.shops for update to authenticated
  using (id = public.current_shop_id() and public.is_owner())
  with check (id = public.current_shop_id() and public.is_owner());

-- profiles: everyone reads own row, owner reads the whole shop team,
-- owner can remove staff (never the owner row). Rows are created by RPCs only.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or (shop_id = public.current_shop_id() and public.is_owner()));
drop policy if exists profiles_delete_staff on public.profiles;
create policy profiles_delete_staff on public.profiles for delete to authenticated
  using (shop_id = public.current_shop_id() and public.is_owner() and role = 'staff');

-- products: whole shop can read, ONLY the owner can write.
drop policy if exists products_select on public.products;
create policy products_select on public.products for select to authenticated
  using (shop_id = public.current_shop_id());
drop policy if exists products_insert on public.products;
create policy products_insert on public.products for insert to authenticated
  with check (shop_id = public.current_shop_id() and public.is_owner());
drop policy if exists products_update on public.products;
create policy products_update on public.products for update to authenticated
  using (shop_id = public.current_shop_id() and public.is_owner())
  with check (shop_id = public.current_shop_id() and public.is_owner());
drop policy if exists products_delete on public.products;
create policy products_delete on public.products for delete to authenticated
  using (shop_id = public.current_shop_id() and public.is_owner());

-- bills: owner reads all bills of the shop, staff read only the bills they made.
-- Nobody can insert/update/delete directly - only create_bill() can.
drop policy if exists bills_select on public.bills;
create policy bills_select on public.bills for select to authenticated
  using (
    shop_id = public.current_shop_id()
    and (public.is_owner() or created_by = auth.uid())
  );

drop policy if exists bill_items_select on public.bill_items;
create policy bill_items_select on public.bill_items for select to authenticated
  using (
    shop_id = public.current_shop_id()
    and exists (select 1 from public.bills b where b.id = bill_id)   -- re-uses bills RLS
  );

-- staff_invites: owner only.
drop policy if exists staff_invites_select on public.staff_invites;
create policy staff_invites_select on public.staff_invites for select to authenticated
  using (shop_id = public.current_shop_id() and public.is_owner());
drop policy if exists staff_invites_insert on public.staff_invites;
create policy staff_invites_insert on public.staff_invites for insert to authenticated
  with check (shop_id = public.current_shop_id() and public.is_owner());
drop policy if exists staff_invites_delete on public.staff_invites;
create policy staff_invites_delete on public.staff_invites for delete to authenticated
  using (shop_id = public.current_shop_id() and public.is_owner());

-- ---------------------------------------------------------------------
-- RPC: create_shop  (first-time owner)
-- ---------------------------------------------------------------------
create or replace function public.create_shop(p_shop_name text, p_owner_name text)
returns uuid
language plpgsql security definer
set search_path = public, auth
as $$
declare
  v_uid   uuid := auth.uid();
  v_phone text;
  v_shop  uuid;
begin
  if v_uid is null then raise exception 'Please log in first.'; end if;
  if exists (select 1 from public.profiles where id = v_uid) then
    raise exception 'You already belong to a shop.';
  end if;
  if char_length(trim(coalesce(p_shop_name, ''))) = 0 then
    raise exception 'Please enter the shop name.';
  end if;
  if char_length(trim(coalesce(p_owner_name, ''))) = 0 then
    raise exception 'Please enter the owner name.';
  end if;

  select right(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), 10)
    into v_phone from auth.users where id = v_uid;
  if v_phone is null or v_phone !~ '^[0-9]{10}$' then v_phone := null; end if;

  insert into public.shops (name, owner_id, phone)
    values (trim(p_shop_name), v_uid, v_phone)
    returning id into v_shop;
  insert into public.profiles (id, shop_id, role, name, phone)
    values (v_uid, v_shop, 'owner', trim(p_owner_name), coalesce(v_phone, ''));
  return v_shop;
end;
$$;

-- ---------------------------------------------------------------------
-- RPC: claim_staff_invite  (staff joins by phone number after OTP login)
-- returns the shop id, or null when this phone was never invited
-- ---------------------------------------------------------------------
create or replace function public.claim_staff_invite()
returns uuid
language plpgsql security definer
set search_path = public, auth
as $$
declare
  v_uid    uuid := auth.uid();
  v_phone  text;
  v_shop   uuid;
  v_invite public.staff_invites;
begin
  if v_uid is null then raise exception 'Please log in first.'; end if;
  select shop_id into v_shop from public.profiles where id = v_uid;
  if found then return v_shop; end if;

  select right(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), 10)
    into v_phone from auth.users where id = v_uid;
  if v_phone is null or v_phone = '' then return null; end if;

  select * into v_invite from public.staff_invites
    where phone = v_phone order by created_at limit 1;
  if not found then return null; end if;

  insert into public.profiles (id, shop_id, role, name, phone)
    values (v_uid, v_invite.shop_id, 'staff', coalesce(nullif(trim(v_invite.name), ''), 'Staff'), v_phone);
  delete from public.staff_invites where phone = v_phone;
  return v_invite.shop_id;
end;
$$;

-- ---------------------------------------------------------------------
-- RPC: create_bill  (ONE transaction: bill + items + stock + bill number)
-- p_items = [{"product_id": "<uuid>", "quantity": 2}, ...]
-- Prices always come from the products table, never from the phone.
-- Sending the same p_client_ref again returns the first bill (no duplicate).
-- ---------------------------------------------------------------------
create or replace function public.create_bill(
  p_items          jsonb,
  p_payment_type   text,
  p_discount       numeric default 0,
  p_customer_name  text default null,
  p_customer_phone text default null,
  p_client_ref     uuid default null
)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_uid      uuid := auth.uid();
  v_shop     uuid := public.current_shop_id();
  v_name     text := nullif(trim(coalesce(p_customer_name, '')), '');
  v_phone    text := nullif(regexp_replace(coalesce(p_customer_phone, ''), '\D', '', 'g'), '');
  v_discount numeric(12, 2) := round(coalesce(p_discount, 0), 2);
  v_subtotal numeric(12, 2) := 0;
  v_existing uuid;
  v_number   integer;
  v_bill     uuid;
  v_prod     public.products;
  r          record;
begin
  if v_uid is null or v_shop is null then raise exception 'Please log in first.'; end if;

  if p_client_ref is not null then
    select id into v_existing from public.bills
      where shop_id = v_shop and client_ref = p_client_ref;
    if found then return v_existing; end if;
  end if;

  if p_payment_type is null or p_payment_type not in ('cash', 'upi', 'udhaar') then
    raise exception 'Please choose Cash, UPI or Udhaar.';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Please add at least one item to the bill.';
  end if;
  if v_discount < 0 then raise exception 'Discount cannot be negative.'; end if;

  if v_phone is not null then
    if char_length(v_phone) < 10 then
      raise exception 'Customer phone number must be 10 digits.';
    end if;
    v_phone := right(v_phone, 10);
  end if;
  if p_payment_type = 'udhaar' and (v_name is null or v_phone is null) then
    raise exception 'Customer name and phone are needed for Udhaar.';
  end if;

  -- per-shop running bill number (row lock on the shop keeps numbers gap-free)
  update public.shops set bill_counter = bill_counter + 1
    where id = v_shop returning bill_counter into v_number;

  insert into public.bills
    (shop_id, bill_number, customer_name, customer_phone, subtotal, discount, total,
     payment_type, created_by, client_ref)
  values
    (v_shop, v_number, v_name, v_phone, 0, 0, 0, p_payment_type, v_uid, p_client_ref)
  returning id into v_bill;

  -- same product listed twice is merged; ordered by id so locks never deadlock
  for r in
    select (e ->> 'product_id')::uuid as product_id, sum((e ->> 'quantity')::numeric) as qty
    from jsonb_array_elements(p_items) e
    group by 1
    order by 1
  loop
    select * into v_prod from public.products
      where id = r.product_id and shop_id = v_shop
      for update;
    if not found then
      raise exception 'An item in this bill was not found. Please refresh and try again.';
    end if;
    if r.qty is null or r.qty <= 0 then
      raise exception 'Quantity of % must be more than 0.', v_prod.name;
    end if;
    if v_prod.unit in ('pcs', 'box', 'packet', 'dozen') and r.qty <> trunc(r.qty) then
      raise exception 'Quantity of % must be a whole number.', v_prod.name;
    end if;
    if v_prod.stock < r.qty then
      raise exception 'Not enough stock for %. Only % left.', v_prod.name, trim_scale(v_prod.stock);
    end if;

    insert into public.bill_items
      (bill_id, shop_id, product_id, product_name, unit, price, quantity, line_total)
    values
      (v_bill, v_shop, v_prod.id, v_prod.name, v_prod.unit, v_prod.price, r.qty,
       round(v_prod.price * r.qty, 2));

    update public.products set stock = stock - r.qty, updated_at = now() where id = v_prod.id;
    v_subtotal := v_subtotal + round(v_prod.price * r.qty, 2);
  end loop;

  if v_discount > v_subtotal then
    raise exception 'Discount cannot be more than the bill amount.';
  end if;

  update public.bills
    set subtotal = v_subtotal, discount = v_discount, total = v_subtotal - v_discount
    where id = v_bill;

  return v_bill;
end;
$$;

-- ---------------------------------------------------------------------
-- RPC: daily_report(date)  - OWNER ONLY. Day = Indian Standard Time day.
-- ---------------------------------------------------------------------
create or replace function public.daily_report(p_date date)
returns jsonb
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_shop   uuid := public.current_shop_id();
  v_from   timestamptz;
  v_to     timestamptz;
  v_result jsonb;
  v_top    jsonb;
begin
  if v_shop is null or not public.is_owner() then
    raise exception 'Only the owner can see reports.';
  end if;
  v_from := p_date::timestamp at time zone 'Asia/Kolkata';
  v_to   := (p_date + 1)::timestamp at time zone 'Asia/Kolkata';

  select jsonb_build_object(
    'total',      coalesce(sum(total), 0),
    'bill_count', count(*),
    'cash',       coalesce(sum(total) filter (where payment_type = 'cash'), 0),
    'upi',        coalesce(sum(total) filter (where payment_type = 'upi'), 0),
    'udhaar',     coalesce(sum(total) filter (where payment_type = 'udhaar'), 0)
  ) into v_result
  from public.bills
  where shop_id = v_shop and created_at >= v_from and created_at < v_to;

  select coalesce(jsonb_agg(t), '[]'::jsonb) into v_top
  from (
    select bi.product_name as name,
           min(bi.unit)    as unit,
           sum(bi.quantity)   as quantity,
           sum(bi.line_total) as amount
    from public.bill_items bi
    join public.bills b on b.id = bi.bill_id
    where b.shop_id = v_shop and b.created_at >= v_from and b.created_at < v_to
    group by bi.product_name
    order by sum(bi.line_total) desc, sum(bi.quantity) desc
    limit 5
  ) t;

  return v_result || jsonb_build_object('top_products', v_top);
end;
$$;

-- ---------------------------------------------------------------------
-- RPC: low_stock_products  (owner and staff; RLS keeps it to own shop)
-- ---------------------------------------------------------------------
create or replace function public.low_stock_products()
returns setof public.products
language sql stable security invoker
set search_path = public
as $$
  select * from public.products
  where shop_id = public.current_shop_id() and stock <= low_stock_limit
  order by stock asc, lower(name) asc
$$;

-- ---------------------------------------------------------------------
-- Only logged-in users may call the RPCs
-- ---------------------------------------------------------------------
revoke all on function public.create_shop(text, text) from public, anon;
revoke all on function public.claim_staff_invite() from public, anon;
revoke all on function public.create_bill(jsonb, text, numeric, text, text, uuid) from public, anon;
revoke all on function public.daily_report(date) from public, anon;
revoke all on function public.low_stock_products() from public, anon;
revoke all on function public.current_shop_id() from public, anon;
revoke all on function public.is_owner() from public, anon;

grant execute on function public.create_shop(text, text) to authenticated;
grant execute on function public.claim_staff_invite() to authenticated;
grant execute on function public.create_bill(jsonb, text, numeric, text, text, uuid) to authenticated;
grant execute on function public.daily_report(date) to authenticated;
grant execute on function public.low_stock_products() to authenticated;
grant execute on function public.current_shop_id() to authenticated;
grant execute on function public.is_owner() to authenticated;
