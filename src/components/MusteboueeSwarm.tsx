import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PokemonSummary } from '../domain/types';
import { usePokemonList } from '../hooks/usePokemonList';
import { artworkUrl } from '../api/pokeapi';

export const MIN_DELAY_MS = 3 * 60 * 1000;
export const MAX_DELAY_MS = 9 * 60 * 1000;
const MAX = 50;
// Clés v2 : la fonctionnalité repart de zéro pour tout le monde (les anciennes données Mustébouée sont supprimées).
const CAUGHT_KEY = 'pokeclopedie:v2:caught';
const ENCOUNTERS_KEY = 'pokeclopedie:v2:encounters';
const DEX_KEY = 'pokeclopedie:v2:caught-dex';
const ITEMS_KEY = 'pokeclopedie:v2:spawns';
const LEGACY_KEYS = ['pokeclopedie:caught', 'pokeclopedie:caught-dex', 'pokeclopedie:spawns'];

try {
  LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
} catch {
  /* stockage indisponible */
}

export const nextSpawnDelay = (random = Math.random()) => MIN_DELAY_MS + random * (MAX_DELAY_MS - MIN_DELAY_MS);
export const randomLeft = (random = Math.random()) => random * 100;
const SHINY_ODDS = 1 / 128;
const POP_MS = 900;
const CAPTURE_MS = 3300;
const listeners = new Set<() => void>();

export type CatchRarity = 'commun' | 'peu-commun' | 'rare' | 'épique' | 'légendaire' | 'fabuleux';

export function isCaught(shiny: boolean, rarity: CatchRarity, random = Math.random()): boolean {
  return shiny || rarity === 'légendaire' || rarity === 'fabuleux' || random < 0.8;
}

const RARITIES: { id: CatchRarity; label: string }[] = [
  { id: 'commun', label: 'Commun' },
  { id: 'peu-commun', label: 'Peu commun' },
  { id: 'rare', label: 'Rare' },
  { id: 'épique', label: 'Épique' },
  { id: 'légendaire', label: 'Légendaire' },
  { id: 'fabuleux', label: 'Fabuleux' },
];

export function rollRarity(random = Math.random()): CatchRarity {
  if (random < 0.6) return 'commun';
  if (random < 0.85) return 'peu-commun';
  if (random < 0.95) return 'rare';
  if (random < 0.99) return 'épique';
  if (random < 0.999) return 'légendaire';
  return 'fabuleux';
}

/** Rareté d'une espèce : fabuleux = Pokémon fabuleux, légendaire = Pokémon légendaire, sinon selon le total de stats de base. */
export function speciesRarity(p: Pick<PokemonSummary, 'isLegendary' | 'isMythical' | 'stats'>): CatchRarity {
  if (p.isMythical) return 'fabuleux';
  if (p.isLegendary) return 'légendaire';
  const total = Object.values(p.stats).reduce((sum, v) => sum + (v ?? 0), 0);
  if (total >= 600) return 'épique';
  if (total >= 500) return 'rare';
  if (total >= 400) return 'peu-commun';
  return 'commun';
}

/** Tire une rareté puis une espèce de cette rareté ; la rareté d'une apparition découle donc toujours de l'espèce. */
export function pickSpecies(all: PokemonSummary[], randomRarity = Math.random(), randomIndex = Math.random()): PokemonSummary {
  const wanted = rollRarity(randomRarity);
  const tier = all.filter((p) => speciesRarity(p) === wanted);
  const pool = tier.length ? tier : all;
  return pool[Math.floor(randomIndex * pool.length)];
}

export interface CaughtPokemon {
  id: number;
  count: number;
  shinyCount: number;
  firstCaughtAt: string;
  lastCaughtAt: string;
}

interface Spawn {
  id: number;
  pokemonId: number;
  shiny: boolean;
  left: number;
  top: number;
  size: number;
}

interface CatchPop {
  id: number;
  x: number;
  y: number;
  text: string;
  shiny: boolean;
}

interface Capture {
  id: number;
  pokemon: PokemonSummary;
  rarity: CatchRarity;
  shiny: boolean;
  caught: boolean;
  phase: 'animation' | 'result';
}

const rarityLabel = (rarity: CatchRarity) => RARITIES.find((r) => r.id === rarity)?.label ?? RARITIES[0].label;

function readCaught(): number {
  try {
    const count = Number(localStorage.getItem(CAUGHT_KEY));
    return Number.isFinite(count) && count > 0 ? count : 0;
  } catch {
    return 0;
  }
}

export function parseCaughtDex(raw: string | null): CaughtPokemon[] {
  try {
    const parsed: unknown = JSON.parse(raw ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item): CaughtPokemon[] => {
      if (!item || typeof item !== 'object') return [];
      const caught = item as Partial<CaughtPokemon>;
      if (!Number.isInteger(caught.id) || (caught.id ?? 0) <= 0) return [];
      if (!Number.isInteger(caught.count) || (caught.count ?? 0) <= 0) return [];
      const count = caught.count ?? 0;
      const shinyCount = Number.isInteger(caught.shinyCount) && (caught.shinyCount ?? 0) >= 0 ? caught.shinyCount ?? 0 : 0;
      const firstCaughtAt = typeof caught.firstCaughtAt === 'string' ? caught.firstCaughtAt : new Date(0).toISOString();
      const lastCaughtAt = typeof caught.lastCaughtAt === 'string' ? caught.lastCaughtAt : firstCaughtAt;
      return [{ id: caught.id ?? 0, count, shinyCount: Math.min(shinyCount, count), firstCaughtAt, lastCaughtAt }];
    });
  } catch {
    return [];
  }
}

function readDexSnapshot(): string {
  try {
    return localStorage.getItem(DEX_KEY) ?? '[]';
  } catch {
    return '[]';
  }
}

export type DexSort = 'date' | 'number' | 'count';

/** Filtre (shinies seulement) puis tri : date de dernière capture (récent d'abord), n° de Pokédex ou nombre d'exemplaires (plus nombreux d'abord). */
export function viewCaught(list: CaughtPokemon[], sort: DexSort, shinyOnly: boolean): CaughtPokemon[] {
  const out = shinyOnly ? list.filter((c) => c.shinyCount > 0) : [...list];
  const by = {
    date: (a: CaughtPokemon, b: CaughtPokemon) => b.lastCaughtAt.localeCompare(a.lastCaughtAt) || a.id - b.id,
    number: (a: CaughtPokemon, b: CaughtPokemon) => a.id - b.id,
    count: (a: CaughtPokemon, b: CaughtPokemon) => b.count - a.count || a.id - b.id,
  }[sort];
  return out.sort(by);
}

function readEncounters(): number {
  try {
    const n = Number(localStorage.getItem(ENCOUNTERS_KEY));
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

function recordEncounter() {
  try {
    localStorage.setItem(ENCOUNTERS_KEY, String(readEncounters() + 1));
  } catch {
    /* stockage indisponible */
  }
  listeners.forEach((listener) => listener());
}

function recordCatch(pokemonId: number, shiny: boolean) {
  const caught = parseCaughtDex(readDexSnapshot());
  const now = new Date().toISOString();
  const existing = caught.find((item) => item.id === pokemonId);
  const updated = existing
    ? caught.map((item) =>
        item.id === pokemonId
          ? { ...item, count: item.count + 1, shinyCount: item.shinyCount + Number(shiny), lastCaughtAt: now }
          : item,
      )
    : [...caught, { id: pokemonId, count: 1, shinyCount: Number(shiny), firstCaughtAt: now, lastCaughtAt: now }];
  try {
    localStorage.setItem(DEX_KEY, JSON.stringify(updated));
    localStorage.setItem(CAUGHT_KEY, String(readCaught() + 1));
  } catch {
    /* Les captures restent jouables si le stockage est indisponible. */
  }
  listeners.forEach((listener) => listener());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener('storage', callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', callback);
  };
}

export function MusteboueeCounter() {
  const count = useSyncExternalStore(subscribe, readCaught, () => 0);
  const dexSnapshot = useSyncExternalStore(subscribe, readDexSnapshot, () => '[]');
  const { data: pokemon } = usePokemonList();
  const encounters = useSyncExternalStore(subscribe, readEncounters, () => 0);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [sort, setSort] = useState<DexSort>('date');
  const [shinyOnly, setShinyOnly] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);
  const all = parseCaughtDex(dexSnapshot);
  const caught = viewCaught(all, sort, shinyOnly);
  const byId = new Map((pokemon ?? []).map((p) => [p.id, p]));

  useEffect(() => {
    if (open && ref.current && !ref.current.open) ref.current.showModal();
  }, [open]);

  return (
    <>
      <button type="button" className="caught-counter" title="Ouvrir le Pokédex des captures" onClick={() => setOpen(true)}>
        <img src={artworkUrl(418)} alt="" width={26} height={26} />
        <span className="caught-label">Pokémon attrapés : </span>
        <strong key={count}>{count}</strong>
      </button>
      {open && (
        <dialog
          ref={ref}
          className="modal caught-dex"
          aria-labelledby="caught-dex-title"
          onClose={() => setOpen(false)}
          onClick={(event) => event.target === ref.current && ref.current?.close()}
        >
          <div className="caught-dex-body">
            <header className="caught-dex-head">
              <div>
                <h2 id="caught-dex-title">Pokédex des captures</h2>
                <p className="muted small">
                  {all.length} espèce{all.length === 1 ? '' : 's'} sur 1025 · {count} capture{count === 1 ? '' : 's'} · {encounters} rencontre{encounters === 1 ? '' : 's'}
                </p>
              </div>
              <button type="button" className="btn" aria-label="Fermer le Pokédex des captures" onClick={() => ref.current?.close()}>
                ✕
              </button>
            </header>
            <div className="caught-dex-filters">
              <label className="field">
                <span>Trier par</span>
                <select value={sort} onChange={(e) => setSort(e.target.value as DexSort)}>
                  <option value="date">Date de capture (récentes d’abord)</option>
                  <option value="number">Numéro de Pokédex</option>
                  <option value="count">Nombre d’exemplaires</option>
                </select>
              </label>
              <label className="check">
                <input type="checkbox" checked={shinyOnly} onChange={(e) => setShinyOnly(e.target.checked)} /> ✨ Shinies uniquement
              </label>
            </div>
            {caught.length ? (
              <ul className="caught-dex-list">
                {caught.map((entry) => {
                  const p = byId.get(entry.id);
                  return (
                    <li key={entry.id}>
                      <button
                        type="button"
                        className="caught-entry"
                        onClick={() => {
                          ref.current?.close();
                          navigate(`/?p=${entry.id}`);
                        }}
                      >
                        <img src={p?.imageUrl ?? artworkUrl(entry.id)} alt="" width={72} height={72} loading="lazy" />
                        <span className="caught-entry-text">
                          <strong>{p?.nameFr ?? p?.nameEn ?? `Pokémon n° ${entry.id}`}</strong>
                          <span className="muted small">#{String(entry.id).padStart(4, '0')} · ×{entry.count}</span>
                          {entry.shinyCount > 0 && <span className="caught-shiny">✨ {entry.shinyCount} shiny{entry.shinyCount === 1 ? '' : 's'}</span>}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="muted caught-dex-empty">
                {all.length ? 'Aucun shiny capturé pour l’instant.' : 'Aucun Pokémon capturé pour l’instant. Gardez l’œil ouvert pendant votre visite !'}
              </p>
            )}
          </div>
        </dialog>
      )}
    </>
  );
}

function loadItems(): Spawn[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(ITEMS_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, MAX).flatMap((item): Spawn[] => {
      if (!item || typeof item !== 'object') return [];
      const value = item as Partial<Spawn>;
      if (![value.id, value.left, value.top, value.size].every((n) => typeof n === 'number' && Number.isFinite(n))) return [];
      return [{
        id: value.id ?? 0,
        pokemonId: Number.isInteger(value.pokemonId) && (value.pokemonId ?? 0) > 0 ? value.pokemonId ?? 418 : 418,
        shiny: value.shiny === true,
        left: Math.max(0, Math.min(100, value.left ?? 0)),
        top: Math.max(0, value.top ?? 0),
        size: Math.max(40, Math.min(120, value.size ?? 40)),
      }];
    });
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
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    window.addEventListener('resize', measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);
  return height;
}

function shinyArtwork(url: string, id: number): string {
  return url.includes('/official-artwork/') ? url.replace(/\/(\d+)\.png$/, `/shiny/${id}.png`) : artworkUrl(id);
}

export function MusteboueeSwarm() {
  const { data: pokemon } = usePokemonList();
  const [items, setItems] = useState<Spawn[]>(loadItems);
  const [pops, setPops] = useState<CatchPop[]>([]);
  const [capture, setCapture] = useState<Capture>();
  const pageHeight = usePageHeight();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nextId = useRef(items.reduce((max, item) => Math.max(max, item.id), 0));

  useEffect(() => {
    try {
      localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
    } catch {
      /* Les apparitions restent jouables en mémoire. */
    }
  }, [items]);

  useEffect(() => {
    if (!pokemon?.length) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(spawnOne, nextSpawnDelay());
    };
    // Tirage avec remise : la même espèce peut apparaître (et être capturée) plusieurs fois.
    const spawnOne = () => {
      const species = pickSpecies(pokemon);
      const size = 40 + Math.round(Math.random() * 80);
      const spawn: Spawn = {
        id: ++nextId.current,
        pokemonId: species.id,
        shiny: Math.random() < SHINY_ODDS,
        left: randomLeft(),
        top: window.scrollY + Math.random() * Math.max(window.innerHeight - size, 0),
        size,
      };
      setItems((current) => (current.length >= MAX ? current : [...current, spawn]));
      recordEncounter();
      schedule();
    };
    schedule();
    return () => clearTimeout(timer);
  }, [pokemon]);

  useEffect(() => {
    if (!capture) return;
    if (dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal();
    if (capture.phase !== 'animation') return;
    const timer = setTimeout(() => {
      setCapture((current) => current?.id === capture.id ? { ...capture, phase: 'result' } : current);
    }, CAPTURE_MS);
    return () => clearTimeout(timer);
  }, [capture]);

  return (
    <>
      {items.map((item) => {
        const species = pokemon?.find((p) => p.id === item.pokemonId);
        if (!species) return null;
        const name = species.nameFr ?? species.nameEn ?? species.slug;
        const rarity = speciesRarity(species);
        return (
          <button
            key={item.id}
            type="button"
            className={`mustebouee-spawn rarity-${rarity}${item.shiny ? ' is-shiny' : ''}`}
            aria-label={`Capturer ${name}, rareté ${rarityLabel(rarity)}${item.shiny ? ', shiny' : ''}`}
            disabled={Boolean(capture)}
            style={{ left: `calc(${item.left}% - ${item.size * item.left / 100}px)`, top: clampTop(item.top, item.size, pageHeight), width: item.size, height: item.size }}
            onClick={(event) => {
              setItems((current) => current.filter((entry) => entry.id !== item.id));
              const caught = isCaught(item.shiny, rarity);
              const rect = event.currentTarget.getBoundingClientRect();
              const pop: CatchPop = {
                id: item.id,
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
                text: caught ? (item.shiny ? '✨' : '+1') : '✕',
                shiny: item.shiny,
              };
              setPops((current) => [...current, pop]);
              setTimeout(() => setPops((current) => current.filter((entry) => entry.id !== pop.id)), POP_MS);
              setCapture({ id: item.id, pokemon: species, rarity, shiny: item.shiny, caught, phase: 'animation' });
              if (caught) recordCatch(species.id, item.shiny);
            }}
          >
            <img src={item.shiny ? shinyArtwork(species.imageUrl, species.id) : species.imageUrl} alt="" draggable={false} />
            {item.shiny && <span className="spawn-shiny" aria-hidden="true">✨</span>}
          </button>
        );
      })}
      {pops.length > 0 && (
        <div className="catch-layer" aria-hidden="true">
          {pops.map((pop) => (
            <span key={pop.id} className={`catch-pop${pop.shiny ? ' catch-pop-shiny' : ''}`} style={{ left: pop.x, top: pop.y }}>
              {pop.text}
            </span>
          ))}
        </div>
      )}
      {capture && (
        <dialog
          ref={dialogRef}
          className={`modal capture-modal${capture.shiny ? ' is-shiny' : ''}`}
          aria-labelledby="capture-title"
          onClose={() => setCapture(undefined)}
          onClick={(event) => event.target === dialogRef.current && dialogRef.current?.close()}
        >
          <div className={`capture-body capture-${capture.phase}`}>
            <div className="capture-stage" aria-hidden="true">
              {capture.phase === 'animation' ? (
                <>
                  <img className="capture-pokemon" src={capture.shiny ? shinyArtwork(capture.pokemon.imageUrl, capture.pokemon.id) : capture.pokemon.imageUrl} alt="" />
                  <span className="capture-ball"><span /></span>
                  {capture.shiny && <span className="capture-stars">✦ ✧ ✦</span>}
                </>
              ) : (
                <img className="capture-result-image" src={capture.shiny ? shinyArtwork(capture.pokemon.imageUrl, capture.pokemon.id) : capture.pokemon.imageUrl} alt="" />
              )}
            </div>
            {capture.phase === 'animation' ? (
              <>
                <h2 id="capture-title">Capture en cours…</h2>
                <p className="muted">{capture.shiny ? '✨ Un Pokémon shiny ! ✨' : 'La Poké Ball s’agite…'}</p>
              </>
            ) : (
              <>
                <h2 id="capture-title">{!capture.caught ? 'Le Pokémon s’est échappé !' : capture.shiny ? '✨ Incroyable, un shiny ! ✨' : `${capture.pokemon.nameFr ?? capture.pokemon.nameEn ?? capture.pokemon.slug} capturé !`}</h2>
                <p className="muted">{capture.pokemon.nameFr ?? capture.pokemon.nameEn ?? capture.pokemon.slug} · {rarityLabel(capture.rarity)}{capture.shiny ? ' · Shiny' : ''}</p>
                <button type="button" className="btn primary" onClick={() => dialogRef.current?.close()}>Continuer</button>
              </>
            )}
          </div>
        </dialog>
      )}
    </>
  );
}
