# Barbershop / Salon Website Builder Prompt

Copy everything below the line and paste it into a new Claude Code session (Sonnet or Opus).

---

Before you write any code, ask me these questions and wait for my answers:

1. **Business name** — the brand name shown in the logo, hero, and emails
2. **Address** — street address shown in the hero eyebrow and footer
3. **Phone number** — shown in the footer and on error/contact messages
4. **Color theme** — 2–3 colors (e.g. gold `#c9a84c`, black `#12100e`, dark brown `#2c1810`). Ask me for accent, background, and section colors
5. **Description / tagline** — a short sentence describing the business, used as the hero tagline and meta description
6. **Services & prices** — list of services with names, short descriptions, and prices in kr
7. **Opening hours / time slots** — which times are bookable each day (e.g. 09:00–18:45 every 45 min)
8. **Language** — which language the site should be in (default: Norwegian)
9. **Hero media** — do I have a background video for the hero? If yes, I'll place it at `public/video/hero.mp4`. If no, use a high-quality photo instead (ask me for a file, or pick a fitting free Unsplash image matching the business)

Once I've answered, build the following website:

## Tech stack
- **Next.js 15 App Router**, JavaScript (not TypeScript), deployed on **Vercel**
- **Supabase** (PostgreSQL) for bookings storage — lazy-initialize clients in `lib/supabase.js` (both anon and service-role) so `next build` works without env vars
- **Resend** for booking confirmation emails — lazy-initialize in `lib/resend.js`, branded HTML email template with the business colors
- All API routes get `export const dynamic = 'force-dynamic'`
- Google Fonts: Archivo (headings, 700–900 weights, uppercase) + Inter (body)

## Main page (`app/page.js`, client component)
- **Hero**: fullscreen background media with dark overlay, address as small eyebrow text, big brand name heading, tagline, two CTA buttons (book / services), "scroll to explore" hint
  - Build the hero so it works with either video or image automatically: if `public/video/hero.mp4` exists, render a `<video autoPlay muted loop playsInline>` with a poster image; otherwise render the hero image (`public/img/hero.jpg` or the chosen Unsplash URL) as a fullscreen background. Also use the image as fallback while the video loads or on browsers that block autoplay
- **Parallax scroll sections**: 3 feature sections (e.g. precision, tradition, experience) with text and image that animate in with translateY/opacity/clip-path on scroll (vanilla scroll listeners in useEffect)
- **Services section**: 2-column price list (1 column on mobile), each service clickable → auto-selects it in the booking form and scrolls there. Keep text modest: name ~16px, price ~20px desktop; smaller on phone
- **Booking form**, 6 steps in one page with a sticky summary sidebar:
  1. Choose service (grid of cards)
  2. Choose date (next 14 days strip, skip closed days)
  3. Choose time (slot grid, booked slots struck through/disabled — check against existing bookings)
  4. Payment method: "Pay online (card/Vipps, −50 kr)" or "Pay in shop"
  5. Special requests (free textarea)
  6. Contact details (first/last name, email, phone) + submit button
- Summary sidebar shows chosen service, date, time, payment, subtotal, discount, total
- On submit: shop payments → POST `/api/bookings` → inline confirmation card; online payments → POST `/api/payments/create` → redirect to `/booking/checkout`
- Parse API responses defensively (read text first, JSON.parse in try/catch) so misconfigured env vars give a readable error

## Demo payment flow (no real Stripe)
- `/api/payments/create`: insert booking with `status: 'pending'`, return URL to `/booking/checkout?booking_id=...&total=...&service=...`
- `/booking/checkout`: branded page with order summary and two buttons — **Pay with Vipps** (orange) and **Pay with Card** (accent color). Either one POSTs `/api/payments/confirm-demo` then redirects to `/booking/success?booking_id=...`
- `/api/payments/confirm-demo`: set status to `confirmed`, send confirmation email once
- `/booking/success`: polls `/api/bookings?id=...` until confirmed, then shows confirmation card with booking reference

## Admin page (`app/admin/page.js`)
- Sidebar (brand + Calendar/Stats tabs + back-to-site link); becomes a top icon bar on phones
- **Calendar tab**: month grid (Mon-first, localized day/month names), dots + booking count per day, prev/today/next controls. Clicking a day opens a **day schedule panel on the right side** (380px sticky column on desktop; stacks below calendar under 900px)
- Day panel: bookings sorted by time showing time, name, service, details, price; **✓ Finished** and **✗ No-show** buttons on each booking (PATCH status), replaced by a colored badge once set; edit and delete icons
- Add/edit booking modal: service dropdown, date, time, payment, name, email, phone, details; create, update, delete
- **Stats tab** (for the shown month): total bookings, finished count (+ no-shows + upcoming), actual revenue (finished only) vs expected revenue (confirmed + finished), available slots, and a per-service breakdown table
- Fully responsive down to 375px wide

## API routes
- `GET /api/bookings` — all bookings, `?month=YYYY-MM` filter, `?id=` single lookup
- `POST /api/bookings` — create shop booking (status confirmed), send confirmation email
- `PUT /api/bookings/[id]` — full update; `PATCH` — status-only update (confirmed/finished/no_show/cancelled); `DELETE`
- `POST /api/payments/create`, `POST /api/payments/confirm-demo` as above

## Database schema (`supabase-schema.sql`)
```sql
create table bookings (
  id text primary key,               -- e.g. 'XX-' + 5 random chars
  service_id text not null,
  service_name text not null,
  service_price integer not null,
  date date not null,
  time text not null,
  pay text not null check (pay in ('online', 'shop')),
  status text not null default 'confirmed'
    check (status in ('pending', 'confirmed', 'cancelled', 'finished', 'no_show')),
  stripe_session_id text,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  details text default '',
  total integer not null,
  created_at timestamptz default now()
);
create index bookings_date_idx on bookings (date);
create index bookings_status_idx on bookings (status);
```

## Environment (`.env.local.example`)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=onboarding@resend.dev
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Finishing steps
- Run `next build` and fix anything until it passes
- Initialize git, commit, and help me push to a new GitHub repo
- Remind me to: run the schema in Supabase SQL Editor, add the env vars in Vercel, and set `NEXT_PUBLIC_BASE_URL` to the production domain
