// Run: node scripts/setup-rich-menu.mjs
// Requires LINE_CHANNEL_ACCESS_TOKEN in .env.local
// Creates a Rich Menu with tap areas for: เมนู, ผูกเบอร์, สถานะ, ช่วยเหลือ

const LINE_API = 'https://api.line.me/v2/bot'
const LINE_DATA_API = 'https://api-data.line.me/v2/bot'

async function getHeaders() {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) {
    console.error('❌ ต้องตั้ง LINE_CHANNEL_ACCESS_TOKEN ใน .env.local ก่อน')
    process.exit(1)
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

async function deleteExistingRichMenus(headers) {
  const listRes = await fetch(`${LINE_API}/richmenu/list`, { headers })
  if (!listRes.ok) return

  const { richmenus } = await listRes.json()
  for (const rm of richmenus || []) {
    if (rm.name === 'เอาหยังบ่ Main Menu') {
      console.log(`🗑️  ลบ Rich Menu เก่า: ${rm.richMenuId}`)
      await fetch(`${LINE_API}/richmenu/${rm.richMenuId}`, { method: 'DELETE', headers })
    }
  }
}

async function generateImage() {
  const sharp = (await import('sharp')).default

  const svg = Buffer.from(`
    <svg width="2500" height="1686" xmlns="http://www.w3.org/2000/svg">
      <rect width="2500" height="1686" fill="#FFF8E7"/>
      <rect x="40" y="20" width="750" height="800" fill="#E65100" rx="16"/>
      <text x="415" y="460" fill="white" font-size="48" font-weight="bold" text-anchor="middle" font-family="sans-serif">เมนู</text>
      <rect x="870" y="20" width="760" height="800" fill="#9C4A35" rx="16"/>
      <text x="1250" y="460" fill="white" font-size="48" font-weight="bold" text-anchor="middle" font-family="sans-serif">ช่วยเหลือ</text>
      <rect x="1700" y="20" width="760" height="800" fill="#E65100" rx="16"/>
      <text x="2080" y="460" fill="white" font-size="48" font-weight="bold" text-anchor="middle" font-family="sans-serif">สถานะ</text>
      <rect x="40" y="860" width="1180" height="800" fill="#9C4A35" rx="16"/>
      <text x="630" y="1300" fill="white" font-size="56" font-weight="bold" text-anchor="middle" font-family="sans-serif">ผูกเบอร์โทร</text>
      <rect x="1260" y="860" width="1200" height="800" fill="#E65100" rx="16"/>
      <text x="1860" y="1300" fill="white" font-size="56" font-weight="bold" text-anchor="middle" font-family="sans-serif">เปิดเว็บ</text>
    </svg>
  `)

  return sharp(svg)
    .resize(2500, 1686)
    .png()
    .toBuffer()
}

async function main() {
  const headers = await getHeaders()

  await deleteExistingRichMenus(headers)

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

  const imageBuffer = await generateImage()
  const uploadRes = await fetch(`${LINE_DATA_API}/richmenu/${richMenuId}/content`, {
    method: 'POST',
    headers: {
      'Authorization': headers['Authorization'],
      'Content-Type': 'image/png',
    },
    body: imageBuffer,
  })

  if (!uploadRes.ok) {
    const err = await uploadRes.text()
    console.error('❌ อัปโหลดรูป Rich Menu ไม่สำเร็จ:', err)
    process.exit(1)
  }

  console.log('✅ อัปโหลดรูป Rich Menu สำเร็จ')

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
