-- Atomic transaction RPCs: ป้องกัน race condition ด้วย row-level locks
-- แต่ละ function ใช้ SELECT ... FOR UPDATE เพื่อ lock แถวก่อนแก้ไข

-- ============================================================
-- place_order: เช็ค stock → สร้าง order → insert items → หัก stock
-- ============================================================
create or replace function place_order(
  p_customer_id uuid,
  p_store_id text,
  p_items jsonb,
  p_delivery_fee numeric,
  p_lat numeric,
  p_lng numeric,
  p_address text,
  p_note text,
  p_payment_method text default 'cash'
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

  insert into orders (customer_id, store_id, total, delivery_fee, lat, lng, address, note, payment_method, status)
  values (p_customer_id, p_store_id, v_total, p_delivery_fee, p_lat, p_lng, p_address, p_note, p_payment_method, 'รอดำเนินการ')
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
      'items', v_items_json
    )
  );
end;
$$;

-- ============================================================
-- accept_order: เช็คว่าง → assign rider → update status
-- ============================================================
create or replace function accept_order(
  p_order_id uuid,
  p_rider_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
begin
  select id, rider_id, status into v_order
  from orders
  where id = p_order_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'ไม่พบออเดอร์');
  end if;

  if v_order.rider_id is not null then
    return jsonb_build_object('ok', false, 'error', 'งานนี้มีคนรับไปแล้ว');
  end if;

  if v_order.status != 'พร้อมจัดส่ง' then
    return jsonb_build_object('ok', false, 'error', 'ออเดอร์นี้ยังไม่พร้อมจัดส่ง');
  end if;

  update orders set rider_id = p_rider_id, status = 'กำลังจัดส่ง'
  where id = p_order_id;

  return jsonb_build_object('ok', true);
end;
$$;

-- ============================================================
-- complete_order: อัปเดต order + rider earnings + customer points
-- ============================================================
create or replace function complete_order(
  p_order_id uuid,
  p_rider_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_delivery_fee numeric;
  v_points int;
begin
  select id, rider_id, status, total, delivery_fee, customer_id into v_order
  from orders
  where id = p_order_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'ไม่พบออเดอร์');
  end if;

  if v_order.rider_id != p_rider_id then
    return jsonb_build_object('ok', false, 'error', 'ไม่ใช่งานของคุณ');
  end if;

  if v_order.status = 'จัดส่งสำเร็จ' then
    return jsonb_build_object('ok', false, 'error', 'งานนี้เสร็จสิ้นแล้ว');
  end if;

  v_delivery_fee := coalesce(v_order.delivery_fee, 0);

  update orders set status = 'จัดส่งสำเร็จ' where id = p_order_id;

  update riders set
    earnings = coalesce(earnings, 0) + v_delivery_fee,
    jobs_count = coalesce(jobs_count, 0) + 1
  where id = p_rider_id;

  if v_order.customer_id is not null then
    v_points := floor((v_order.total - v_delivery_fee) / 20);
    if v_points > 0 then
      update customers set points = coalesce(points, 0) + v_points
      where id = v_order.customer_id;
    end if;
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

-- Grant execute to anon + authenticated (functions run as security definer)
grant execute on function place_order(uuid, text, jsonb, numeric, numeric, numeric, text, text, text) to anon, authenticated;
grant execute on function accept_order(uuid, uuid) to anon, authenticated;
grant execute on function complete_order(uuid, uuid) to anon, authenticated;
