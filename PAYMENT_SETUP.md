# Payment Integration Setup Guide

This guide explains how to set up the Razorpay payment integration and email service for paid events.

## Environment Variables Required

### Razorpay Configuration
Add these to your server environment variables (e.g., `.env` file or hosting platform):

```
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

To get these:
1. Sign up at https://razorpay.com
2. Go to Settings > API Keys
3. Generate test keys for development or live keys for production

### Email Service (Optional)
For sending tickets via email, configure Resend:

```
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@yourdomain.com
```

Alternatively, you can use SendGrid, AWS SES, or any other email service by modifying `/api/send-ticket-email.js`.

## How Paid Events Work

1. **Event Setup**: In your Google Calendar event description, add:
   ```
   Paid event
   Fee: 500
   ```
   Replace `500` with the actual fee amount in INR.

2. **Registration Flow**:
   - User selects a paid event
   - Form shows the fee amount
   - Email field becomes required
   - User clicks "Pay and Register"
   - Razorpay payment gateway opens
   - After successful payment, ticket is generated with QR code
   - Ticket is automatically downloaded as PDF
   - Ticket is emailed to the user (if email service configured)
   - User is redirected to home page with success message

3. **Ticket Features**:
   - Unique ticket ID
   - QR code for scanning at venue
   - Event details
   - User information
   - Downloadable PDF
   - Email delivery

## API Endpoints

- `/api/create-order` - Creates Razorpay payment order
- `/api/verify-payment` - Verifies payment and generates ticket
- `/api/send-ticket-email` - Sends ticket via email

## Enable UPI

UPI (Google Pay, PhonePe, Paytm, etc.) is controlled from the **Razorpay Dashboard**. No code changes are needed; once UPI is enabled on your account, it appears automatically in the same checkout.

### Steps

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Switch to **Live mode** (top toggle) – Payment Methods are configured in Live mode. (For **Test mode**, UPI is often already available; if not, use Live to enable it, then switch back to Test if you prefer.)
3. Go to **Account & Settings** (left sidebar) → **Payment Methods**.
4. Find **UPI** in the list:
   - If it shows as **Enabled**, you’re done; UPI will appear at checkout.
   - If it shows **Request** or **Additional details required**:
     - Complete any “Additional details required” (e.g. business website, GSTIN) and click **Request**.
     - Razorpay’s partner banks will onboard UPI; this usually takes **~10 working days**.
5. **(Optional)** To show UPI first or customize how it appears:
   - Go to **Account & Settings** → **Payment Configuration** (under Checkout settings).
   - Create or edit a configuration and reorder payment methods (e.g. put UPI at the top) or show/hide UPI QR, UPI apps, UPI ID/Number.

**Note:** If UPI is not listed or you can’t request it, contact [Razorpay Support](https://razorpay.com/support/).

## Testing

For testing payments, use Razorpay test mode:
- Test cards: https://razorpay.com/docs/payments/test-cards/
- Test mode doesn't charge real money

## Notes

- Free events continue to work as before (no payment required)
- Email is only required for paid events
- Ticket generation happens automatically after successful payment
- All registrations (paid and free) are saved to Google Sheets if configured
