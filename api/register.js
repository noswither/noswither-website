export default async function handler(req, res) {
  const corsOrigin = '*'; // optionally replace with 'https://www.noswither.com'
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
    const SHEETS_URL = process.env.SHEETS_WEBAPP_URL;
    const SHEETS_SECRET = process.env.SHEETS_SHARED_SECRET;
    if (!SHEETS_URL || !SHEETS_SECRET) {
      res.status(500).json({ ok: false, error: 'Server not configured' });
      return;
    }

    const bodyText = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', (chunk) => { data += chunk; });
      req.on('end', () => resolve(data));
      req.on('error', reject);
    });
    let body = {};
    try {
      body = bodyText ? JSON.parse(bodyText) : {};
    } catch {
      res.status(400).json({ ok: false, error: 'Invalid JSON' });
      return;
    }

    const { eventName, driverName, carNumberPlate, carMakeModel, contactNumber } = body || {};
    if (!eventName || !driverName || !carNumberPlate || !carMakeModel) {
      res.status(400).json({ ok: false, error: 'Missing fields' });
      return;
    }

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
    const text = await forward.text().catch(() => 'OK');
    if (!forward.ok) {
      res.status(502).json({ ok: false, error: 'Upstream error', detail: text });
      return;
    }
    res.status(200).json({ ok: true, upstream: text });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'Unexpected error' });
  }
}


