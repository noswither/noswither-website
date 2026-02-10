import nodemailer from 'nodemailer';

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

    const SMTP_HOST = process.env.SMTP_HOST;
    const SMTP_PORT = process.env.SMTP_PORT || '587';
    const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
    const SMTP_USER = process.env.SMTP_USER;
    const SMTP_PASS = process.env.SMTP_PASS;
    const FROM_EMAIL = process.env.FROM_EMAIL || SMTP_USER || 'noreply@noswither.com';

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      res.status(200).json({ ok: true, message: 'Email not configured, ticket generated successfully' });
      return;
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT, 10),
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const attachments = [];
    if (ticketPdfBase64) {
      attachments.push({
        filename: `ticket-${ticketData.ticketId}.pdf`,
        content: ticketPdfBase64,
        encoding: 'base64',
      });
    }

    await transporter.sendMail({
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
      attachments,
    });

    res.status(200).json({ ok: true, message: 'Ticket sent successfully' });
  } catch (e) {
    console.error('Send email error:', e);
    res.status(200).json({ ok: true, message: 'Ticket generated, but email sending failed' });
  }
}
