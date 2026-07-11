'use client'

import { useState, useEffect, useCallback } from 'react'
import { SERVICES, TIMES, DOW_FULL, MONTHS } from '@/lib/data'
import Link from 'next/link'

export default function AdminPage() {
  const [tab, setTab] = useState('calendar')
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [selectedDate, setSelectedDate] = useState(null)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [modalData, setModalData] = useState({
    service_id: SERVICES[0].id, date: '', time: '09:00', pay: 'shop',
    first_name: '', last_name: '', email: '', phone: '', details: '',
  })

  const monthStr = calYear + '-' + String(calMonth + 1).padStart(2, '0')

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/bookings?month=${monthStr}`)
      const data = await res.json()
      setBookings(Array.isArray(data) ? data : [])
    } catch {
      setBookings([])
    } finally {
      setLoading(false)
    }
  }, [monthStr])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  function shiftMonth(dir) {
    let m = calMonth + dir, y = calYear
    if (m < 0) { m = 11; y-- }
    if (m > 11) { m = 0; y++ }
    setCalMonth(m); setCalYear(y); setSelectedDate(null)
  }

  function goToday() {
    const now = new Date()
    setCalYear(now.getFullYear()); setCalMonth(now.getMonth())
    const d = now.getDate()
    setSelectedDate(now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0'))
  }

  // Calendar grid
  const firstDay = new Date(calYear, calMonth, 1)
  const startDay = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const daysInPrev = new Date(calYear, calMonth, 0).getDate()
  const todayStr = (() => { const n = new Date(); return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0') })()

  const countsByDate = {}
  bookings.forEach(b => { countsByDate[b.date] = (countsByDate[b.date] || 0) + 1 })

  const calCells = []
  for (let i = startDay - 1; i >= 0; i--) calCells.push({ day: daysInPrev - i, other: true })
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = calYear + '-' + String(calMonth + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0')
    calCells.push({ day: d, dateStr: ds, today: ds === todayStr, count: countsByDate[ds] || 0 })
  }
  const remainder = calCells.length % 7
  if (remainder > 0) for (let i = 1; i <= 7 - remainder; i++) calCells.push({ day: i, other: true })

  const dayBookings = selectedDate ? bookings.filter(b => b.date === selectedDate).sort((a, b) => a.time < b.time ? -1 : 1) : []

  const selectedDateObj = selectedDate ? (() => { const p = selectedDate.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]) })() : null
  const dayTitle = selectedDateObj ? DOW_FULL[selectedDateObj.getDay()] + ' ' + selectedDateObj.getDate() + '. ' + MONTHS[selectedDateObj.getMonth()] + ' ' + selectedDateObj.getFullYear() : ''

  // Modal
  function openAdd(dateOverride) {
    setEditingId(null)
    setModalData({
      service_id: SERVICES[0].id, date: dateOverride || selectedDate || todayStr,
      time: '09:00', pay: 'shop', first_name: '', last_name: '', email: '', phone: '', details: '',
    })
    setModalOpen(true)
  }

  function openEdit(b) {
    setEditingId(b.id)
    setModalData({
      service_id: b.service_id, date: b.date, time: b.time, pay: b.pay,
      first_name: b.first_name, last_name: b.last_name, email: b.email, phone: b.phone, details: b.details || '',
    })
    setModalOpen(true)
  }

  async function saveModal() {
    const svc = SERVICES.find(s => s.id === modalData.service_id)
    if (!modalData.first_name || !modalData.last_name || !modalData.date || !modalData.time) {
      alert('Vennligst fyll ut navn, dato og tid.'); return
    }
    const body = { ...modalData, service_name: svc.name, service_price: svc.price }
    if (editingId) {
      await fetch(`/api/bookings/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    } else {
      await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    }
    setModalOpen(false)
    fetchBookings()
  }

  async function handleDelete(id) {
    if (!confirm('Er du sikker på at du vil slette denne bestillingen?')) return
    await fetch(`/api/bookings/${id}`, { method: 'DELETE' })
    setModalOpen(false)
    fetchBookings()
  }

  async function handleStatus(id, status) {
    await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchBookings()
  }

  // Stats
  const totalBooked = bookings.length
  const totalSlots = daysInMonth * TIMES.length
  const available = totalSlots - totalBooked
  const finished = bookings.filter(b => b.status === 'finished').length
  const noShows = bookings.filter(b => b.status === 'no_show').length
  const revenue = bookings.filter(b => b.status === 'finished').reduce((s, b) => s + b.total, 0)
  const expectedRevenue = bookings.filter(b => ['confirmed', 'finished'].includes(b.status)).reduce((s, b) => s + b.total, 0)

  const svcCounts = {}, svcRevenue = {}
  bookings.forEach(b => {
    svcCounts[b.service_name] = (svcCounts[b.service_name] || 0) + 1
    svcRevenue[b.service_name] = (svcRevenue[b.service_name] || 0) + b.total
  })
  const svcBreakdown = Object.keys(svcCounts).map(k => ({ name: k, count: svcCounts[k], rev: svcRevenue[k] })).sort((a, b) => b.count - a.count)

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sb-brand"><span>We-mati<sup>®</sup></span><small>Admin</small></div>
        <nav className="sb-nav">
          <button className={'sb-link' + (tab === 'calendar' ? ' active' : '')} onClick={() => setTab('calendar')}>
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>Kalender</span>
          </button>
          <button className={'sb-link' + (tab === 'stats' ? ' active' : '')} onClick={() => setTab('stats')}>
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            <span>Statistikk</span>
          </button>
        </nav>
        <div className="sb-foot"><Link href="/">← Tilbake til nettside</Link></div>
      </aside>

      <div className="admin-main">
        <div className="topbar">
          <h1>{tab === 'calendar' ? 'Kalender' : 'Statistikk'}</h1>
          <button className="btn btn-primary" onClick={() => openAdd()}>
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Ny Bestilling
          </button>
        </div>

        <div className="admin-content">
          {/* CALENDAR TAB */}
          <div className={'tab-panel' + (tab === 'calendar' ? ' active' : '')}>
            <div className="cal-header">
              <h2>{MONTHS[calMonth]} {calYear}</h2>
              <div className="cal-arrows">
                <button onClick={() => shiftMonth(-1)}>‹</button>
                <button onClick={goToday}>I dag</button>
                <button onClick={() => shiftMonth(1)}>›</button>
              </div>
            </div>
            <div className="cal-grid">
              {['Man','Tir','Ons','Tor','Fre','Lør','Søn'].map(d => <div key={d} className="cal-dow">{d}</div>)}
              {calCells.map((cell, i) => (
                <div key={i}
                  className={'cal-cell' + (cell.other ? ' other' : '') + (cell.today ? ' today' : '') + (cell.dateStr === selectedDate ? ' selected' : '')}
                  onClick={() => !cell.other && setSelectedDate(cell.dateStr)}
                >
                  <div className="d">{cell.day}</div>
                  {!cell.other && cell.count > 0 && (
                    <>
                      <div className="dots">{Array.from({ length: Math.min(cell.count, 6) }).map((_, j) => <div key={j} className="dot" />)}</div>
                      <div className="count">{cell.count} bestilling{cell.count > 1 ? 'er' : ''}</div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {selectedDate && (
              <div className="day-panel">
                <div className="day-panel-header">
                  <h3>{dayTitle}</h3>
                  <button className="btn btn-primary" onClick={() => openAdd(selectedDate)}>
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Legg Til
                  </button>
                </div>
                {dayBookings.length === 0 ? (
                  <div className="day-panel-empty">Ingen bestillinger denne dagen.</div>
                ) : (
                  <ul className="bk-list">
                    {dayBookings.map(b => (
                      <li key={b.id} className={'bk-item bk-status-' + b.status}>
                        <div className="bk-time">{b.time}</div>
                        <div className="bk-info">
                          <div className="bk-name">{b.first_name} {b.last_name}</div>
                          <div className="bk-svc">{b.service_name}{b.details ? ' · ' + b.details : ''}</div>
                        </div>
                        <div className={'bk-pay ' + (b.pay || 'shop')}>{b.pay === 'online' ? 'Nettbetaling' : 'I butikk'}</div>
                        <div className="bk-total">{b.total} kr</div>
                        <div className="bk-status-btns">
                          {b.status === 'finished' ? (
                            <span className="status-badge finished">✓ Fullført</span>
                          ) : b.status === 'no_show' ? (
                            <span className="status-badge no-show">✗ No-show</span>
                          ) : (
                            <>
                              <button className="status-btn done" title="Fullført" onClick={() => handleStatus(b.id, 'finished')}>✓ Fullført</button>
                              <button className="status-btn noshow" title="Møtte ikke opp" onClick={() => handleStatus(b.id, 'no_show')}>✗ No-show</button>
                            </>
                          )}
                        </div>
                        <div className="bk-actions">
                          <button title="Rediger" onClick={() => openEdit(b)}>
                            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button title="Slett" onClick={() => handleDelete(b.id)}>
                            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* STATS TAB */}
          <div className={'tab-panel' + (tab === 'stats' ? ' active' : '')}>
            <div className="stats-grid">
              <div className="stat-card gold">
                <div className="label">Bestillinger denne måneden</div>
                <div className="value">{totalBooked}</div>
                <div className="sub">{MONTHS[calMonth]} {calYear}</div>
              </div>
              <div className="stat-card green">
                <div className="label">Fullførte klipp</div>
                <div className="value">{finished}</div>
                <div className="sub">{noShows} no-show{noShows !== 1 ? 's' : ''} · {totalBooked - finished - noShows} kommende</div>
              </div>
              <div className="stat-card brown-accent">
                <div className="label">Faktisk omsetning</div>
                <div className="value">{revenue.toLocaleString('no-NO')} kr</div>
                <div className="sub">Forventet totalt: {expectedRevenue.toLocaleString('no-NO')} kr</div>
              </div>
              <div className="stat-card">
                <div className="label">Ledige tider</div>
                <div className="value">{available}</div>
                <div className="sub">av {totalSlots} totalt ({daysInMonth} dager × {TIMES.length} tider)</div>
              </div>
            </div>
            <div className="breakdown">
              <h3>Tjenester denne måneden</h3>
              <table>
                <thead><tr><th>Tjeneste</th><th>Antall</th><th>Omsetning</th></tr></thead>
                <tbody>
                  {svcBreakdown.map(e => (
                    <tr key={e.name}>
                      <td style={{ fontFamily: 'Archivo', fontWeight: 600, textTransform: 'uppercase', fontSize: 13, letterSpacing: '.5px' }}>{e.name}</td>
                      <td>{e.count}</td>
                      <td>{e.rev.toLocaleString('no-NO')} kr</td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td>Totalt</td>
                    <td>{totalBooked}</td>
                    <td>{revenue.toLocaleString('no-NO')} kr</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      <div className={'modal-overlay' + (modalOpen ? ' open' : '')} onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
        <div className="modal">
          <div className="modal-header">
            <h3>{editingId ? 'Rediger Bestilling' : 'Ny Bestilling'}</h3>
            <button className="modal-close" onClick={() => setModalOpen(false)}>×</button>
          </div>
          <div className="modal-body">
            <div className="field">
              <label>Tjeneste</label>
              <select value={modalData.service_id} onChange={e => setModalData(d => ({ ...d, service_id: e.target.value }))}>
                {SERVICES.map(s => <option key={s.id} value={s.id}>{s.name} — {s.price} kr</option>)}
              </select>
            </div>
            <div className="row2">
              <div className="field"><label>Dato</label><input type="date" value={modalData.date} onChange={e => setModalData(d => ({ ...d, date: e.target.value }))} /></div>
              <div className="field"><label>Tid</label>
                <select value={modalData.time} onChange={e => setModalData(d => ({ ...d, time: e.target.value }))}>
                  {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="field">
              <label>Betaling</label>
              <select value={modalData.pay} onChange={e => setModalData(d => ({ ...d, pay: e.target.value }))}>
                <option value="online">Nettbetaling (−50 kr)</option>
                <option value="shop">Betal i butikk</option>
              </select>
            </div>
            <div className="row2">
              <div className="field"><label>Fornavn</label><input value={modalData.first_name} onChange={e => setModalData(d => ({ ...d, first_name: e.target.value }))} placeholder="Ola" /></div>
              <div className="field"><label>Etternavn</label><input value={modalData.last_name} onChange={e => setModalData(d => ({ ...d, last_name: e.target.value }))} placeholder="Nordmann" /></div>
            </div>
            <div className="row2">
              <div className="field"><label>E-post</label><input type="email" value={modalData.email} onChange={e => setModalData(d => ({ ...d, email: e.target.value }))} placeholder="epost@eksempel.no" /></div>
              <div className="field"><label>Telefon</label><input type="tel" value={modalData.phone} onChange={e => setModalData(d => ({ ...d, phone: e.target.value }))} placeholder="+47 ..." /></div>
            </div>
            <div className="field">
              <label>Spesielle ønsker</label>
              <textarea rows={2} value={modalData.details} onChange={e => setModalData(d => ({ ...d, details: e.target.value }))} placeholder="Valgfritt..." />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Avbryt</button>
            {editingId && <button className="btn btn-danger" onClick={() => handleDelete(editingId)}>Slett</button>}
            <button className="btn btn-primary" onClick={saveModal}>Lagre</button>
          </div>
        </div>
      </div>
    </div>
  )
}
