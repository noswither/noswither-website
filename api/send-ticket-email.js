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

    const { email, ticketData, ticketPdfBase64 } = body;

    if (!email || !ticketData) {
      res.status(400).json({ ok: false, error: 'Missing email or ticket data' });
      return;
    }

    // Use Resend, SendGrid, or any email service
    // For now, we'll use a simple approach with Resend (you'll need to set RESEND_API_KEY)
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@noswither.com';

    if (!RESEND_API_KEY) {
      // If no email service configured, just return success (email sending is optional)
      res.status(200).json({ ok: true, message: 'Email service not configured, ticket generated successfully' });
      return;
    }

    // Send email with ticket attachment
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: email,
        subject: `Your Ticket for ${ticketData.eventName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Thank you for registering!</h2>
            <p>Your ticket for <strong>${ticketData.eventName}</strong> is attached.</p>
            <p><strong>Ticket ID:</strong> ${ticketData.ticketId}</p>
            <p><strong>Name:</strong> ${ticketData.driverName}</p>
            <p>Please bring this ticket (or show the QR code) at the event venue.</p>
            <p>See you there!</p>
          </div>
        `,
        attachments: ticketPdfBase64 ? [{
          filename: `ticket-${ticketData.ticketId}.pdf`,
          content: ticketPdfBase64,
        }] : [],
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Email send error:', errorText);
      // Still return success as ticket was generated
      res.status(200).json({ ok: true, message: 'Ticket generated, but email sending failed' });
      return;
    }

    res.status(200).json({ ok: true, message: 'Ticket sent successfully' });
  } catch (e) {
    console.error('Send email error:', e);
    // Still return success as ticket was generated
    res.status(200).json({ ok: true, message: 'Ticket generated, but email sending failed' });
  }
}
