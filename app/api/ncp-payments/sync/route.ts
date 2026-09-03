import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getAccessToken, PAYPAL_API } from "@/lib/paypal/auth";
import { checkRateLimit } from "@/lib/rate-limit";

interface PayPalTransaction {
  transaction_id: string;
  transaction_info: {
    transaction_amount: { value: string; currency_code: string };
    transaction_status: string;
    transaction_initiation_date: string;
  };
  payer_info?: {
    email_address: string;
    first_name: string;
    last_name: string;
  };
  cart_id?: string;
}

interface SyncResult {
  synced: number;
  skipped: number;
  errors: string[];
}

async function fetchTransactions(
  token: string,
  startDate: string,
  endDate: string,
  page: number = 1,
  pageSize: number = 500
): Promise<{ transaction_details: PayPalTransaction[]; total_items: number; total_pages: number }> {
  const url = new URL(`${PAYPAL_API}/v1/reporting/transactions`);
  url.searchParams.set("start_date", startDate);
  url.searchParams.set("end_date", endDate);
  url.searchParams.set("transaction_status", "S");
  url.searchParams.set("page", page.toString());
  url.searchParams.set("page_size", pageSize.toString());
  url.searchParams.set("fields", "all");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal API error (${res.status}): ${text}`);
  }

  return res.json();
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!checkRateLimit(`ncp:sync:${session.user.id}`, 5, 300000)) {
    return NextResponse.json({ error: "Too many requests. Try again in 5 minutes." }, { status: 429 });
  }

  let startDate: string, endDate: string;
  try {
    const body = await req.json();
    startDate = body.startDate ?? new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] + "T00:00:00Z";
    endDate = body.endDate ?? new Date().toISOString().split("T")[0] + "T23:59:59Z";
  } catch {
    startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] + "T00:00:00Z";
    endDate = new Date().toISOString().split("T")[0] + "T23:59:59Z";
  }

  const result: SyncResult = { synced: 0, skipped: 0, errors: [] };

  try {
    const token = await getAccessToken();
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const data = await fetchTransactions(token, startDate, endDate, page);
      const transactions = data.transaction_details ?? [];

      if (transactions.length === 0) break;

      for (const tx of transactions) {
        const cartId = tx.cart_id ?? "";
        if (!cartId.startsWith("PLB-")) continue;

        const captureId = tx.transaction_id;
        if (!captureId) {
          result.errors.push(`Missing capture ID for cart ${cartId}`);
          continue;
        }

        const payer = tx.payer_info ?? {};
        const customerName = `${payer.first_name ?? ""} ${payer.last_name ?? ""}`.trim() || "Unknown Client";
        const customerEmail = payer.email_address ?? "unknown@example.com";
        const amountInfo = tx.transaction_info?.transaction_amount ?? { value: "0", currency_code: "USD" };
        const amount = Number(amountInfo.value ?? 0);
        const currencyCode = amountInfo.currency_code ?? "USD";
        const status = tx.transaction_info?.transaction_status ?? "COMPLETED";
        const paidAt = tx.transaction_info?.transaction_initiation_date
          ? new Date(tx.transaction_info.transaction_initiation_date)
          : new Date();

        try {
          const existing = await prisma.ncpPayment.findUnique({ where: { paypalCaptureId: captureId } });
          if (existing) {
            result.skipped++;
            continue;
          }

          await prisma.ncpPayment.create({
            data: {
              customerName,
              customerEmail,
              amount,
              currencyCode,
              status,
              paypalCartId: cartId,
              paypalCaptureId: captureId,
              paidAt,
              rawPayload: tx,
            },
          });
          result.synced++;
        } catch (e) {
          result.errors.push(`Failed to save ${captureId}: ${e instanceof Error ? e.message : "Unknown error"}`);
        }
      }

      hasMore = page < (data.total_pages ?? 1);
      page++;
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[NCP Sync] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed", ...result },
      { status: 500 }
    );
  }
}