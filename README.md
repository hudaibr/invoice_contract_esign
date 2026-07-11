# Agency Suite — Invoice & Contract Generator

Branded invoice generator + dynamic contract generator that sends contracts
to your self-hosted DocuSeal instance for e-signature.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in your DocuSeal URL + API key
npm run dev
```

Visit http://localhost:3000

## Branding

Edit `lib/branding.ts` to set your agency name, colors, currency, address,
and default contract terms.

To add your logo:
1. Drop your logo file into `public/logo.png`
2. Set `logoUrl: "/logo.png"` in `lib/branding.ts`

## Pages

- `/invoices` — line-item invoice builder, live preview, one-click PDF download
- `/contracts` — dynamic contract builder (scope, price, timeline, payment
  method) with a "Send for Signature via DocuSeal" button, plus an optional
  "Download Unsigned PDF Copy" for your own records

## How signing works

1. You fill in the contract form and click "Send for Signature via DocuSeal"
2. `app/api/contracts/send/route.ts` renders the branded contract to a PDF
   server-side, using DocuSeal's embedded text-tag syntax
   (`{{Client Signature;role=Client;type=signature}}`) in the signature block
3. That PDF is POSTed to your DocuSeal instance's `/api/submissions/pdf`
   endpoint — DocuSeal auto-detects the tags and turns them into a real
   fillable/signable field
4. DocuSeal emails the client a signing link, records their signature, IP,
   timestamp, and document hash, and stores the final signed PDF — this is
   the audit trail you'd pull up if a payment dispute (e.g. PayPal) occurs

## Required environment variables

| Variable | Where to get it |
|---|---|
| `DOCUSEAL_URL` | The base URL of your self-hosted DocuSeal instance |
| `DOCUSEAL_API_KEY` | DocuSeal instance → Settings → API → generate key |

Set these in `.env.local` for local dev, and in your hosting provider's
environment variable settings (Render/Vercel/etc.) once deployed.

## Deploying

Works on Vercel, Render, or any Node host that supports Next.js API routes.
No database is needed in this app — DocuSeal is the system of record for
signed documents and audit trails.
