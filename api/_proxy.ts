/**
 * Shared proxy utility for all Vercel API functions.
 * When BACKEND_URL is set (e.g. https://abc123.trycloudflare.com),
 * requests are forwarded to the real Python backend.
 * Falls back to `mockData` when the backend is unreachable or not configured.
 */

export async function proxyOrMock<T>(
  path: string,
  mockData: T,
  options?: RequestInit,
): Promise<{ data: T; live: boolean }> {
  const base = process.env.BACKEND_URL?.replace(/\/$/, '');
  if (!base) return { data: mockData, live: false };

  try {
    const res = await fetch(`${base}/api${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      signal: AbortSignal.timeout(5000), // 5s timeout
    });
    if (!res.ok) return { data: mockData, live: false };
    const data = (await res.json()) as T;
    return { data, live: true };
  } catch {
    return { data: mockData, live: false };
  }
}
