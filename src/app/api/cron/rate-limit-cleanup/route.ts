import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const authHeader = process.env.CRON_SECRET
    ? { 'Authorization': `Bearer ${process.env.CRON_SECRET}` }
    : undefined

  if (authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase.rpc('rate_limit_cleanup')

  if (error) {
    console.error(JSON.stringify({ level: 'error', message: 'rate_limit_cleanup failed', error: error.message, timestamp: new Date().toISOString() }))
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, cleaned: data })
}
