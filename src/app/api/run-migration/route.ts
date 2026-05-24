import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'not allowed' }, { status: 403 })
  }

  const sql = `
    alter table stores add column if not exists line_user_id text;
  `

  const { error } = await supabase.rpc('exec_sql', { sql })

  if (error) {
    // Try alternative - use raw query
    const { error: sqlError } = await supabase.from('stores').update({ name: 'test' }).eq('id', 'NONEXISTENT').select()
    return NextResponse.json({ error: error.message, sqlError: sqlError?.message })
  }

  return NextResponse.json({ success: true })
}
