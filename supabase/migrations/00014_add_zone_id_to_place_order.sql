-- Add p_zone_id parameter to place_order
create or replace function place_order(
  p_customer_id uuid,
  p_store_id text,
  p_items jsonb,
  p_delivery_fee numeric,
  p_lat numeric,
  p_lng numeric,
  p_address text,
  p_note text,
  p_payment_method text default 'cash',
  p_zone_id text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_food_total numeric := 0;
  v_total numeric;
  v_item jsonb;
  v_menu record;
  v_items_json jsonb := '[]'::jsonb;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    return jsonb_build_object('ok', false, 'error', 'กรุณาเลือกเมนูอย่างน้อย 1 รายการ');
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select id, name, price, stock into v_menu
    from menu_items
    where id = (v_item->>'menu_id')::uuid
    for update;

    if not found then
      return jsonb_build_object('ok', false, 'error', format('ไม่พบเมนู %s', v_item->>'name'));
    end if;

    if v_menu.stock is not null and v_menu.stock < (v_item->>'qty')::int then
      return jsonb_build_object('ok', false, 'error', format('%s คงเหลือไม่เพียงพอ (เหลือ %s)', v_menu.name, v_menu.stock));
    end if;

    v_food_total := v_food_total + ((v_item->>'price')::numeric * (v_item->>'qty')::int);
  end loop;

  v_total := v_food_total + p_delivery_fee;

  insert into orders (customer_id, store_id, total, delivery_fee, lat, lng, address, note, payment_method, status, zone_id)
  values (p_customer_id, p_store_id, v_total, p_delivery_fee, p_lat, p_lng, p_address, p_note, p_payment_method, 'รอดำเนินการ', p_zone_id)
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into order_items (order_id, menu_id, name, price, qty)
    values (v_order_id, (v_item->>'menu_id')::uuid, v_item->>'name', (v_item->>'price')::numeric, (v_item->>'qty')::int);

    update menu_items set stock = stock - (v_item->>'qty')::int
    where id = (v_item->>'menu_id')::uuid
    and stock is not null;
  end loop;

  select jsonb_agg(jsonb_build_object(
    'menu_id', mi->>'menu_id',
    'name', mi->>'name',
    'price', (mi->>'price')::numeric,
    'qty', (mi->>'qty')::int
  )) into v_items_json
  from jsonb_array_elements(p_items) as mi;

  return jsonb_build_object(
    'ok', true,
    'order', jsonb_build_object(
      'id', v_order_id,
      'customer_id', p_customer_id,
      'store_id', p_store_id,
      'total', v_total,
      'delivery_fee', p_delivery_fee,
      'lat', p_lat,
      'lng', p_lng,
      'address', p_address,
      'note', p_note,
      'payment_method', p_payment_method,
      'status', 'รอดำเนินการ',
      'zone_id', p_zone_id,
      'items', v_items_json
    )
  );
end;
$$;

grant execute on function place_order(uuid, text, jsonb, numeric, numeric, numeric, text, text, text, text) to anon, authenticated;
