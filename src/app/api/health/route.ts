import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { error } = await supabase.from('stores').select('id', { count: 'exact', head: true })

  return NextResponse.json({
    status: error ? 'degraded' : 'ok',
    database: error ? 'unreachable' : 'connected',
    timestamp: new Date().toISOString(),
  })
}
