-- ============================================================
-- Seed data for เอาหยังบ่ (webTEA)
-- ============================================================

-- Stores (เพิ่มร้านอีสาน)
insert into stores (id, name, phone, status, wait_time, image_url) values
  ('S03', 'ส้มตำนัวๆ ปากซอย', '0810000001', 'open', 15, NULL),
  ('S04', 'ข้าวเหนียวไก่ย่างเจ๊แดง', '0810000002', 'open', 25, NULL),
  ('S05', 'ลาบเหนือ-อีสานแซ่บหลาย', '0810000003', 'open', 20, NULL)
on conflict (id) do nothing;

-- Menu items (เพิ่มเมนู)
-- ร้าน S01: ก๋วยเตี๋ยวหลุดโลก
insert into menu_items (store_id, name, price, category, stock) values
  ('S01', 'ก๋วยเตี๋ยวเรือเนื้อตุ๋น', 80, 'ก๋วยเตี๋ยว', 50),
  ('S01', 'เย็นตาโฟทะเล', 100, 'ก๋วยเตี๋ยว', 50),
  ('S01', 'ลุยสวน', 40, 'ของทอด', 30)
on conflict (id) do nothing;

-- ร้าน S02: ข้าวมันไก่เจ๊เปราะ
insert into menu_items (store_id, name, price, category, stock) values
  ('S02', 'ข้าวมันไก่ทอดกระเทียม', 60, 'ข้าว', 50),
  ('S02', 'ข้าวมันไก่ตุ๋น', 55, 'ข้าว', 50),
  ('S02', 'น้ำซุปใส', 10, 'เครื่องดื่ม', 99),
  ('S02', 'น้ำตกหมู', 70, 'ข้าว', 40)
on conflict (id) do nothing;

-- ร้าน S03: ส้มตำนัวๆ ปากซอย
insert into menu_items (store_id, name, price, category, stock) values
  ('S03', 'ส้มตำไทย', 40, 'ส้มตำ', 50),
  ('S03', 'ส้มตำปูปลาร้า', 50, 'ส้มตำ', 50),
  ('S03', 'ส้มตำทะเล', 70, 'ส้มตำ', 30),
  ('S03', 'ตำบักหุ่ง', 45, 'ส้มตำ', 50),
  ('S03', 'ไก่ย่าง', 60, 'ย่าง', 30),
  ('S03', 'ข้าวเหนียว', 10, 'ข้าว', 99),
  ('S03', 'ลาบหมู', 50, 'ลาบ', 40),
  ('S03', 'ซุปหน่อไม้', 40, 'ซุป', 30)
on conflict (id) do nothing;

-- ร้าน S04: ข้าวเหนียวไก่ย่างเจ๊แดง
insert into menu_items (store_id, name, price, category, stock) values
  ('S04', 'ไก่ย่างทั้งตัว', 150, 'ย่าง', 20),
  ('S04', 'ไก่ย่างครึ่งตัว', 80, 'ย่าง', 30),
  ('S04', 'ข้าวเหนียว', 10, 'ข้าว', 99),
  ('S04', 'ส้มตำไทย', 40, 'ส้มตำ', 40),
  ('S04', 'ลาบไก่', 50, 'ลาบ', 30),
  ('S04', 'น้ำตกไก่', 50, 'น้ำตก', 30),
  ('S04', 'ต้มแซ่บกระดูกอ่อน', 60, 'ต้ม', 25)
on conflict (id) do nothing;

-- ร้าน S05: ลาบเหนือ-อีสานแซ่บหลาย
insert into menu_items (store_id, name, price, category, stock) values
  ('S05', 'ลาบหมู', 50, 'ลาบ', 40),
  ('S05', 'ลาบเนื้อ', 70, 'ลาบ', 30),
  ('S05', 'ลาบเป็ด', 65, 'ลาบ', 25),
  ('S05', 'น้ำตกหมู', 50, 'น้ำตก', 40),
  ('S05', 'ซุปกระดูกหมู', 60, 'ซุป', 30),
  ('S05', 'ไส้กรอกอีสาน', 40, 'ย่าง', 40),
  ('S05', 'ข้าวเหนียว', 10, 'ข้าว', 99),
  ('S05', 'ส้มตำปลาร้า', 45, 'ส้มตำ', 40)
on conflict (id) do nothing;

-- Riders
insert into riders (id, phone, name, earnings, jobs_count, zone_id, online) values
  (gen_random_uuid(), '0845678901', 'สมชาย ใจดี', 0, 0, 'Z01', false),
  (gen_random_uuid(), '0856789012', 'สมหญิง รักดี', 0, 0, 'Z01', false),
  (gen_random_uuid(), '0867890123', 'มานะ ขยันดี', 0, 0, 'Z01', false)
on conflict (phone) do nothing;

-- Zones (เพิ่มโซน) — ศูนย์กลางที่ บ้านสูงเนิน สกลนคร
insert into zones (id, name, lat, lng, radius, status) values
  ('Z02', 'โซนตะวันออก', 17.32, 103.99, 4.5, 'open'),
  ('Z03', 'โซนตะวันตก', 17.27, 103.93, 4.5, 'open')
on conflict (id) do nothing;

-- Settings if not exist
insert into settings (key, value) values
  ('delivery_fee', '10'),
  ('radius', '4.5'),
  ('commission_rate', '0.15'),
  ('markup', '0'),
  ('app_name', 'เอาหยังบ่'),
  ('contact_phone', '0929892085')
on conflict (key) do nothing;
