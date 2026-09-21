export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { customerName, customerEmail, shippingAddress, items, total, notes } = body;

    // Validation
    if (!customerName || !customerName.trim()) {
      return res.status(400).json({ error: 'Customer name is required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerEmail || !emailRegex.test(customerEmail.trim())) {
      return res.status(400).json({ error: 'A valid customer email address is required.' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item.' });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || 'sibghatofficial5@gmail.com';
    const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
    const timestamp = new Date().toUTCString();

    // If RESEND_API_KEY is not set yet in Vercel environment
    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY environment variable is not configured.');
      return res.status(200).json({
        success: true,
        simulated: true,
        message: 'Order received! (Note: RESEND_API_KEY not configured in Vercel settings yet).',
        orderSummary: { customerName, customerEmail, itemsCount: items.length, total: total || '$0.00' }
      });
    }

    // Generate table rows for ordered books
    const itemsTableRows = items.map(item => `
      <tr style="border-bottom: 1px solid #eae8e4;">
        <td style="padding: 12px 8px; font-family: Georgia, serif; color: #082017; font-size: 15px;">${item.title || 'Archival Edition'}</td>
        <td style="padding: 12px 8px; text-align: center; color: #424844; font-size: 14px;">${item.quantity || 1}</td>
        <td style="padding: 12px 8px; text-align: right; font-weight: 600; color: #082017; font-size: 15px;">${item.price || '$0.00'}</td>
      </tr>
    `).join('');

    // HTML Email to Store Owner
    const ownerHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"/></head>
      <body style="margin: 0; padding: 0; background-color: #fbf9f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1b1c1a;">
        <div style="max-width: 600px; margin: 30px auto; background: #ffffff; border: 1px solid #e4e2de; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
          <div style="background-color: #082017; padding: 28px 24px; text-align: center; border-bottom: 3px solid #775a19;">
            <h1 style="margin: 0; font-family: Georgia, serif; font-size: 24px; color: #ffffff; letter-spacing: 0.05em; font-weight: 500;">SIBGHAT BOOKS</h1>
            <p style="margin: 6px 0 0; color: #fed488; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase;">New Customer Order</p>
          </div>
          <div style="padding: 28px 24px;">
            <p style="font-size: 15px; color: #424844; margin-top: 0;">You have received a new order on your Sibghat Books storefront:</p>
            
            <div style="background-color: #fbf9f5; border: 1px solid #eae8e4; padding: 18px; border-radius: 4px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 12px; font-family: Georgia, serif; color: #082017; font-size: 17px;">Customer Information</h3>
              <p style="margin: 4px 0; font-size: 14px;"><strong>Name:</strong> ${customerName}</p>
              <p style="margin: 4px 0; font-size: 14px;"><strong>Email:</strong> <a href="mailto:${customerEmail}" style="color: #775a19;">${customerEmail}</a></p>
              <p style="margin: 4px 0; font-size: 14px;"><strong>Shipping Address:</strong> ${shippingAddress || 'Not specified'}</p>
              ${notes ? `<p style="margin: 4px 0; font-size: 14px;"><strong>Special Notes:</strong> ${notes}</p>` : ''}
              <p style="margin: 4px 0; font-size: 13px; color: #727974;"><strong>Timestamp:</strong> ${timestamp}</p>
            </div>

            <h3 style="margin: 0 0 12px; font-family: Georgia, serif; color: #082017; font-size: 17px;">Ordered Volumes</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="border-bottom: 2px solid #082017; text-align: left;">
                  <th style="padding: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #727974;">Edition</th>
                  <th style="padding: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #727974; text-align: center;">Qty</th>
                  <th style="padding: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #727974; text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsTableRows}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding: 14px 8px; text-align: right; font-weight: 600; font-size: 15px; font-family: Georgia, serif;">Total Amount:</td>
                  <td style="padding: 14px 8px; text-align: right; font-weight: bold; font-size: 17px; color: #082017;">${total || '$0.00'}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div style="background-color: #efeeea; padding: 16px 24px; text-align: center; font-size: 12px; color: #727974;">
            Sibghat Books Storefront • Automated Notification
          </div>
        </div>
      </body>
      </html>
    `;

    // HTML Auto-confirmation to Customer
    const customerHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"/></head>
      <body style="margin: 0; padding: 0; background-color: #fbf9f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1b1c1a;">
        <div style="max-width: 600px; margin: 30px auto; background: #ffffff; border: 1px solid #e4e2de; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
          <div style="background-color: #082017; padding: 28px 24px; text-align: center; border-bottom: 3px solid #775a19;">
            <h1 style="margin: 0; font-family: Georgia, serif; font-size: 24px; color: #ffffff; letter-spacing: 0.05em; font-weight: 500;">SIBGHAT BOOKS</h1>
            <p style="margin: 6px 0 0; color: #fed488; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase;">Order Received</p>
          </div>
          <div style="padding: 28px 24px;">
            <p style="font-size: 16px; font-family: Georgia, serif; color: #082017;">Dear ${customerName},</p>
            <p style="font-size: 14px; color: #424844; line-height: 1.6;">We have received your order with Sibghat Books. Our curatorial press is packaging your selected volumes with archival tissue wrapping, wax seal protection, and acid-free boxing.</p>

            <div style="background-color: #fbf9f5; border: 1px solid #eae8e4; padding: 18px; border-radius: 4px; margin: 20px 0;">
              <h3 style="margin: 0 0 12px; font-family: Georgia, serif; color: #082017; font-size: 16px;">Order Summary</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 1px solid #c2c8c3; text-align: left;">
                    <th style="padding: 6px 0; font-size: 11px; text-transform: uppercase; color: #727974;">Item</th>
                    <th style="padding: 6px 0; font-size: 11px; text-transform: uppercase; color: #727974; text-align: center;">Qty</th>
                    <th style="padding: 6px 0; font-size: 11px; text-transform: uppercase; color: #727974; text-align: right;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsTableRows}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" style="padding: 12px 0 0; text-align: right; font-weight: 600; font-family: Georgia, serif;">Total:</td>
                    <td style="padding: 12px 0 0; text-align: right; font-weight: bold; color: #082017;">${total || '$0.00'}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <p style="font-size: 13px; color: #727974; line-height: 1.5;">You will receive another notification when your package departs the press. If you need assistance or wish to provide special instructions, simply reply directly to this email.</p>
          </div>
          <div style="background-color: #efeeea; padding: 16px 24px; text-align: center; font-size: 12px; color: #727974;">
            Sibghat Books • Fine Press &amp; Enduring Narratives
          </div>
        </div>
      </body>
      </html>
    `;

    // 1. Send Notification to Store Owner via Resend
    const ownerResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `Sibghat Books Orders <${FROM_EMAIL}>`,
        to: [NOTIFICATION_EMAIL],
        subject: `[Sibghat Books] New Order from ${customerName} (${total || 'Order Placed'})`,
        html: ownerHtml
      })
    });

    const ownerResult = await ownerResponse.json();
    if (!ownerResponse.ok) {
      console.error('Resend Owner Email Error:', ownerResult);
      return res.status(502).json({
        error: 'Failed to send notification email via Resend.',
        details: ownerResult
      });
    }

    // 2. Send Auto-confirmation to Customer (safe try-catch for free tier domain limits)
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `Sibghat Books <${FROM_EMAIL}>`,
          to: [customerEmail],
          subject: `Your Sibghat Books Order Receipt — Stories worth keeping`,
          html: customerHtml
        })
      });
    } catch (custErr) {
      console.warn('Customer confirmation email note (non-fatal):', custErr);
    }

    return res.status(200).json({
      success: true,
      message: 'Order placed successfully! Confirmation email dispatched.',
      orderId: ownerResult.id
    });

  } catch (err) {
    console.error('Order Handler Error:', err);
    return res.status(500).json({ error: 'Internal server error while processing order.', message: err.message });
  }
}
