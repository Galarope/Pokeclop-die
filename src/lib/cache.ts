interface Entry<T> {
  v: T;
  exp: number;
}

const PREFIX = 'pkc:v1:';
const memory = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

export const TTL = {
  short: 10 * 60_000,
  day: 24 * 3600_000,
  week: 7 * 24 * 3600_000,
};

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function readPersisted<T>(key: string): Entry<T> | null {
  const s = storage();
  if (!s) return null;
  try {
    const raw = s.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as Entry<T>) : null;
  } catch {
    return null;
  }
}

function evictOldest(s: Storage) {
  const items: { k: string; exp: number }[] = [];
  for (let i = 0; i < s.length; i++) {
    const k = s.key(i);
    if (!k?.startsWith(PREFIX)) continue;
    try {
      items.push({ k, exp: (JSON.parse(s.getItem(k) ?? '{}') as Entry<unknown>).exp ?? 0 });
    } catch {
      items.push({ k, exp: 0 });
    }
  }
  items
    .sort((a, b) => a.exp - b.exp)
    .slice(0, Math.max(5, items.length >> 2))
    .forEach((i) => s.removeItem(i.k));
}

function persist<T>(key: string, entry: Entry<T>, persistent: boolean) {
  const s = persistent ? storage() : null;
  if (!s) return;
  const data = JSON.stringify(entry);
  try {
    s.setItem(PREFIX + key, data);
  } catch {
    try {
      evictOldest(s);
      s.setItem(PREFIX + key, data);
    } catch {
      /* quota dépassé : on reste sur le cache mémoire */
    }
  }
}

/**
 * Cache à deux niveaux (mémoire + localStorage) avec TTL et déduplication
 * des requêtes en cours. Les erreurs ne sont jamais mises en cache.
 */
export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  opts: { ttl?: number; persistent?: boolean } = {},
): Promise<T> {
  const ttl = opts.ttl ?? TTL.day;
  const persistent = opts.persistent ?? true;
  const now = Date.now();

  const mem = memory.get(key) as Entry<T> | undefined;
  if (mem && mem.exp > now) return mem.v;

  const disk = persistent ? readPersisted<T>(key) : null;
  if (disk && disk.exp > now) {
    memory.set(key, disk);
    return disk.v;
  }

  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const p = fetcher()
    .then((v) => {
      const entry = { v, exp: Date.now() + ttl };
      memory.set(key, entry);
      persist(key, entry, persistent);
      return v;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

export function clearCache() {
  memory.clear();
  const s = storage();
  if (!s) return;
  for (let i = s.length - 1; i >= 0; i--) {
    const k = s.key(i);
    if (k?.startsWith(PREFIX)) s.removeItem(k);
  }
}
