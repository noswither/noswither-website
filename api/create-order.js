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

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
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

    const { amount, currency = 'INR', receipt, notes } = body;

    if (!amount || amount <= 0) {
      res.status(400).json({ ok: false, error: 'Invalid amount' });
      return;
    }

    // Create Razorpay order
    // Dynamic import for ES modules - Razorpay exports default as the constructor
    const razorpayModule = await import('razorpay');
    const Razorpay = razorpayModule.default;
    
    const razorpay = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });

    const orderOptions = {
      amount: amount * 100, // Convert to paise
      currency: currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: notes || {},
    };

    const order = await razorpay.orders.create(orderOptions);

    res.status(200).json({
      ok: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: RAZORPAY_KEY_ID,
    });
  } catch (e) {
    console.error('Create order error:', e);
    res.status(500).json({ ok: false, error: 'Failed to create order', detail: e.message });
  }
}
