import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sendContract } from "@/lib/contract/service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { contractData } = await req.json();
    const result = await sendContract({
      contractData,
      userId: session.user.id,
    });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

