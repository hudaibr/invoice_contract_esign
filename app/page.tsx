import Link from "next/link";
import { branding } from "@/lib/branding";
import { FileText, FileSignature } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {branding.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={branding.logoUrl} alt={branding.agencyName} className="mx-auto h-24 object-contain mb-2" />
        ) : (
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">{branding.agencyName}</h1>
        )}
        <p className="text-neutral-500 mb-10">{branding.tagline}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/invoices"
            className="bg-white border border-neutral-200 rounded-xl p-8 hover:border-[#54F358] hover:shadow-md transition group"
          >
            <FileText className="mx-auto mb-3 text-[#3FBB43]" size={32} />
            <div className="font-semibold text-neutral-900">Invoice Generator</div>
            <div className="text-sm text-neutral-500 mt-1">Branded invoices, PDF in one click</div>
          </Link>

          <Link
            href="/contracts"
            className="bg-white border border-neutral-200 rounded-xl p-8 hover:border-[#54F358] hover:shadow-md transition group"
          >
            <FileSignature className="mx-auto mb-3 text-[#3FBB43]" size={32} />
            <div className="font-semibold text-neutral-900">Contract Generator</div>
            <div className="text-sm text-neutral-500 mt-1">Dynamic terms + e-signature capture</div>
          </Link>
        </div>
      </div>
    </main>
  );
}
