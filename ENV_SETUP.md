# Environment Variables Setup

## For Local Development

Your `.env` file uses shell `export` syntax. For local development with Vercel CLI, you have two options:

### Option 1: Use Vercel CLI (Recommended)
```bash
npm install -g vercel
vercel dev
```

Then set environment variables in Vercel dashboard or use:
```bash
vercel env pull
```

### Option 2: Convert .env to Node.js format
Create a `.env.local` file (or update `.env`) with:
```
VITE_CALENDAR_ICS_URL=https://calendar.google.com/calendar/ical/noswither%40gmail.com/public/basic.ics
VITE_GOOGLE_API_KEY=...
VITE_CALENDAR_ID=noswither@gmail.com
RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=xxxx
# If you get 431 locally, set this to your Vercel deployment URL (no trailing slash):
# VITE_API_BASE=https://your-project.vercel.app
```

Note: Remove the `export` keyword - Node.js doesn't need it.

## For Vercel Deployment

Set these in Vercel Dashboard → Project Settings → Environment Variables:

**For Production:**
- `RAZORPAY_KEY_ID` = Your Razorpay key ID (test or live)
- `RAZORPAY_KEY_SECRET` = Your Razorpay key secret (test or live)
- `SHEETS_WEBAPP_URL` = Your Google Apps Script web app URL (if using)
- `SHEETS_SHARED_SECRET` = Your shared secret (if using)
- `TICKET_VERIFY_SECRET` = A secret string used to sign tickets (e.g. `openssl rand -hex 32`). Required for QR verification at the venue; without it, tickets are issued but scans will show "Invalid".
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` = SMTP settings for ticket email (optional; see “Ticket email” below)
- `FROM_EMAIL` = Sender address for ticket emails (optional)

**Note:** Variables prefixed with `VITE_` are exposed to the client. Server-side variables (like Razorpay secrets) should NOT have the `VITE_` prefix.

## Razorpay Test Mode

1. In Razorpay Dashboard use **Test Mode** (toggle in sidebar). Same env vars: `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` (keys must start with `rzp_test_`).
2. Test cards: https://razorpay.com/docs/payments/test-cards/  
   Example: Card `4111 1111 1111 1111`, CVV any 3 digits, expiry any future date.
3. Ensure your **Google Calendar event description** contains:
   ```
   Paid event
   Fee: 500
   ```
   (Replace 500 with your test amount in INR.)

## Ticket email (Nodemailer – free with Gmail)

After a paid registration, the ticket PDF can be emailed to the attendee. The app uses **Nodemailer** with SMTP. You can use **Gmail for free** (no Resend or other paid service). If you don’t set this up, the ticket still works (download + QR); only the “email me the ticket” step is skipped.

### 1. Gmail App Password

1. Use a **Google account** (e.g. your noswither@gmail.com).
2. Turn on **2-Step Verification** for that account: [Google Account → Security → 2-Step Verification](https://myaccount.google.com/security).
3. Create an **App Password**: [Google Account → Security → 2-Step Verification → App passwords](https://myaccount.google.com/apppasswords). Choose “Mail” and your device; copy the 16-character password (no spaces).

### 2. Environment variables (Vercel)

In **Vercel** → Project → Settings → Environment Variables add:

| Name | Value |
|------|--------|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Your Gmail address (e.g. `noswither@gmail.com`) |
| `SMTP_PASS` | The 16-character App Password from step 1 |
| `FROM_EMAIL` | Same as `SMTP_USER` or a different “From” address (e.g. `noreply@noswither.com` if you use a custom domain later) |

Do **not** set `SMTP_SECURE` for Gmail (port 587 uses STARTTLS). Redeploy after adding these.

### 3. Other SMTP providers (optional)

You can use any SMTP server instead of Gmail:

- **Outlook / Microsoft 365:** `SMTP_HOST=smtp.office365.com`, `SMTP_PORT=587`, `SMTP_USER` = your email, `SMTP_PASS` = your password or app password.
- **Other:** Set `SMTP_HOST`, `SMTP_PORT`, and if the server uses TLS from the start set `SMTP_SECURE=true`.

### 4. Verify it works

Do a paid test registration with an email you can check. You should see “Ticket sent to your email” and receive the message with the PDF attached. If not, check Vercel function logs for errors (Gmail may block sign-ins from cloud IPs; in that case try “Less secure app access” or a different SMTP provider).

## Fix 431 (Request Header Fields Too Large)

When the **Cookie** header is too big (e.g. lots of localhost cookies), the server returns 431 and payment fails. Two options:

### Option A – Use your deployed API (recommended)

1. Deploy the app to Vercel once: `vercel` (or push to Git if connected).
2. In Vercel Dashboard set **Environment Variables** for that project: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and any Sheets/email vars.
3. In your **local** `.env.local` add (use your real Vercel URL):
   ```
   VITE_API_BASE=https://your-project.vercel.app
   ```
4. Run locally: `npm run dev` or `npm run dev:vercel`.  
   Payment API requests will go to the **deployed** URL, so no localhost cookies are sent and 431 is avoided. Razorpay test mode works the same.

### Option B – Clear cookies

- Clear all cookies for `http://localhost:3000` (DevTools → Application → Cookies), or  
- Use an **Incognito/Private** window and open `http://localhost:3000`.

## Troubleshooting

- **"Failed to initiate payment" / 404:** Use `npm run dev:vercel` and open `http://localhost:3000` so `/api` routes are available.
- **431:** Use Option A (VITE_API_BASE) or Option B (clear cookies / incognito) above.
- **"Payment gateway not configured":** Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in Vercel env (or in `.env.local` when using `vercel dev`).

### Production 405 on `/api/create-order` (or other API routes)

If POST to `https://your-domain.com/api/create-order` returns **405 Method Not Allowed** and an HTML response (e.g. `index.html`), the request is being handled by the static/SPA layer instead of the serverless function. Check:

1. **Vercel dashboard → Project → Settings → General**  
   - Do **not** override "Build Command" or "Output Directory" in a way that makes the project static-only.  
   - "Framework Preset" can be "Vite" or "Other"; `vercel.json` uses custom `builds` so both API and frontend are built.

2. **Vercel dashboard → Deployments → [latest deployment] → Functions**  
   - Confirm that `api/create-order.js`, `api/verify-payment.js`, `api/register.js`, and `api/send-ticket-email.js` appear.  
   - If they do **not** appear, the `api` folder may not be included in the repo or the API build may be skipped; ensure `vercel.json` has the `builds` and `functions` entries and redeploy.

3. **Redeploy** after any `vercel.json` or env change (e.g. from the Deployments tab, "Redeploy" without cache).

## Free vs paid events

- **Free events:** Registration only (form → Google Sheets or `/api/register`). No ticket, no QR code.
- **Paid events:** Pay → ticket with QR is generated and (optionally) emailed. Only paid events use the ticket flow.

## Testing ticket scan from your phone

1. **On your laptop:** Complete a **paid registration** (test or live) so a ticket with QR is generated and shown.
2. **On your phone:** Unlock the phone and open the **Camera** app (or any QR scanner app). Point it at the **QR code on the ticket** (laptop screen or printed PDF).
3. When the camera recognizes the QR, tap the banner/notification to open the link in the browser.
4. The phone opens the **verify-ticket** page and shows **Valid ticket** (with event name and driver name) when `TICKET_VERIFY_SECRET` is set; otherwise **Invalid ticket**.

**Tip:** If you test on **localhost** (e.g. `npm run dev`), the QR will contain `http://localhost:5173/...`. Your phone can’t open that unless you use the same machine. For phone testing, use the **deployed URL** (e.g. www.noswither.com) or run the app on your machine and access it from the phone using your computer’s local IP (e.g. `http://192.168.1.x:5173`) on the same Wi‑Fi; then the QR will point to that IP and the phone will open the verify page on your phone’s browser.
