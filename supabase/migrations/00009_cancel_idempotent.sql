-- ============================================================
-- cancel_order: คืน stock + ยกเลิกออเดอร์ (atomic)
-- ============================================================
create or replace function cancel_order(
  p_order_id uuid,
  p_caller_id text,
  p_caller_type text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_item record;
begin
  select * into v_order
  from orders
  where id = p_order_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'ไม่พบออเดอร์');
  end if;

  if v_order.status = 'ยกเลิก' then
    return jsonb_build_object('ok', false, 'error', 'ออเดอร์นี้ยกเลิกไปแล้ว');
  end if;

  if v_order.status = 'จัดส่งสำเร็จ' then
    return jsonb_build_object('ok', false, 'error', 'ไม่สามารถยกเลิกออเดอร์ที่จัดส่งสำเร็จแล้ว');
  end if;

  -- Restore stock for each item
  for v_item in select menu_id, qty from order_items where order_id = p_order_id
  loop
    update menu_items set stock = stock + v_item.qty
    where id = v_item.menu_id
    and stock is not null;
  end loop;

  update orders set status = 'ยกเลิก' where id = p_order_id;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function cancel_order(uuid, text, text) to anon, authenticated;

-- ============================================================
-- Idempotency key: ป้องกันสั่งซ้ำ
-- ============================================================
alter table orders add column if not exists idempotency_key text;
create unique index if not exists idx_orders_idempotency on orders(idempotency_key) where idempotency_key is not null;
