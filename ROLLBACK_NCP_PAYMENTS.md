# NCP Payment Tracker - Rollback Plan

## Quick Rollback (if issues arise)

### 1. Remove API Routes
```bash
rm -rf app/api/paypal/ncp-webhook
rm -rf app/api/ncp-payments
```

### 2. Remove Admin Page
```bash
rm -rf app/ncp-payments
```

### 3. Remove Navigation Links
Edit these files and remove the NCP Payments link:
- `app/invoices/page.tsx` - remove `<a href="/ncp-payments">NCP Payments</a>`
- `app/contracts/page.tsx` - remove `<a href="/ncp-payments">NCP Payments</a>`
- `app/contracts/status/page.tsx` - remove `<a href="/ncp-payments">NCP Payments</a>`

### 4. Revert lib/paypal/webhook.ts
Change `verifyWebhookSignature` back to original:
```typescript
export async function verifyWebhookSignature(
  headers: Record<string, string>,
  event: unknown,
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;
  // ... rest unchanged
}
```

### 5. Remove Database Table
```bash
pnpm prisma db push
# This will drop the ncp_payments table since it's no longer in schema
```

### 6. Remove from Prisma Schema
Edit `prisma/schema.prisma` and remove the entire `NcpPayment` model block.

### 7. Remove Environment Variables
Edit `.env.example` and `.env.local` and remove:
```
PAYPAL_NCP_WEBHOOK_ID=your_ncp_webhook_id
```

### 8. Regenerate Prisma Client
```bash
pnpm prisma generate
```

### 9. Verify Build
```bash
pnpm build
pnpm lint
```

---

## Files Created/Modified (for reference)

### New Files (4)
- `app/api/paypal/ncp-webhook/route.ts`
- `app/api/ncp-payments/route.ts`
- `app/api/ncp-payments/sync/route.ts`
- `app/ncp-payments/page.tsx`

### Modified Files (5)
- `prisma/schema.prisma` - added NcpPayment model
- `lib/paypal/webhook.ts` - made webhookId parameter optional
- `app/invoices/page.tsx` - added nav link
- `app/contracts/page.tsx` - added nav link
- `app/contracts/status/page.tsx` - added nav link
- `.env.example` - added PAYPAL_NCP_WEBHOOK_ID
- `.env.local` - added PAYPAL_NCP_WEBHOOK_ID

---

## Post-Rollback Verification

- [ ] No TypeScript errors
- [ ] Build succeeds
- [ ] Lint passes
- [ ] Existing PayPal invoice webhook still works
- [ ] Existing e-sign, contracts, invoices features work
- [ ] Database schema matches original (no ncp_payments table)