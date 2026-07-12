import { branding } from "@/lib/branding";

interface Props {
  title: string;
  message: string;
}

export function EsignErrorPage({ title, message }: Props) {
  return (
    <main className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl border border-neutral-200 p-8 max-w-md w-full text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
          <span className="text-red-500 text-2xl font-bold">!</span>
        </div>
        <h1 className="text-xl font-bold text-neutral-900">{title}</h1>
        <p className="text-sm text-neutral-500">{message}</p>
        <div className="pt-4 text-xs text-neutral-400">
          {branding.agencyName} · {branding.email}
        </div>
      </div>
    </main>
  );
}
