import { supabaseAdmin } from '@/lib/supabase'
import { sendBookingConfirmation } from '@/lib/resend'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  const { booking_id } = await request.json()
  if (!booking_id) return NextResponse.json({ error: 'Missing booking_id' }, { status: 400 })

  const db = supabaseAdmin()

  const { data: booking } = await db.from('bookings').select('*').eq('id', booking_id).single()
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  if (booking.status !== 'confirmed') {
    await db.from('bookings').update({ status: 'confirmed' }).eq('id', booking_id)
    try {
      await sendBookingConfirmation({ ...booking, status: 'confirmed' })
    } catch (e) {
      console.error('Email send failed:', e)
    }
  }

  const { data: updated } = await db.from('bookings').select('*').eq('id', booking_id).single()
  return NextResponse.json(updated)
}
