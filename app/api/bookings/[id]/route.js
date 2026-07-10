import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function PUT(request, { params }) {
  const db = supabaseAdmin()
  const { id } = await params
  const body = await request.json()

  const discount = body.pay === 'online' ? 50 : 0
  const total = body.service_price - discount

  const { error } = await db.from('bookings').update({
    service_id: body.service_id,
    service_name: body.service_name,
    service_price: body.service_price,
    date: body.date,
    time: body.time,
    pay: body.pay,
    first_name: body.first_name,
    last_name: body.last_name,
    email: body.email,
    phone: body.phone,
    details: body.details || '',
    total,
  }).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request, { params }) {
  const db = supabaseAdmin()
  const { id } = await params
  const { error } = await db.from('bookings').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
