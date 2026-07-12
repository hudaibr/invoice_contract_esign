# Agency Suite — Invoice & Contract Generator with E-Sign

Branded invoice generator and dynamic contract generator with a built-in electronic signature system. Replace DocuSeal entirely — generate, send, sign, and store contracts with full audit trails, no third-party dependency.

Built with **Next.js**, **NextAuth**, **Prisma + Neon Postgres**, **Supabase Storage**, and **Brevo** for email.

## Features

- **Invoices** — line-item builder, live PDF preview, one-click PDF download
- **Contracts** — dynamic form (scope, price, timeline, payment), live preview, send for signature
- **E-Sign** — full lifecycle: signing link via email, draw or type signature, consent checkboxes, audit certificate PDF
- **Audit Trail** — append-only event log per contract (sent, viewed, signed, completed)
- **Admin Dashboard** — `/contracts/status` — filter contracts by status, view timeline
- **CRM Logging** — silent POST to Google Sheets webhooks on contract events
- **Auth** — credentials-based login via NextAuth, routes protected by middleware

## Quick Start

```bash
npm install
cp .env.example .env.local   # fill in your credentials
npx prisma db push
npx tsx prisma/seed.ts        # creates admin user
npm run dev
```

Visit **http://localhost:3000** and log in with the seeded admin credentials.

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string |
| `AUTH_SECRET` | NextAuth secret (`npx auth secret`) |
| `BREVO_API_KEY` | Brevo (Sendinblue) SMTP API key |
| `SIGNING_URL_BASE` | Base URL of your deployed app (e.g. `https://yourapp.vercel.app`) |
| `NEXT_PUBLIC_BASE_URL` | Same as above — used for absolute image URLs in server-side PDF rendering |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |
| `CRM_WEBHOOK_URL` | Google Sheets webhook URL for contract events |
| `CRM_BACKUP_WEBHOOK_URL` | Optional backup webhook |
| `COMPANY_SIG_NAME` | Signatory name shown in audit cert |
| `COMPANY_SIG_TITLE` | Signatory title shown in audit cert |
| `COMPANY_SIGNATURE_URL` | Public URL to the company signature PNG |

## How Contract Signing Works

1. Admin fills the contract form at `/contracts` and clicks **Send for Signature**
2. Server renders the contract as a PDF (`@react-pdf/renderer`), uploads to Supabase Storage
3. A unique signing token is created (expires in 72h) and stored in the database
4. Brevo emails the client a signing link → `/sign/[token]`
5. Client opens the link — sees the PDF in a two-column layout, draws or types their signature, checks consent boxes, and clicks **I Agree — Sign Contract**
6. Signature is embedded into the PDF via `pdf-lib`; company signature is also stamped
7. An **Audit Certificate PDF** is generated (SHA-256 hashes, signer info, event timeline)
8. Both signed PDF and audit certificate are uploaded to Supabase
9. Completion emails sent to client **and** agency
10. CRM webhooks fire (if configured)

## Pages

| Route | Access | Description |
|---|---|---|
| `/` | Public | Home dashboard with links to Invoices and Contracts |
| `/login` | Public | Admin login form |
| `/invoices` | Protected | Invoice builder with live PDF preview |
| `/contracts` | Protected | Contract builder with Send for Signature |
| `/contracts/status` | Protected | Contract dashboard — filter by status, view audit timeline |
| `/sign/[token]` | Public | Client signing portal (validates token) |

## Branding

Edit `lib/branding.ts` to customize:

- Agency name, tagline, logo, colors
- Currency (symbol + code)
- Invoice defaults (tax rate, due days)
- Contract defaults (payment terms, revision rounds, jurisdiction)

Place your logo in `public/logo.png` — it will be served at `[BASE_URL]/logo.png`.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Auth | NextAuth v5 (Credentials provider) |
| Database | Neon Postgres via Prisma |
| Storage | Supabase Storage |
| PDF Render | `@react-pdf/renderer` (server), `react-pdf` + `pdfjs-dist` (client preview) |
| PDF Manipulation | `pdf-lib` (embed signatures, generate audit cert) |
| Email | Brevo (Sendinblue) API |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
