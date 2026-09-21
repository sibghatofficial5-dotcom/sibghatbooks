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
    const { type, name, email, subject, message } = body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    const isNewsletter = type === 'newsletter';
    const customerName = (name && name.trim()) || (isNewsletter ? 'Reader / Subscriber' : 'Valued Patron');
    const inquirySubject = subject || (isNewsletter ? 'New Reading Dispatch Subscription' : 'General Concierge Inquiry');
    const inquiryMessage = message || (isNewsletter ? 'Subscriber joined the Sibghat Reading Dispatch mailing list.' : '');

    if (!isNewsletter && (!message || !message.trim())) {
      return res.status(400).json({ error: 'Inquiry message cannot be empty.' });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || 'sibghatofficial5@gmail.com';
    const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
    const timestamp = new Date().toUTCString();

    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY environment variable is not set. Simulating success.');
      return res.status(200).json({
        success: true,
        simulated: true,
        message: isNewsletter 
          ? 'Thank you for subscribing! (Note: RESEND_API_KEY not configured in Vercel settings yet).'
          : 'Thank you. Your message has been received! (Note: RESEND_API_KEY not configured in Vercel settings yet).'
      });
    }

    // 1. Owner Notification Email HTML
    const ownerHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"/></head>
      <body style="margin: 0; padding: 0; background-color: #fbf9f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1b1c1a;">
        <div style="max-width: 600px; margin: 30px auto; background: #ffffff; border: 1px solid #e4e2de; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
          <div style="background-color: #082017; padding: 28px 24px; text-align: center; border-bottom: 3px solid #775a19;">
            <h1 style="margin: 0; font-family: Georgia, serif; font-size: 24px; color: #ffffff; letter-spacing: 0.05em; font-weight: 500;">SIBGHAT BOOKS</h1>
            <p style="margin: 6px 0 0; color: #fed488; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase;">
              ${isNewsletter ? 'New Newsletter Subscriber' : 'New Concierge Inquiry'}
            </p>
          </div>
          <div style="padding: 28px 24px;">
            <p style="font-size: 15px; color: #424844; margin-top: 0;">
              ${isNewsletter ? 'A reader has subscribed to the Sibghat Reading Dispatch:' : 'A reader has submitted an inquiry through your online concierge:'}
            </p>
            
            <div style="background-color: #fbf9f5; border: 1px solid #eae8e4; padding: 18px; border-radius: 4px; margin-bottom: 24px;">
              <p style="margin: 4px 0; font-size: 14px;"><strong>Name:</strong> ${customerName}</p>
              <p style="margin: 4px 0; font-size: 14px;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #775a19;">${email}</a></p>
              <p style="margin: 4px 0; font-size: 14px;"><strong>Subject:</strong> ${inquirySubject}</p>
              <p style="margin: 4px 0; font-size: 13px; color: #727974;"><strong>Received:</strong> ${timestamp}</p>
            </div>

            <h3 style="margin: 0 0 10px; font-family: Georgia, serif; color: #082017; font-size: 16px;">Message</h3>
            <div style="padding: 16px; background-color: #f5f3ef; border-left: 3px solid #775a19; font-size: 14px; line-height: 1.6; color: #1b1c1a; white-space: pre-line;">
              ${inquiryMessage}
            </div>
          </div>
          <div style="background-color: #efeeea; padding: 16px 24px; text-align: center; font-size: 12px; color: #727974;">
            Sibghat Books Storefront • Automated Concierge Notification
          </div>
        </div>
      </body>
      </html>
    `;

    // 2. Customer Auto-reply Confirmation HTML
    const customerHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"/></head>
      <body style="margin: 0; padding: 0; background-color: #fbf9f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1b1c1a;">
        <div style="max-width: 600px; margin: 30px auto; background: #ffffff; border: 1px solid #e4e2de; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
          <div style="background-color: #082017; padding: 28px 24px; text-align: center; border-bottom: 3px solid #775a19;">
            <h1 style="margin: 0; font-family: Georgia, serif; font-size: 24px; color: #ffffff; letter-spacing: 0.05em; font-weight: 500;">SIBGHAT BOOKS</h1>
            <p style="margin: 6px 0 0; color: #fed488; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase;">
              ${isNewsletter ? 'Welcome to the Dispatch' : 'Inquiry Received'}
            </p>
          </div>
          <div style="padding: 28px 24px;">
            <p style="font-size: 16px; font-family: Georgia, serif; color: #082017;">Dear ${customerName},</p>
            ${isNewsletter ? `
              <p style="font-size: 14px; color: #424844; line-height: 1.6;">Welcome to <em>The Sibghat Reading Dispatch</em>. You will receive our quarterly essays on typography, rare prints, fine press editions, and unhurried reflections on immortal literature.</p>
              <p style="font-size: 14px; color: #424844; line-height: 1.6;">Our next dispatch will arrive directly in your inbox. You may unsubscribe at any time with a single click.</p>
            ` : `
              <p style="font-size: 14px; color: #424844; line-height: 1.6;">Thank you for writing to Sibghat Books. Our bookshop concierge has received your note regarding <strong>"${inquirySubject}"</strong>.</p>
              <p style="font-size: 14px; color: #424844; line-height: 1.6;">A member of our literary council will review your query and respond within 24–48 hours.</p>
            `}
            <div style="background-color: #fbf9f5; border: 1px solid #eae8e4; padding: 14px; border-radius: 4px; margin: 20px 0; font-size: 13px; color: #727974;">
              <em>"Stories worth keeping."</em> — Sibghat Books Fine Press
            </div>
          </div>
          <div style="background-color: #efeeea; padding: 16px 24px; text-align: center; font-size: 12px; color: #727974;">
            Sibghat Books • Fine Press &amp; Enduring Narratives
          </div>
        </div>
      </body>
      </html>
    `;

    // 1. Send Owner Notification
    const ownerResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `Sibghat Books Concierge <${FROM_EMAIL}>`,
        to: [NOTIFICATION_EMAIL],
        subject: `[Sibghat Books] ${isNewsletter ? 'New Subscriber' : 'Inquiry'}: ${inquirySubject}`,
        html: ownerHtml
      })
    });

    const ownerResult = await ownerResponse.json();
    if (!ownerResponse.ok) {
      console.error('Resend Owner Email Error:', ownerResult);
      return res.status(502).json({
        error: 'Failed to send inquiry notification via Resend.',
        details: ownerResult
      });
    }

    // 2. Send Auto-reply to Customer (safe try-catch)
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `Sibghat Books <${FROM_EMAIL}>`,
          to: [email],
          subject: isNewsletter 
            ? `Welcome to the Sibghat Reading Dispatch` 
            : `We have received your inquiry — Sibghat Books Concierge`,
          html: customerHtml
        })
      });
    } catch (custErr) {
      console.warn('Customer auto-reply note (non-fatal):', custErr);
    }

    return res.status(200).json({
      success: true,
      message: isNewsletter 
        ? 'Thank you for subscribing! Confirmation sent.' 
        : 'Thank you. Your inquiry has been dispatched to our concierge.',
      inquiryId: ownerResult.id
    });

  } catch (err) {
    console.error('Inquiry Handler Error:', err);
    return res.status(500).json({ error: 'Internal server error while processing inquiry.', message: err.message });
  }
}
