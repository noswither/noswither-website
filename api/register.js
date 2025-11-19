export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }
  try {
    const SHEETS_URL = process.env.SHEETS_WEBAPP_URL;
    const SHEETS_SECRET = process.env.SHEETS_SHARED_SECRET;
    if (!SHEETS_URL || !SHEETS_SECRET) {
      return res.status(500).json({ ok: false, error: 'Server not configured' });
    }

    const { eventName, driverName, carNumberPlate, carMakeModel } = req.body || {};
    if (!eventName || !driverName || !carNumberPlate || !carMakeModel) {
      return res.status(400).json({ ok: false, error: 'Missing fields' });
    }

    // Basic input caps/sanitization
    const payload = {
      eventName: String(eventName).slice(0, 90),
      driverName: String(driverName).slice(0, 80),
      carNumberPlate: String(carNumberPlate).slice(0, 40),
      carMakeModel: String(carMakeModel).slice(0, 120),
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


