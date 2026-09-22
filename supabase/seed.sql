-- Sample products for testing.
-- 1. Log in to the app once and create your shop.
-- 2. Paste this file into the Supabase SQL editor and Run.
-- It adds 10 products to the oldest shop in the database.

do $$
declare
  v_shop uuid := (select id from public.shops order by created_at limit 1);
begin
  if v_shop is null then
    raise exception 'No shop found. Create your shop in the app first.';
  end if;

  insert into public.products (shop_id, name, price, stock, unit, low_stock_limit) values
    (v_shop, 'Sugar',               46.00, 40,  'kg',     10),
    (v_shop, 'Basmati Rice',        95.00, 60,  'kg',     15),
    (v_shop, 'Toor Dal',           140.00, 25,  'kg',     10),
    (v_shop, 'Sunflower Oil 1L',   135.00, 18,  'pcs',     6),
    (v_shop, 'Tea Powder 250g',     70.00, 30,  'packet',  8),
    (v_shop, 'Parle-G Biscuit',     10.00, 120, 'pcs',    30),
    (v_shop, 'Bath Soap',           38.00, 4,   'pcs',     8),
    (v_shop, 'Milk 500ml',          32.00, 50,  'pcs',    12),
    (v_shop, 'Maggi Noodles',       14.00, 3,   'pcs',    20),
    (v_shop, 'Paracetamol Strip',   25.00, 45,  'pcs',    10);
end;
$$;
