import crypto from 'crypto';

export default async function handler(req, res) {
  const corsOrigin = '*';
  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    return;
  }

  try {
    const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
    const SHEETS_URL = process.env.SHEETS_WEBAPP_URL;
    const SHEETS_SECRET = process.env.SHEETS_SHARED_SECRET;

    if (!RAZORPAY_KEY_SECRET) {
      res.status(500).json({ ok: false, error: 'Payment gateway not configured' });
      return;
    }

    let bodyText = req.body;
    if (bodyText === undefined || bodyText === null) {
      bodyText = await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', (chunk) => { data += chunk; });
        req.on('end', () => resolve(data));
        req.on('error', reject);
      });
    }
    if (typeof bodyText === 'object' && bodyText !== null) {
      bodyText = JSON.stringify(bodyText);
    }

    let body = {};
    try {
      body = (bodyText && typeof bodyText === 'string' ? JSON.parse(bodyText) : bodyText) || {};
    } catch {
      res.status(400).json({ ok: false, error: 'Invalid JSON' });
      return;
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, registrationData } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({ ok: false, error: 'Missing payment details' });
      return;
    }

    // 1) Verify signature – only Razorpay can produce this (uses your key_secret). Prevents spoofed tickets.
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      res.status(400).json({ ok: false, error: 'Invalid payment signature' });
      return;
    }

    // 2) Server-side check: confirm payment is captured with Razorpay (prevents replay / forged responses)
    const Razorpay = (await import('razorpay')).default;
    const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
    const payment = await razorpay.payments.fetch(razorpay_payment_id).catch(() => null);
    const isCaptured = payment && (payment.status === 'captured' || payment.captured === true);
    if (!isCaptured) {
      res.status(400).json({ ok: false, error: 'Payment not confirmed' });
      return;
    }
    if (payment.order_id !== razorpay_order_id) {
      res.status(400).json({ ok: false, error: 'Order mismatch' });
      return;
    }

    // Generate unique ticket ID
    const ticketId = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Save to Google Sheets – same config as free events (SHEETS_WEBAPP_URL, SHEETS_SHARED_SECRET)
    if (SHEETS_URL && SHEETS_SECRET && registrationData) {
      try {
        const payload = {
          eventName: String(registrationData.eventName || '').slice(0, 90),
          driverName: String(registrationData.driverName || '').slice(0, 80),
          carNumberPlate: String(registrationData.carNumberPlate || '').slice(0, 40),
          carMakeModel: String(registrationData.carMakeModel || '').slice(0, 120),
          contactNumber: registrationData.contactNumber ? String(registrationData.contactNumber).slice(0, 32) : '',
          token: SHEETS_SECRET,
          email: String(registrationData.email || '').slice(0, 100),
          ticketId,
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
        };

        await fetch(SHEETS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(() => {});
      } catch (e) {
        console.error('Sheets update error:', e);
      }
    }

    // Return ticket data
    res.status(200).json({
      ok: true,
      ticketId: ticketId,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      registrationData: registrationData,
    });
  } catch (e) {
    console.error('Verify payment error:', e);
    res.status(500).json({ ok: false, error: 'Payment verification failed', detail: e.message });
  }
}
