export default async function handler(req, res) {
  // CORS for safety (same-origin in prod, but keep generic)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }
  try {
    const SHEETS_URL = process.env.SHEETS_WEBAPP_URL;
    const SHEETS_SECRET = process.env.SHEETS_SHARED_SECRET;
    if (!SHEETS_URL || !SHEETS_SECRET) {
      return res.status(500).json({ ok: false, error: 'Server not configured' });
    }

    // Vercel should parse JSON automatically; fallback if empty
    let body = req.body;
    if (!body || Object.keys(body).length === 0) {
      const buffers = [];
      for await (const chunk of req) buffers.push(chunk);
      const raw = Buffer.concat(buffers).toString('utf8') || '{}';
      body = JSON.parse(raw);
    }

    const { eventName, driverName, carNumberPlate, carMakeModel, contactNumber } = body || {};
    if (!eventName || !driverName || !carNumberPlate || !carMakeModel) {
      return res.status(400).json({ ok: false, error: 'Missing fields' });
    }

    // Basic input caps/sanitization
    const payload = {
      eventName: String(eventName).slice(0, 90),
      driverName: String(driverName).slice(0, 80),
      carNumberPlate: String(carNumberPlate).slice(0, 40),
      carMakeModel: String(carMakeModel).slice(0, 120),
      contactNumber: contactNumber ? String(contactNumber).slice(0, 32) : '',
      token: SHEETS_SECRET,
    };

    const forward = await fetch(SHEETS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!forward.ok) {
      const text = await forward.text().catch(() => '');
      return res.status(502).json({ ok: false, error: 'Upstream error', detail: text });
    }
    const text = await forward.text().catch(() => 'OK');
    return res.status(200).json({ ok: true, upstream: text });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'Unexpected error' });
  }
}


