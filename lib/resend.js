import { Resend } from 'resend'

let _resend = null

function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

export async function sendBookingConfirmation(booking) {
  const from = process.env.RESEND_FROM_EMAIL || 'bestilling@we-mati.no'

  const payText = booking.pay === 'online'
    ? `Du er belastet <strong>${booking.total} kr</strong> — en kvittering er på vei.`
    : `Vennligst betal <strong>${booking.total} kr</strong> i butikken på dagen for din time.`

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#12100e">
      <div style="background:#2c1810;padding:28px 32px;text-align:center">
        <h1 style="color:#c9a84c;font-size:24px;margin:0;letter-spacing:2px">WE-MATI</h1>
      </div>
      <div style="padding:32px;background:#faf8f4;border:1px solid #d8d0c4;border-top:none">
        <h2 style="font-size:22px;margin:0 0 16px;color:#12100e">Bestilling Bekreftet</h2>
        <p style="color:#7a7068;margin:0 0 24px">Takk for din bestilling hos We-mati!</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
          <tr>
            <td style="padding:10px 0;color:#7a7068;font-size:13px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #d8d0c4">Tjeneste</td>
            <td style="padding:10px 0;text-align:right;font-weight:700;border-bottom:1px solid #d8d0c4">${booking.service_name}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#7a7068;font-size:13px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #d8d0c4">Dato</td>
            <td style="padding:10px 0;text-align:right;font-weight:700;border-bottom:1px solid #d8d0c4">${booking.date}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#7a7068;font-size:13px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #d8d0c4">Tid</td>
            <td style="padding:10px 0;text-align:right;font-weight:700;border-bottom:1px solid #d8d0c4">${booking.time}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#7a7068;font-size:13px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #d8d0c4">Referanse</td>
            <td style="padding:10px 0;text-align:right;font-weight:700;color:#c9a84c;border-bottom:1px solid #d8d0c4">${booking.id}</td>
          </tr>
        </table>
        <p style="margin:0 0 24px">${payText}</p>
        ${booking.details ? `<p style="color:#7a7068;margin:0 0 24px"><strong>Spesielle ønsker:</strong> ${booking.details}</p>` : ''}
        <hr style="border:none;border-top:2px solid #12100e;margin:24px 0">
        <p style="font-size:28px;font-weight:900;color:#c9a84c;text-align:center;margin:0">${booking.total} kr</p>
      </div>
      <div style="background:#12100e;padding:20px 32px;text-align:center;color:#7a7268;font-size:12px;letter-spacing:1px;text-transform:uppercase">
        We-mati Barbershop · Heimdalvegen 8, 7080 Heimdal
      </div>
    </div>
  `

  await getResend().emails.send({
    from: `We-mati Barbershop <${from}>`,
    to: booking.email,
    subject: `Bestilling Bekreftet — ${booking.id}`,
    html,
  })
}
