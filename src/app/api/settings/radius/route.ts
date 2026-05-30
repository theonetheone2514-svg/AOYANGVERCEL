import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { MAX_DELIVERY_KM } from '@/lib/utils'

export async function GET() {
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'radius')
    .single()

  const radius = data?.value ? parseFloat(data.value) : MAX_DELIVERY_KM
  return NextResponse.json({ radius })
}
