import { useEffect, useState, useSyncExternalStore } from 'react';

const IMAGE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/418.png';
const MIN_DELAY_MS = 2 * 60 * 1000;
const MAX_DELAY_MS = 10 * 60 * 1000;
const MAX = 50;
const CAUGHT_KEY = 'pokeclopedie:caught';
const ITEMS_KEY = 'pokeclopedie:spawns';
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
      <img src={IMAGE} alt="" width={26} height={26} />
      <span className="caught-label">Mustébouées attrapées : </span>
      <strong key={n}>{n}</strong>
    </span>
  );
}

interface CatchPop {
  id: number;
  x: number;
  y: number;
}

/** Durée de l'animation « +1 » (catch-up dans global.css). */
const POP_MS = 900;

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

function loadItems(): Spawn[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(ITEMS_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.slice(0, MAX) : [];
  } catch {
    return [];
  }
}

/** Garde la mascotte dans la page : les positions stockées viennent peut-être d'une page plus longue. */
export function clampTop(top: number, size: number, pageHeight: number): number {
  return Math.max(0, Math.min(top, pageHeight - size));
}

/** Hauteur du contenu de la page, hors mascottes (absolues, donc sans effet sur la hauteur du body). */
function usePageHeight(): number {
  const [height, setHeight] = useState(() => Math.max(document.body.offsetHeight, window.innerHeight));
  useEffect(() => {
    const measure = () => setHeight(Math.max(document.body.offsetHeight, window.innerHeight));
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    window.addEventListener('resize', measure);
    measure();
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);
  return height;
}

export function MusteboueeSwarm() {
  const [items, setItems] = useState<Spawn[]>(loadItems);
  const [pops, setPops] = useState<CatchPop[]>([]);
  const pageHeight = usePageHeight();

  useEffect(() => {
    try {
      localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
    } catch {
      /* stockage indisponible */
    }
  }, [items]);

  useEffect(() => {
    let id = items.reduce((max, x) => Math.max(max, x.id), 0);
    let timer: ReturnType<typeof setTimeout>;
    const spawnOne = () => {
      const size = 40 + Math.round(Math.random() * 80);
      const spawn: Spawn = {
        id: ++id,
        left: randomLeft(),
        top: window.scrollY + Math.random() * Math.max(window.innerHeight - size, 0),
        size,
      };
      setItems((cur) => (cur.length >= MAX ? cur : [...cur, spawn]));
      schedule();
    };
    const schedule = () => {
      timer = setTimeout(spawnOne, MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS));
    };
    schedule();
    return () => {
      clearTimeout(timer);
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
          style={{ left: `min(${m.left}%, calc(100% - ${m.size}px))`, top: clampTop(m.top, m.size, pageHeight), width: m.size, height: m.size }}
          onClick={(e) => {
            addCaught();
            setItems((cur) => cur.filter((x) => x.id !== m.id));
            // Centre de la mascotte plutôt que le pointeur : au clavier (Entrée), le clic n'a pas de position.
            const r = e.currentTarget.getBoundingClientRect();
            const pop = { id: m.id, x: r.left + r.width / 2, y: r.top + r.height / 2 };
            setPops((cur) => [...cur, pop]);
            // Retrait par minuteur (et non animationend) : sans animation (mouvement réduit), l'événement ne viendrait jamais.
            setTimeout(() => setPops((cur) => cur.filter((x) => x !== pop)), POP_MS);
          }}
        >
          <img src={IMAGE} alt="" draggable={false} />
        </button>
      ))}
      {pops.length > 0 && (
        <div className="catch-layer" aria-hidden="true">
          {pops.map((p) => (
            <span key={p.id} className="catch-pop" style={{ left: p.x, top: p.y }}>
              +1
            </span>
          ))}
        </div>
      )}
    </>
  );
}
