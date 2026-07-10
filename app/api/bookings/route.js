import { supabaseAdmin } from '@/lib/supabase'
import { sendBookingConfirmation } from '@/lib/resend'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const db = supabaseAdmin()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const month = searchParams.get('month')

  if (id) {
    const { data, error } = await db.from('bookings').select('*').eq('id', id).single()
    if (error) return NextResponse.json({ error: error.message }, { status: 404 })
    return NextResponse.json([data])
  }

  let query = db.from('bookings').select('*').order('date').order('time')

  if (month) {
    const [y, m] = month.split('-')
    const start = `${y}-${m}-01`
    const end = new Date(+y, +m, 0).getDate()
    query = query.gte('date', start).lte('date', `${y}-${m}-${String(end).padStart(2, '0')}`)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request) {
  const db = supabaseAdmin()
  const body = await request.json()

  const id = 'WM-' + Math.random().toString(36).slice(2, 7).toUpperCase()
  const total = body.service_price

  const booking = {
    id,
    service_id: body.service_id,
    service_name: body.service_name,
    service_price: body.service_price,
    date: body.date,
    time: body.time,
    pay: 'shop',
    status: 'confirmed',
    first_name: body.first_name,
    last_name: body.last_name,
    email: body.email,
    phone: body.phone,
    details: body.details || '',
    total,
  }

  const { error } = await db.from('bookings').insert(booking)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  try {
    await sendBookingConfirmation(booking)
  } catch (e) {
    console.error('Email send failed:', e)
  }

  return NextResponse.json(booking, { status: 201 })
}
