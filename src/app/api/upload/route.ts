import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { withAuth } from '@/lib/api-utils'
import { checkRateLimit } from '@/lib/rate-limit'

const BUCKET = 'food-images'

let _bucketEnsured = false

async function ensureBucket() {
  if (_bucketEnsured) return
  const admin = getSupabaseAdmin()
  const { data: buckets } = await admin.storage.listBuckets()
  if (!buckets?.find((b) => b.name === BUCKET)) {
    await admin.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
    })
  }
  _bucketEnsured = true
}

export const POST = withAuth(async (request: Request, session) => {
  const limit = checkRateLimit(`upload:${session.user_id}`, { maxRequests: 5, windowMs: 60_000 })
  if (limit) return limit

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'ไม่พบไฟล์' }, { status: 400 })
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'รองรับเฉพาะไฟล์รูปภาพ' }, { status: 400 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'ไฟล์ต้องไม่เกิน 5MB' }, { status: 400 })
  }

  await ensureBucket()

  const ext = file.name.split('.').pop() || 'png'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const buffer = Buffer.from(await file.arrayBuffer())

  const admin = getSupabaseAdmin()

  const { data, error } = await admin.storage
    .from(BUCKET)
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: { publicUrl } } = admin.storage
    .from(BUCKET)
    .getPublicUrl(data.path)

  return NextResponse.json({ url: publicUrl })
}, ['merchant', 'admin'])
