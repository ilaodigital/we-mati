'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function CheckoutContent() {
  const params = useSearchParams()
  const router = useRouter()
  const bookingId = params.get('booking_id')
  const total = params.get('total')
  const service = params.get('service')
  const [paying, setPaying] = useState(null)

  async function handlePay(method) {
    setPaying(method)
    await fetch('/api/payments/confirm-demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: bookingId }),
    })
    router.push(`/booking/success?booking_id=${bookingId}`)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, background: 'var(--bg)' }}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 12, padding: '40px 48px', maxWidth: 440, width: '100%', textAlign: 'center' }}>
        <div style={{ fontFamily: 'Archivo', fontWeight: 800, fontSize: 22, letterSpacing: 2, color: 'var(--accent)', marginBottom: 4 }}>WE-MATI</div>
        <div style={{ color: 'var(--muted)', fontSize: 13, letterSpacing: 1, marginBottom: 32 }}>SIKKER BETALING</div>

        <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '16px 20px', marginBottom: 32, textAlign: 'left' }}>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>DU BETALER FOR</div>
          <div style={{ fontWeight: 700, marginBottom: 2 }}>{service}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>{total} kr</div>
        </div>

        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>Velg betalingsmetode</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={() => handlePay('vipps')}
            disabled={!!paying}
            style={{
              background: paying === 'vipps' ? '#e05c00' : '#ff5b24',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '16px 24px',
              fontSize: 16,
              fontWeight: 700,
              cursor: paying ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              opacity: paying && paying !== 'vipps' ? 0.4 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {paying === 'vipps' ? 'Behandler...' : (
              <>
                <svg width="22" height="22" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="20" fill="#fff"/><text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#ff5b24">V</text></svg>
                Betal med Vipps
              </>
            )}
          </button>

          <button
            onClick={() => handlePay('card')}
            disabled={!!paying}
            style={{
              background: paying === 'card' ? '#8a7230' : 'var(--accent)',
              color: '#12100e',
              border: 'none',
              borderRadius: 8,
              padding: '16px 24px',
              fontSize: 16,
              fontWeight: 700,
              cursor: paying ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              opacity: paying && paying !== 'card' ? 0.4 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {paying === 'card' ? 'Behandler...' : (
              <>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                Betal med Kort
              </>
            )}
          </button>
        </div>

        <p style={{ marginTop: 24, fontSize: 12, color: 'var(--muted)' }}>🔒 Sikker betaling — dine kortopplysninger er trygge</p>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--muted)' }}>Laster...</p>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
