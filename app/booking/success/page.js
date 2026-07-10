'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'

function SuccessContent() {
  const params = useSearchParams()
  const bookingId = params.get('booking_id')
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!bookingId) { setLoading(false); return }

    let attempts = 0
    const poll = async () => {
      try {
        const res = await fetch(`/api/bookings?id=${bookingId}`)
        const data = await res.json()
        const found = Array.isArray(data) ? data.find(b => b.id === bookingId) : null
        if (found && found.status === 'confirmed') {
          setBooking(found)
          setLoading(false)
          return
        }
      } catch {}
      attempts++
      if (attempts < 10) setTimeout(poll, 2000)
      else setLoading(false)
    }
    poll()
  }, [bookingId])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--line)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--muted)', fontFamily: 'Archivo', textTransform: 'uppercase', letterSpacing: 2, fontSize: 13 }}>Bekrefter betaling...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (!booking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 32 }}>
        <h2 style={{ fontFamily: 'Archivo', textTransform: 'uppercase' }}>Noe gikk galt</h2>
        <p style={{ color: 'var(--muted)' }}>Vi kunne ikke bekrefte betalingen. Kontakt oss på 97 25 37 38.</p>
        <Link href="/" className="btn" style={{ marginTop: 16 }}>Tilbake til forsiden</Link>
      </div>
    )
  }

  const payText = `Du er belastet <b>${booking.total} kr</b> — en kvittering er på vei.`

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div className="confirm" style={{ maxWidth: 520 }}>
        <div className="ok-icon">✓</div>
        <h3>Bestilling Bekreftet</h3>
        <p><b>{booking.service_name}</b></p>
        <p>{booking.date} · {booking.time}</p>
        <p style={{ marginTop: 10 }} dangerouslySetInnerHTML={{ __html: payText }} />
        {booking.details && (
          <p style={{ marginTop: 10, fontSize: 14, color: 'var(--muted)' }}><b>Spesielle ønsker:</b> {booking.details}</p>
        )}
        <div className="ref">{booking.id}</div>
        <p style={{ marginTop: 16, fontSize: 14 }}>En bekreftelse er sendt til <b>{booking.email}</b>.</p>
        <Link href="/" className="btn" style={{ marginTop: 24 }}>Tilbake til forsiden</Link>
      </div>
    </div>
  )
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--muted)' }}>Laster...</p>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
