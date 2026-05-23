-- ============================================================
-- Unsplash images for stores and menu items
-- ============================================================

-- Store images
update stores set image_url = 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400&h=300&fit=crop' where id = 'S01';
update stores set image_url = 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop' where id = 'S02';
update stores set image_url = 'https://images.unsplash.com/photo-1529563021893-cc83c992d75d?w=400&h=300&fit=crop' where id = 'S03';
update stores set image_url = 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&h=300&fit=crop' where id = 'S04';
update stores set image_url = 'https://images.unsplash.com/photo-1546069901-b5a2f2c7c7c3?w=400&h=300&fit=crop' where id = 'S05';

-- Menu item images
-- S01: ก๋วยเตี๋ยวหลุดโลก
update menu_items set image_url = 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&h=200&fit=crop' where store_id = 'S01' and name = 'ก๋วยเตี๋ยวน้ำใส';
update menu_items set image_url = 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=200&h=200&fit=crop' where store_id = 'S01' and name = 'ก๋วยเตี๋ยวต้มยำ';
update menu_items set image_url = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=200&fit=crop' where store_id = 'S01' and name = 'เกี๊ยวทอด';
update menu_items set image_url = 'https://images.unsplash.com/photo-1563379926898-341566ed8e52?w=200&h=200&fit=crop' where store_id = 'S01' and name = 'ก๋วยเตี๋ยวเรือเนื้อตุ๋น';
update menu_items set image_url = 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=200&h=200&fit=crop' where store_id = 'S01' and name = 'เย็นตาโฟทะเล';
update menu_items set image_url = 'https://images.unsplash.com/photo-1623689046288-f8c0ec1e411c?w=200&h=200&fit=crop' where store_id = 'S01' and name = 'ลุยสวน';

-- S02: ข้าวมันไก่เจ๊เปราะ
update menu_items set image_url = 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=200&h=200&fit=crop' where store_id = 'S02' and name = 'ข้าวมันไก่ต้ม';
update menu_items set image_url = 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=200&h=200&fit=crop' where store_id = 'S02' and name = 'ข้าวมันไก่ทอด';
update menu_items set image_url = 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=200&h=200&fit=crop' where store_id = 'S02' and name = 'ข้าวมันไก่ทอดกระเทียม';
update menu_items set image_url = 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=200&h=200&fit=crop' where store_id = 'S02' and name = 'ข้าวมันไก่ตุ๋น';
update menu_items set image_url = 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=200&h=200&fit=crop' where store_id = 'S02' and name = 'น้ำตกหมู';

-- S03: ส้มตำนัวๆ ปากซอย
update menu_items set image_url = 'https://images.unsplash.com/photo-1529563021893-cc83c992d75d?w=200&h=200&fit=crop' where store_id = 'S03' and name = 'ส้มตำไทย';
update menu_items set image_url = 'https://images.unsplash.com/photo-1529563021893-cc83c992d75d?w=200&h=200&fit=crop' where store_id = 'S03' and name = 'ส้มตำปูปลาร้า';
update menu_items set image_url = 'https://images.unsplash.com/photo-1529563021893-cc83c992d75d?w=200&h=200&fit=crop' where store_id = 'S03' and name = 'ส้มตำทะเล';
update menu_items set image_url = 'https://images.unsplash.com/photo-1529563021893-cc83c992d75d?w=200&h=200&fit=crop' where store_id = 'S03' and name = 'ตำบักหุ่ง';
update menu_items set image_url = 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=200&h=200&fit=crop' where store_id = 'S03' and name = 'ไก่ย่าง';
update menu_items set image_url = 'https://images.unsplash.com/photo-1603073163308-9654c3fb70b5?w=200&h=200&fit=crop' where store_id = 'S03' and name = 'ลาบหมู';
update menu_items set image_url = 'https://images.unsplash.com/photo-1546069901-b5a2f2c7c7c3?w=200&h=200&fit=crop' where store_id = 'S03' and name = 'ซุปหน่อไม้';

-- S04: ข้าวเหนียวไก่ย่างเจ๊แดง
update menu_items set image_url = 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=200&h=200&fit=crop' where store_id = 'S04' and name = 'ไก่ย่างทั้งตัว';
update menu_items set image_url = 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=200&h=200&fit=crop' where store_id = 'S04' and name = 'ไก่ย่างครึ่งตัว';
update menu_items set image_url = 'https://images.unsplash.com/photo-1603073163308-9654c3fb70b5?w=200&h=200&fit=crop' where store_id = 'S04' and name = 'ลาบไก่';
update menu_items set image_url = 'https://images.unsplash.com/photo-1603073163308-9654c3fb70b5?w=200&h=200&fit=crop' where store_id = 'S04' and name = 'น้ำตกไก่';
update menu_items set image_url = 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=200&h=200&fit=crop' where store_id = 'S04' and name = 'ต้มแซ่บกระดูกอ่อน';

-- S05: ลาบเหนือ-อีสานแซ่บหลาย
update menu_items set image_url = 'https://images.unsplash.com/photo-1603073163308-9654c3fb70b5?w=200&h=200&fit=crop' where store_id = 'S05' and name = 'ลาบหมู';
update menu_items set image_url = 'https://images.unsplash.com/photo-1603073163308-9654c3fb70b5?w=200&h=200&fit=crop' where store_id = 'S05' and name = 'ลาบเนื้อ';
update menu_items set image_url = 'https://images.unsplash.com/photo-1603073163308-9654c3fb70b5?w=200&h=200&fit=crop' where store_id = 'S05' and name = 'ลาบเป็ด';
update menu_items set image_url = 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=200&h=200&fit=crop' where store_id = 'S05' and name = 'น้ำตกหมู';
update menu_items set image_url = 'https://images.unsplash.com/photo-1603073163308-9654c3fb70b5?w=200&h=200&fit=crop' where store_id = 'S05' and name = 'ลาบเหนือ-อีสานแซ่บหลาย';
update menu_items set image_url = 'https://images.unsplash.com/photo-1546069901-b5a2f2c7c7c3?w=200&h=200&fit=crop' where store_id = 'S05' and name = 'ซุปกระดูกหมู';
update menu_items set image_url = 'https://images.unsplash.com/photo-1623689046288-f8c0ec1e411c?w=200&h=200&fit=crop' where store_id = 'S05' and name = 'ไส้กรอกอีสาน';
