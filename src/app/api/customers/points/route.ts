import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withAuth } from '@/lib/api-utils'
import { validate, updatePointsSchema } from '@/lib/validations'

export const PATCH = withAuth(async (request: Request) => {
  const body = await request.json()
  const parsed = validate(updatePointsSchema, body)
  if (!parsed.success) return parsed.error

  const { data, error } = await supabase
    .from('customers').update({ points: parsed.data.points }).eq('id', parsed.data.customer_id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
})
