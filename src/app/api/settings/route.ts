import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withAuth } from '@/lib/api-utils'
import { validate, updateSettingsSchema } from '@/lib/validations'

export async function GET() {
  const { data, error } = await supabase.from('settings').select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const settings: Record<string, string> = {}
  data?.forEach((s: { key: string; value: string }) => { settings[s.key] = s.value })
  return NextResponse.json(settings)
}

export const PUT = withAuth(async (request: Request) => {
  const body = await request.json()
  const parsed = validate(updateSettingsSchema, body)
  if (!parsed.success) return parsed.error

  const updates = Object.entries(parsed.data).map(([key, value]) => ({
    key,
    value: String(value),
  }))

  for (const update of updates) {
    await supabase.from('settings').upsert(update, { onConflict: 'key' })
  }

  return NextResponse.json({ success: true })
}, ['admin'])
