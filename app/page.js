'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { SERVICES, TIMES, DOW, MONTHS_SHORT } from '@/lib/data'

function fmt(d) {
  return DOW[d.getDay()] + ', ' + d.getDate() + '. ' + MONTHS_SHORT[d.getMonth()]
}

function dateStr(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

export default function Home() {
  const [scrolled, setScrolled] = useState(false)
  const [service, setService] = useState(null)
  const [date, setDate] = useState(null)
  const [time, setTime] = useState(null)
  const [pay, setPay] = useState(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [form, setForm] = useState({ first: '', last: '', email: '', phone: '', details: '' })
  const [confirmed, setConfirmed] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const pxRefs = useRef([])
  const bookRef = useRef(null)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40)

      pxRefs.current.forEach(section => {
        if (!section) return
        const rect = section.getBoundingClientRect()
        const wh = window.innerHeight
        const raw = (wh - rect.top) / (wh + rect.height * 0.3)
        const progress = Math.max(0, Math.min(1, raw))
        const opacity = Math.min(1, progress / 0.7)
        const clipPct = Math.max(0, 100 - (progress / 0.7) * 100)
        const ty = -50 + progress * 50

        const content = section.querySelector('[data-px-content]')
        const image = section.querySelector('[data-px-image]')
        if (content) {
          content.style.transform = `translateY(${ty}px)`
          content.style.opacity = opacity
        }
        if (image) {
          image.style.clipPath = `inset(0 ${clipPct}% 0 0)`
          image.style.opacity = opacity
        }
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const weekDays = (() => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    start.setDate(start.getDate() + weekOffset * 7)
    const days = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      days.push(d)
    }
    return days
  })()

  const weekLabel = MONTHS_SHORT[weekDays[0].getMonth()] + ' ' + weekDays[0].getDate() + ' – ' + MONTHS_SHORT[weekDays[6].getMonth()] + ' ' + weekDays[6].getDate()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const blocked = date ? new Set([
    (date.getDate() * 3) % TIMES.length,
    (date.getDate() * 5 + 1) % TIMES.length,
    (date.getDate() * 7 + 3) % TIMES.length,
  ]) : new Set()

  const sub = service ? service.price : 0
  const disc = pay === 'online' && service ? 50 : 0
  const total = sub - disc

  const ready = service && date && time && pay && form.first && form.last && form.email && form.phone

  const selectServiceAndBook = useCallback((sid) => {
    const svc = SERVICES.find(s => s.id === sid)
    if (svc) {
      setService(svc)
      setTimeout(() => bookRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }, [])

  async function handleSubmit() {
    if (!ready || submitting) return
    setSubmitting(true)

    const bookingData = {
      service_id: service.id,
      service_name: service.name,
      service_price: service.price,
      date: dateStr(date),
      time,
      pay,
      first_name: form.first,
      last_name: form.last,
      email: form.email,
      phone: form.phone,
      details: form.details,
    }

    try {
      const endpoint = pay === 'online' ? '/api/payments/create' : '/api/bookings'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      })

      const text = await res.text()
      let data
      try { data = JSON.parse(text) } catch { throw new Error('Serverfeil. Sjekk at alle miljøvariabler er satt i Vercel.') }

      if (!res.ok) throw new Error(data.error || 'Noe gikk galt')

      if (pay === 'online' && data.url) {
        window.location.href = data.url
        return
      }

      setConfirmed(data)
    } catch (e) {
      alert(e.message || 'Noe gikk galt. Prøv igjen.')
      setSubmitting(false)
    }
  }

  const parallaxSections = [
    { title: 'Presisjon', text: 'Hvert klipp er utført med omhu og presisjon. Vi tar oss tid til å forstå din stil og leverer et resultat du kan være stolt av — hver gang.', img: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=700&q=80' },
    { title: 'Tradisjon', text: 'Tidløst håndverk møter moderne teknikk. Fra klassiske sakseklipp til skarpe fades — vi behersker det hele med årelang erfaring.', img: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=700&q=80', reverse: true },
    { title: 'Opplevelsen', text: 'Mer enn bare en klipp — en opplevelse. Slapp av i stolen, nyt en kopp kaffe, og la oss ta vare på resten.', img: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=700&q=80' },
  ]

  const servicesWithDesc = [
    { ...SERVICES[0], fullDesc: 'Konsultasjon, klipp & styling', displayPrice: '300 kr' },
    { ...SERVICES[1], fullDesc: 'Skarp fade & detaljering', displayPrice: '300–350 kr' },
    { ...SERVICES[2], fullDesc: 'Trimmer over hele hodet', displayPrice: '200 kr' },
    { ...SERVICES[3], fullDesc: 'Tradisjonell barbering', displayPrice: '300 kr' },
    { ...SERVICES[4], fullDesc: 'Forming & trimming av skjegg', displayPrice: '200 kr' },
    { ...SERVICES[5], fullDesc: 'Komplett klipp & skjeggtrim', displayPrice: '400 kr' },
    { ...SERVICES[6], fullDesc: 'Klipp for de yngste', displayPrice: '200 kr' },
    { ...SERVICES[7], fullDesc: 'Klipp & styling', displayPrice: '250 kr' },
    { ...SERVICES[8], fullDesc: 'Rabattert klipp', displayPrice: '250 kr' },
    { ...SERVICES[9], fullDesc: 'Vask, føn & styling', displayPrice: '100 kr' },
    { ...SERVICES[10], fullDesc: 'Profesjonell farging', displayPrice: '200 kr' },
  ]

  return (
    <>
      <header className={scrolled ? 'scrolled' : ''}>
        <div className="container nav">
          <div className="brand">We-mati<sup>®</sup></div>
          <ul className="nav-links">
            <li><a href="#home">Hjem</a></li>
            <li><a href="#services">Tjenester</a></li>
            <li><a href="#book">Bestill</a></li>
          </ul>
          <a href="#book" className="btn btn-nav">Bestill Nå</a>
          <button className="burger">☰</button>
        </div>
      </header>

      <section className="hero" id="home">
        <video className="hero-video" autoPlay muted loop playsInline>
          <source src="/video/hero.mp4" type="video/mp4" />
        </video>
        <div className="hero-overlay" />
        <div className="container">
          <span className="eyebrow">Heimdalvegen 8</span>
          <h1><span>We-mati<span style={{ color: 'var(--accent)' }}>.</span></span></h1>
          <p>Der stil møter presisjon – din frisør i Heimdal</p>
          <div className="hero-cta">
            <a href="#book" className="btn">Bestill Time</a>
            <a href="#services" className="btn btn-light">Våre Tjenester</a>
          </div>
        </div>
        <div className="hero-meta">Scroll for å utforske</div>
      </section>

      <div className="runner">
        <div className="container">
          <div className="it"><b>✦</b> Erfarne Barbere</div>
          <div className="it"><b>✦</b> Tradisjonell Barbering</div>
          <div className="it"><b>✦</b> Drop-in Velkommen</div>
          <div className="it"><b>✦</b> Åpent 7 Dager</div>
        </div>
      </div>

      {parallaxSections.map((s, i) => (
        <div key={i} ref={el => pxRefs.current[i] = el} className={'px-section' + (s.reverse ? ' reverse' : '')}>
          <div className="px-content" data-px-content="">
            <h2>{s.title}</h2>
            <p>{s.text}</p>
          </div>
          <div className="px-image" data-px-image="">
            <img src={s.img} alt={s.title} />
          </div>
        </div>
      ))}

      <section className="services" id="services">
        <div className="container">
          <div className="lead">
            <div><span className="eyebrow">Prisliste</span><h2>Tjenester</h2></div>
            <p>Ærlige, transparente priser. Betal på nett og spar 50 kr på hver tjeneste.</p>
          </div>
          <div className="serv-grid">
            {servicesWithDesc.map(s => (
              <div key={s.id} className="serv" onClick={() => selectServiceAndBook(s.id)}>
                <div>
                  <div className="name">{s.name}</div>
                  <div className="desc">{s.fullDesc}</div>
                </div>
                <div className="amt">{s.displayPrice}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="book" id="book" ref={bookRef}>
        <div className="container">
          <div className="lead">
            <div><span className="eyebrow">Bestill Time</span><h2>Reserver Din Stol</h2></div>
            <p>Velg en tjeneste, velg en tid, og fullfør på under et minutt. Betal på nett og spar 50 kr.</p>
          </div>

          {confirmed ? (
            <div className="book-wrap">
              <div className="confirm">
                <div className="ok-icon">✓</div>
                <h3>Bestilling Bekreftet</h3>
                <p><b>{confirmed.service_name}</b></p>
                <p>{confirmed.date} · {confirmed.time}</p>
                <p style={{ marginTop: 10 }} dangerouslySetInnerHTML={{
                  __html: confirmed.pay === 'online'
                    ? `Du er belastet <b>${confirmed.total} kr</b> — en kvittering er på vei.`
                    : `Vennligst betal <b>${confirmed.total} kr</b> i butikken på dagen for din time.`
                }} />
                <div className="ref">{confirmed.id}</div>
                <p style={{ marginTop: 16, fontSize: 14 }}>En bekreftelse er sendt til <b>{confirmed.email}</b>.</p>
              </div>
            </div>
          ) : (
            <div className="book-wrap">
              <div className="card">
                {/* 1. SERVICE */}
                <div className="step">
                  <div className="step-h"><div className="num">1</div><h3>Velg Tjeneste</h3></div>
                  <div className="opt-grid">
                    {SERVICES.map(s => (
                      <div key={s.id} className={'opt' + (service?.id === s.id ? ' sel' : '')} onClick={() => setService(s)}>
                        <div><div className="n">{s.name}</div><div className="d">{s.desc}</div></div>
                        <div className="p">{s.price} kr</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. DATE */}
                <div className="step">
                  <div className="step-h"><div className="num">2</div><h3>Velg Dato</h3></div>
                  <div className="cal-nav">
                    <button type="button" onClick={() => weekOffset > 0 && setWeekOffset(w => w - 1)}>‹</button>
                    <b>{weekLabel}</b>
                    <button type="button" onClick={() => setWeekOffset(w => w + 1)}>›</button>
                  </div>
                  <div className="date-strip">
                    {weekDays.map((d, i) => {
                      const past = d < today
                      const selected = date && d.toDateString() === date.toDateString()
                      return (
                        <div key={i}
                          className={'day' + (past ? ' dis' : '') + (selected ? ' sel' : '')}
                          onClick={() => { if (!past) { setDate(d); setTime(null) } }}
                        >
                          <div className="dow">{DOW[d.getDay()]}</div>
                          <div className="dn">{d.getDate()}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 3. TIME */}
                <div className="step">
                  <div className="step-h"><div className="num">3</div><h3>Velg Tid</h3></div>
                  <div className="times">
                    {TIMES.map((t, i) => {
                      const dis = !date || blocked.has(i)
                      return (
                        <div key={t}
                          className={'time' + (dis ? ' dis' : '') + (time === t ? ' sel' : '')}
                          onClick={() => { if (!dis) setTime(t) }}
                        >{t}</div>
                      )
                    })}
                  </div>
                </div>

                {/* 4. PAYMENT */}
                <div className="step">
                  <div className="step-h"><div className="num">4</div><h3>Betalingsmetode</h3></div>
                  <div className="pay-grid">
                    <div className={'pay' + (pay === 'online' ? ' sel' : '')} onClick={() => setPay('online')}>
                      <span className="save">Spar 50 kr</span>
                      <div className="t">Betal på Nett</div>
                      <div className="s">Kort / Vipps. Bekreftet umiddelbart og 50 kr billigere.</div>
                    </div>
                    <div className={'pay' + (pay === 'shop' ? ' sel' : '')} onClick={() => setPay('shop')}>
                      <div className="t">Betal i Butikk</div>
                      <div className="s">Kort eller kontant på dagen. Standard pris.</div>
                    </div>
                  </div>
                </div>

                {/* 5. SPECIAL DETAILS */}
                <div className="step">
                  <div className="step-h"><div className="num">5</div><h3>Spesielle Ønsker</h3></div>
                  <div className="field">
                    <label>Har du noen spesielle ønsker eller informasjon?</label>
                    <textarea rows={3} placeholder="F.eks. spesiell frisyre, allergier, eller annen informasjon..."
                      value={form.details} onChange={e => setForm(f => ({ ...f, details: e.target.value }))} />
                  </div>
                </div>

                {/* 6. DETAILS */}
                <div className="step">
                  <div className="step-h"><div className="num">6</div><h3>Dine Detaljer</h3></div>
                  <div className="row2">
                    <div className="field"><label>Fornavn</label><input type="text" placeholder="Ola" value={form.first} onChange={e => setForm(f => ({ ...f, first: e.target.value }))} /></div>
                    <div className="field"><label>Etternavn</label><input type="text" placeholder="Nordmann" value={form.last} onChange={e => setForm(f => ({ ...f, last: e.target.value }))} /></div>
                  </div>
                  <div className="row2">
                    <div className="field"><label>E-post</label><input type="email" placeholder="din@epost.no" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
                    <div className="field"><label>Telefon</label><input type="tel" placeholder="+47 ..." value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
                  </div>
                </div>

                <button className="btn" disabled={!ready || submitting} onClick={handleSubmit} style={{ width: '100%' }}>
                  {submitting ? 'Sender...' : 'Bekreft Bestilling'}
                </button>
              </div>

              {/* Summary sidebar */}
              <div>
                <div className="card summary">
                  <h3>Din Bestilling</h3>
                  <div className="sm-row"><span className="k">Tjeneste</span><span className={'v' + (!service ? ' empty' : '')}>{service?.name || '—'}</span></div>
                  <div className="sm-row"><span className="k">Dato</span><span className={'v' + (!date ? ' empty' : '')}>{date ? fmt(date) : '—'}</span></div>
                  <div className="sm-row"><span className="k">Tid</span><span className={'v' + (!time ? ' empty' : '')}>{time || '—'}</span></div>
                  <div className="sm-row"><span className="k">Betaling</span><span className={'v' + (!pay ? ' empty' : '')}>
                    {pay === 'online' ? 'Nettbetaling (−50 kr)' : pay === 'shop' ? 'Betal i butikk' : '—'}
                  </span></div>
                  <div className="totals">
                    <div className="sm-row"><span className="k">Delsum</span><span className="v">{sub} kr</span></div>
                    {disc > 0 && <div className="sm-row disc"><span className="k">Nettrabatt</span><span className="v">−50 kr</span></div>}
                    <div className="grand"><span className="k">Totalt</span><span className="v">{total} kr</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <footer id="contact">
        <div className="container foot-grid">
          <div>
            <div className="foot-brand">We-mati<sup>®</sup></div>
            <p>Profesjonell barbering for den moderne mannen. Tradisjon, presisjon og en perfekt finish.</p>
            <p style={{ marginTop: 14 }}>@wemati · /wemati</p>
          </div>
          <div><h4>Åpningstider</h4><ul><li>Man – Fre · 9–20</li><li>Lørdag · 9–18</li><li>Søndag · 10–16</li></ul></div>
          <div><h4>Besøk Oss</h4><ul><li>Heimdalvegen 8</li><li>7080 Heimdal</li></ul></div>
          <div><h4>Kontakt</h4><ul><li>97 25 37 38</li><li>hello@we-mati.no</li><li style={{ marginTop: 16 }}><a href="/admin" style={{ color: 'var(--accent)', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'Archivo', fontWeight: 600 }}>Admin →</a></li></ul></div>
        </div>
        <div className="copy">© 2026 We-mati Barbershop</div>
      </footer>
    </>
  )
}
