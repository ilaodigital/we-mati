import { supabaseAdmin } from '@/lib/supabase'
import { getStripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  const db = supabaseAdmin()
  const body = await request.json()
  const stripe = getStripe()
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  const id = 'WM-' + Math.random().toString(36).slice(2, 7).toUpperCase()
  const discount = 50
  const total = body.service_price - discount

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

  const { error: dbError } = await db.from('bookings').insert(booking)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: body.email,
      line_items: [{
        price_data: {
          currency: 'nok',
          unit_amount: total * 100,
          product_data: {
            name: body.service_name,
            description: `${body.date} kl. ${body.time} — We-mati Barbershop`,
          },
        },
        quantity: 1,
      }],
      metadata: {
        booking_id: id,
      },
      success_url: `${baseUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${id}`,
      cancel_url: `${baseUrl}/#book`,
    })

    await db.from('bookings').update({ stripe_session_id: session.id }).eq('id', id)

    return NextResponse.json({ url: session.url, booking_id: id })
  } catch (e) {
    await db.from('bookings').delete().eq('id', id)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
