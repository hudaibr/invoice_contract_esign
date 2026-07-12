import { NextRequest, NextResponse } from "next/server";

const WEBHOOKS = [
  process.env.CRM_WEBHOOK_URL,
  process.env.CRM_BACKUP_WEBHOOK_URL,
].filter(Boolean);

export async function POST(req: NextRequest) {
  if (WEBHOOKS.length === 0) {
    return NextResponse.json({ error: "No CRM webhooks configured" }, { status: 500 });
  }

  try {
    const body = await req.json();
    await Promise.allSettled(
      WEBHOOKS.map((url) =>
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      )
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
