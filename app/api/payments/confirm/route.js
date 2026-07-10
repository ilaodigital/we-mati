import { supabaseAdmin } from '@/lib/supabase'
import { getStripe } from '@/lib/stripe'
import { sendBookingConfirmation } from '@/lib/resend'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  const { booking_id, session_id } = await request.json()
  if (!booking_id || !session_id) {
    return NextResponse.json({ error: 'Missing booking_id or session_id' }, { status: 400 })
  }

  const db = supabaseAdmin()
  const stripe = getStripe()

  const { data: booking } = await db.from('bookings').select('*').eq('id', booking_id).single()
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  if (booking.status === 'confirmed') return NextResponse.json(booking)

  const session = await stripe.checkout.sessions.retrieve(session_id)
  if (session.payment_status !== 'paid') {
    return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
  }

  await db.from('bookings').update({ status: 'confirmed' }).eq('id', booking_id)

  try {
    await sendBookingConfirmation({ ...booking, status: 'confirmed' })
  } catch (e) {
    console.error('Email send failed:', e)
  }

  const { data: updated } = await db.from('bookings').select('*').eq('id', booking_id).single()
  return NextResponse.json(updated)
}
