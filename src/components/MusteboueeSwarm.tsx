import { useEffect, useState, useSyncExternalStore } from 'react';

const IMAGE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/418.png';
const MIN_DELAY_MS = 3 * 60 * 1000;
const MAX_DELAY_MS = 15 * 60 * 1000;
const MAX = 50;
const LIFETIME_MS = 60 * 60 * 1000;
const CAUGHT_KEY = 'pokeclopedie:caught';
const listeners = new Set<() => void>();

function readCaught(): number {
  try {
    return Number(localStorage.getItem(CAUGHT_KEY)) || 0;
  } catch {
    return 0;
  }
}

function addCaught() {
  try {
    localStorage.setItem(CAUGHT_KEY, String(readCaught() + 1));
  } catch {
    /* stockage indisponible */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener('storage', cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', cb);
  };
}

export function MusteboueeCounter() {
  const n = useSyncExternalStore(subscribe, readCaught, () => 0);
  return (
    <span className="caught-counter" title="Mustébouées attrapées">
      Mustébouées attrapés : <strong>{n}</strong>
    </span>
  );
}

interface Spawn {
  id: number;
  left: number;
  top: number;
  size: number;
}

/** Position horizontale : 80 % des apparitions dans les marges latérales (0-12 % ou 88-100 %). */
function randomLeft(): number {
  const r = Math.random();
  if (r < 0.4) return Math.random() * 12;
  if (r < 0.8) return 88 + Math.random() * 12;
  return 12 + Math.random() * 76;
}

export function MusteboueeSwarm() {
  const [items, setItems] = useState<Spawn[]>([]);

  useEffect(() => {
    let id = 0;
    const timeouts = new Set<ReturnType<typeof setTimeout>>();
    let timer: ReturnType<typeof setTimeout>;
    const spawnOne = () => {
      const size = 40 + Math.round(Math.random() * 80);
      const docHeight = Math.max(document.documentElement.scrollHeight, window.innerHeight);
      const spawn: Spawn = {
        id: ++id,
        left: randomLeft(),
        top: Math.random() * Math.max(docHeight - size, 0),
        size,
      };
      setItems((cur) => (cur.length >= MAX ? cur : [...cur, spawn]));
      const t = setTimeout(() => {
        timeouts.delete(t);
        setItems((cur) => cur.filter((x) => x.id !== spawn.id));
      }, LIFETIME_MS);
      timeouts.add(t);
      schedule();
    };
    const schedule = () => {
      timer = setTimeout(spawnOne, MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS));
    };
    schedule();
    return () => {
      clearTimeout(timer);
      timeouts.forEach(clearTimeout);
    };
  }, []);

  return (
    <>
      {items.map((m) => (
        <button
          key={m.id}
          type="button"
          className="mustebouee-spawn"
          aria-label="Mustébouée"
          style={{ left: `min(${m.left}%, calc(100% - ${m.size}px))`, top: m.top, width: m.size, height: m.size }}
          onClick={() => {
            addCaught();
            setItems((cur) => cur.filter((x) => x.id !== m.id));
          }}
        >
          <img src={IMAGE} alt="" draggable={false} />
        </button>
      ))}
    </>
  );
}
