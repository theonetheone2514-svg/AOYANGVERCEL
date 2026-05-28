// Run: node scripts/setup-rich-menu.mjs
// Requires LINE_CHANNEL_ACCESS_TOKEN in .env.local
// Creates a Rich Menu with tap areas for: เมนู, ผูกเบอร์, สถานะ, ช่วยเหลือ

const LINE_API = 'https://api.line.me/v2/bot'

async function main() {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) {
    console.error('❌ ต้องตั้ง LINE_CHANNEL_ACCESS_TOKEN ใน .env.local ก่อน')
    process.exit(1)
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }

  // 1. Create rich menu
  const richMenu = {
    size: { width: 2500, height: 1686 },
    selected: true,
    name: 'เอาหยังบ่ Main Menu',
    chatBarText: 'เมนู',
    areas: [
      {
        bounds: { x: 0, y: 0, width: 833, height: 843 },
        action: { type: 'message', text: 'เมนู' },
      },
      {
        bounds: { x: 833, y: 0, width: 834, height: 843 },
        action: { type: 'message', text: 'ช่วยเหลือ' },
      },
      {
        bounds: { x: 1667, y: 0, width: 833, height: 843 },
        action: { type: 'message', text: 'สถานะ' },
      },
      {
        bounds: { x: 0, y: 843, width: 1250, height: 843 },
        action: { type: 'message', text: 'ผูก' },
      },
      {
        bounds: { x: 1250, y: 843, width: 1250, height: 843 },
        action: { type: 'uri', uri: 'https://liff.line.me/ar5m6p7k8t9r', label: 'เปิดเว็บ' },
      },
    ],
  }

  const createRes = await fetch(`${LINE_API}/richmenu`, {
    method: 'POST',
    headers,
    body: JSON.stringify(richMenu),
  })

  if (!createRes.ok) {
    const err = await createRes.text()
    console.error('❌ สร้าง Rich Menu ไม่สำเร็จ:', err)
    process.exit(1)
  }

  const { richMenuId } = await createRes.json()
  console.log(`✅ สร้าง Rich Menu สำเร็จ: ${richMenuId}`)

  // 2. Upload image (use logo.png from public/)
  const fs = await import('fs')
  const path = await import('path')
  const imagePath = path.resolve('public/logo.png')

  if (fs.existsSync(imagePath)) {
    const imageBuffer = fs.readFileSync(imagePath)

    // LINE requires image to be JPEG or PNG, max 1MB, 2500x1686
    const uploadRes = await fetch(`${LINE_API}/richmenu/${richMenuId}/content`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'image/png',
      },
      body: imageBuffer,
    })

    if (!uploadRes.ok) {
      const err = await uploadRes.text()
      console.error('❌ อัปโหลดรูป Rich Menu ไม่สำเร็จ:', err)
      console.log('ℹ️  รูป logo.png อาจไม่เหมาะกับขนาด 2500x1686 px')
      console.log('   คุณสามารถอัปโหลดรูปเองได้ที่ LINE Developer Console')
      process.exit(1)
    }

    console.log('✅ อัปโหลดรูป Rich Menu สำเร็จ')
  } else {
    console.warn('⚠️  ไม่พบ public/logo.png — ข้ามอัปโหลดรูป')
    console.log(`   รหัส Rich Menu: ${richMenuId}`)
    console.log('   อัปโหลดรูปที่ LINE Developer Console:')
    console.log(`   POST ${LINE_API}/richmenu/${richMenuId}/content`)
  }

  // 3. Set as default
  const setRes = await fetch(`${LINE_API}/user/all/richmenu/${richMenuId}`, {
    method: 'POST',
    headers,
  })

  if (!setRes.ok) {
    const err = await setRes.text()
    console.error('❌ ตั้งค่า Rich Menu เป็นค่าเริ่มต้นไม่สำเร็จ:', err)
    process.exit(1)
  }

  console.log('✅ ตั้งค่า Rich Menu เป็นค่าเริ่มต้นแล้ว')
  console.log('\n🎉 เสร็จสมบูรณ์!')
}

main().catch(console.error)
