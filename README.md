# Sibghat Books — Stories Worth Keeping

An independent literary e-commerce platform and fine press curation house.

# Sibghat Books — Stories Worth Keeping

An independent fine-press literary e-commerce platform and editorial salon.

---

## 🚀 Vercel Deployment & Environment Variables

This project uses **Vercel Serverless Functions** (`/api/send-order` and `/api/send-inquiry`) to dispatch customer order notifications, concierge inquiries, and newsletter signups via [Resend](https://resend.com).

### Required Environment Variables

Configure these in your **Vercel Project Dashboard** under:
**Settings** → **Environment Variables**

| Variable Name | Required | Default Value | Description |
| :--- | :---: | :--- | :--- |
| `RESEND_API_KEY` | **Yes** | *(None)* | Your API key from [resend.com/api-keys](https://resend.com/api-keys) (starts with `re_...`) |
| `NOTIFICATION_EMAIL` | Optional | `sibghatofficial5@gmail.com` | The destination inbox where orders, inquiries, and subscriptions are sent |
| `FROM_EMAIL` | Optional | `onboarding@resend.dev` | Sender email address. Use `onboarding@resend.dev` during testing, or your custom verified domain (e.g. `orders@yourdomain.com`) |

---

### How to Get Your Resend API Key

1. Create a free account at **[resend.com](https://resend.com)**.
2. Navigate to **API Keys** and click **Create API Key**.
3. Name your key (e.g., `Sibghat Books Vercel`) and copy the generated key (`re_...`).
4. In your **Vercel Dashboard**:
   - Go to your project → **Settings** → **Environment Variables**.
   - Key: `RESEND_API_KEY`, Value: `re_your_api_key_here`.
   - Add `NOTIFICATION_EMAIL` with value `sibghatofficial5@gmail.com`.
   - Click **Save**.
5. Redeploy or push a new commit to trigger the build with the environment variables active!

> [!TIP]
> **Resend Free Tier Testing Note**:
> With Resend's default test address (`onboarding@resend.dev`), emails can be sent to the email address you used to register your Resend account. To send customer auto-confirmations to arbitrary customer email addresses, add and verify your custom domain in Resend.

---

## 📬 Serverless API Endpoints

### 1. `POST /api/send-order`
Processes customer orders from the reading bag checkout:
- Validates customer name, email format, and items list.
- Dispatches an archival HTML notification to `sibghatofficial5@gmail.com` containing customer info, delivery address, notes, and itemized book list with totals.
- Dispatches an automatic order confirmation email to the customer.

### 2. `POST /api/send-inquiry`
Handles both literary concierge messages and reading dispatch newsletter subscriptions:
- **Concierge Inquiries**: Transmits reader questions, rare book requests, or consulting inquiries to your inbox + sends customer confirmation.
- **Newsletter Signups**: Dispatches subscriber notification to your inbox + sends welcome letter to subscriber.

---

## 💻 Local Development
- Run `start-server.bat` or `./serve.ps1` to host locally on `http://localhost:8000/`.
- Local development automatically simulates API responses and logs payloads to the PowerShell console if `RESEND_API_KEY` is not present.
