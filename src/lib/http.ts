export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly url?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const isRetryable = (status?: number) => status === undefined || status === 429 || status >= 500;

interface RequestOptions {
  signal?: AbortSignal;
  init?: RequestInit;
  retries?: number;
}

/** fetch JSON avec retry (réseau, 429, 5xx) et erreurs typées. */
export async function fetchJson<T>(url: string, opts: RequestOptions = {}): Promise<T> {
  const retries = opts.retries ?? 2;
  let last: ApiError | undefined;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { ...opts.init, signal: opts.signal });
      if (res.ok) return (await res.json()) as T;
      last = new ApiError(`HTTP ${res.status}`, res.status, url);
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') throw e;
      last = new ApiError('Erreur réseau', undefined, url);
    }
    if (!isRetryable(last.status)) throw last;
    if (attempt < retries) await sleep(400 * 2 ** attempt);
  }
  throw last;
}
