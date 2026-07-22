import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { setupPaypalReminders } from "@/lib/paypal/invoice";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!checkRateLimit(`paypal:reminders:${session.user.id}`, 3, 60000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const result = await setupPaypalReminders();
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to setup reminders" },
      { status: 500 },
    );
  }
}
