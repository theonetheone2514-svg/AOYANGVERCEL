import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const storeId = searchParams.get('store_id')

  if (!storeId) {
    return NextResponse.json({ error: 'ต้องระบุ store_id' }, { status: 400 })
  }

  const { data } = await supabase
    .from('ratings')
    .select('rating')
    .eq('store_id', storeId)

  const all = data || []
  const avg = all.length > 0
    ? all.reduce((s, r) => s + r.rating, 0) / all.length
    : 0

  return NextResponse.json({
    average: Math.round(avg * 10) / 10,
    count: all.length,
  })
}
