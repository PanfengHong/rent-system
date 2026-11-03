export async function api<T = unknown>(
  url: string,
  options: { method?: string; body?: unknown; signal?: AbortSignal } = {}
): Promise<T> {
  const { method = options.body ? 'POST' : 'GET', body, signal } = options;
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
    signal,
  });

  const payload = await res.json().catch(() => null);
  if (!res.ok || (payload && payload.ok === false)) {
    throw new Error(payload?.message || `请求失败（${res.status}）`);
  }
  return (payload?.data ?? payload) as T;
}
