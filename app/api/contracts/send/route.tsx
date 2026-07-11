import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { ContractPDF } from "@/components/ContractPDF";
import type { ContractData } from "@/lib/types";

export const runtime = "nodejs"; // react-pdf needs the Node runtime, not edge

// Required env vars (set these in .env.local, and in your host's dashboard when deployed):
//   DOCUSEAL_URL      e.g. https://your-docuseal-instance.com  (no trailing slash)
//   DOCUSEAL_API_KEY  from your DocuSeal instance → Settings → API

export async function POST(req: NextRequest) {
  const docusealUrl = process.env.DOCUSEAL_URL;
  const docusealApiKey = process.env.DOCUSEAL_API_KEY;

  if (!docusealUrl || !docusealApiKey) {
    return NextResponse.json(
      { error: "DOCUSEAL_URL and DOCUSEAL_API_KEY must be set in your environment." },
      { status: 500 }
    );
  }

  const contractData: ContractData = await req.json();

  // Render the branded contract to a PDF buffer server-side
  const pdfBuffer = await renderToBuffer(<ContractPDF data={contractData} />);
  const base64File = pdfBuffer.toString("base64");

  // Send to DocuSeal — it auto-detects the {{Field;role=...;type=...}} tags
  // embedded in the PDF text and converts them into real signable fields.
  const res = await fetch(`${docusealUrl}/api/submissions/pdf`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Auth-Token": docusealApiKey,
    },
    body: JSON.stringify({
      name: `${contractData.projectTitle || "Service Agreement"} — ${contractData.contractNumber}`,
      documents: [
        {
          name: contractData.contractNumber,
          file: base64File,
        },
      ],
      submitters: [
        {
          role: "Client",
          email: contractData.clientEmail,
          name: contractData.clientName,
        },
      ],
      send_email: true,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    return NextResponse.json({ error: `DocuSeal API error: ${errText}` }, { status: res.status });
  }

  const submission = await res.json();
  return NextResponse.json(submission);
}
