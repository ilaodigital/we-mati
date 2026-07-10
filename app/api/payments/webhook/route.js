import { supabaseAdmin } from '@/lib/supabase'
import { getStripe } from '@/lib/stripe'
import { sendBookingConfirmation } from '@/lib/resend'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  const stripe = getStripe()
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (e) {
    console.error('Webhook signature verification failed:', e.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const bookingId = session.metadata?.booking_id

    if (!bookingId) {
      return NextResponse.json({ error: 'No booking_id in metadata' }, { status: 400 })
    }

    const db = supabaseAdmin()

    const { error: updateError } = await db
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', bookingId)

    if (updateError) {
      console.error('Failed to confirm booking:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    const { data: booking } = await db
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (booking) {
      try {
        await sendBookingConfirmation(booking)
      } catch (e) {
        console.error('Email send failed:', e)
      }
    }
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object
    const bookingId = session.metadata?.booking_id
    if (bookingId) {
      const db = supabaseAdmin()
      await db.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId)
    }
  }

  return NextResponse.json({ received: true })
}
