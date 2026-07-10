import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  const db = supabaseAdmin()
  const body = await request.json()
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  const id = 'WM-' + Math.random().toString(36).slice(2, 7).toUpperCase()
  const total = body.service_price - 50

  const booking = {
    id,
    service_id: body.service_id,
    service_name: body.service_name,
    service_price: body.service_price,
    date: body.date,
    time: body.time,
    pay: 'online',
    status: 'pending',
    first_name: body.first_name,
    last_name: body.last_name,
    email: body.email,
    phone: body.phone,
    details: body.details || '',
    total,
  }

  const { error } = await db.from('bookings').insert(booking)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const checkoutUrl = `${baseUrl}/booking/checkout?booking_id=${id}&total=${total}&service=${encodeURIComponent(body.service_name)}`
  return NextResponse.json({ url: checkoutUrl })
}
