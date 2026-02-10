import crypto from 'crypto';

export default async function handler(req, res) {
  const corsOrigin = '*';
  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ valid: false, error: 'Method Not Allowed' });
    return;
  }

  try {
    const secret = process.env.TICKET_VERIFY_SECRET;
    if (!secret) {
    return res.status(200).json({
      valid: false,
      error: 'Verification not configured',
    });
    }

    const { tid, e, d, s } = req.query;
    if (!tid || !e || !s) {
      return res.status(200).json({
        valid: false,
        error: 'Missing ticket data',
      });
    }

    const eventName = typeof e === 'string' ? decodeURIComponent(e) : '';
    const driverName = typeof d === 'string' ? decodeURIComponent(d) : '';
    const ticketId = String(tid).trim();
    const signature = String(s).trim();

    const payload = `${ticketId}|${eventName}|${driverName}`;
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    if (expectedSig !== signature) {
      return res.status(200).json({
        valid: false,
        error: 'Invalid ticket',
      });
    }

    return res.status(200).json({
      valid: true,
      ticketId,
      eventName,
      driverName,
    });
  } catch (err) {
    console.error('Verify ticket error:', err);
    return res.status(200).json({ valid: false, error: 'Verification failed' });
  }
}
