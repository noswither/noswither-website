export const config = { runtime: 'edge' };

export default async function handler(req) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: cors });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'Method Not Allowed' }), { status: 405, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
  try {
    const SHEETS_URL = process.env.SHEETS_WEBAPP_URL;
    const SHEETS_SECRET = process.env.SHEETS_SHARED_SECRET;
    if (!SHEETS_URL || !SHEETS_SECRET) {
      return new Response(JSON.stringify({ ok: false, error: 'Server not configured' }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const { eventName, driverName, carNumberPlate, carMakeModel, contactNumber } = body || {};
    if (!eventName || !driverName || !carNumberPlate || !carMakeModel) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing fields' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
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
      return new Response(JSON.stringify({ ok: false, error: 'Upstream error', detail: text }), { status: 502, headers: { ...cors, 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ ok: true, upstream: text }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'Unexpected error' }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
}


