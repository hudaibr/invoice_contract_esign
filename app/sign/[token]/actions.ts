"use server";

import { headers } from "next/headers";
import { signContract } from "@/lib/contract/service";
import type { SignContractInput } from "@/lib/contract/types";

export async function signContractAction(input: SignContractInput) {
  try {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? h.get("x-real-ip")
      ?? h.get("x-client-ip")
      ?? h.get("cf-connecting-ip")
      ?? h.get("true-client-ip")
      ?? h.get("x-forwarded")
      ?? "";

    input.signerInfo.ipAddress = ip;

    const result = await signContract(input);
    return { success: true as const, ...result };
  } catch (e) {
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Signing failed",
    };
  }
}
