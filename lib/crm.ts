export async function logToCRM(data: Record<string, unknown>) {
  try {
    await fetch("/api/crm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch {
    // Silently fail
  }
}
