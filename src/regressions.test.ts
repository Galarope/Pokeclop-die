import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearCache } from './lib/cache';
import { applyPatch, shouldReplaceHistory } from './hooks/useUrlState';
import { resolveTeamName } from './lib/savedTeams';
import { clampTop, MAX_DELAY_MS, MIN_DELAY_MS, nextSpawnDelay, parseCaughtDex, rollRarity, viewCaught } from './components/MusteboueeSwarm';
import { buildCardsUrl, MAX_DEX_NUMBER, tcgdex } from './sources/tcgdex';
import type { CardBrief } from './domain/types';

describe('useUrlState', () => {
  it('ajoute une entrée d\'historique quand le popup (p) s\'ouvre, change ou se ferme', () => {
    expect(shouldReplaceHistory({ p: '25' })).toBe(false);
    expect(shouldReplaceHistory({ p: '' })).toBe(false);
  });

  it('remplace l\'entrée courante pour les filtres', () => {
    expect(shouldReplaceHistory({ q: 'pika' })).toBe(true);
    expect(shouldReplaceHistory({ gen: '1', type: 'fire' })).toBe(true);
  });

  it('applique le patch : valeur vide = paramètre retiré, page remise à zéro', () => {
    const next = applyPatch(new URLSearchParams('q=a&p=3&page=4'), { p: '' }, false);
    expect(next.toString()).toBe('q=a&page=4');
    expect(applyPatch(new URLSearchParams('page=4'), { q: 'x' }).has('page')).toBe(false);
  });
});

describe('noms d\'équipe', () => {
  it('un nom vide ou blanc garde l\'ancien, sinon le nom est nettoyé', () => {
    expect(resolveTeamName('   ', 'Mon équipe')).toBe('Mon équipe');
    expect(resolveTeamName('', 'Mon équipe')).toBe('Mon équipe');
    expect(resolveTeamName('  Nouvelle  ', 'Mon équipe')).toBe('Nouvelle');
  });
});

describe('mustébouées', () => {
  it('reste dans la page quand elle est plus courte que la position stockée', () => {
    expect(clampTop(3000, 100, 800)).toBe(700);
    expect(clampTop(300, 100, 800)).toBe(300);
    expect(clampTop(10, 100, 50)).toBe(0);
  });

  it('tire une rareté selon des seuils qui deviennent plus rares', () => {
    expect(rollRarity(0)).toBe('commun');
    expect(rollRarity(0.6)).toBe('peu-commun');
    expect(rollRarity(0.85)).toBe('rare');
    expect(rollRarity(0.95)).toBe('épique');
    expect(rollRarity(0.99)).toBe('légendaire');
    expect(rollRarity(0.999)).toBe('fabuleux');
  });

  it('fait apparaître un Pokémon toutes les 3 à 9 minutes', () => {
    expect(MIN_DELAY_MS).toBe(3 * 60_000);
    expect(MAX_DELAY_MS).toBe(9 * 60_000);
    expect(nextSpawnDelay(0)).toBe(MIN_DELAY_MS);
    expect(nextSpawnDelay(1)).toBe(MAX_DELAY_MS);
  });

  it('trie le Pokédex des captures et filtre les shinies', () => {
    const e = (id: number, count: number, shinyCount: number, last: string) => ({ id, count, shinyCount, firstCaughtAt: last, lastCaughtAt: last });
    const list = [e(25, 1, 0, '2026-01-02'), e(4, 3, 1, '2026-01-01'), e(150, 2, 0, '2026-01-03')];
    expect(viewCaught(list, 'date', false).map((c) => c.id)).toEqual([150, 25, 4]);
    expect(viewCaught(list, 'number', false).map((c) => c.id)).toEqual([4, 25, 150]);
    expect(viewCaught(list, 'count', false).map((c) => c.id)).toEqual([4, 150, 25]);
    expect(viewCaught(list, 'number', true).map((c) => c.id)).toEqual([4]);
  });

  it('nettoie les entrées invalides du Pokédex des captures', () => {
    expect(parseCaughtDex(JSON.stringify([
      { id: 25, count: 2, shinyCount: 8 },
      { id: -1, count: 1, shinyCount: 0 },
      { id: 4, count: 0, shinyCount: 0 },
      null,
    ]))).toEqual([
      {
        id: 25,
        count: 2,
        shinyCount: 2,
        firstCaughtAt: new Date(0).toISOString(),
        lastCaughtAt: new Date(0).toISOString(),
      },
    ]);
    expect(parseCaughtDex('{invalide')).toEqual([]);
  });
});

describe('filtre par bloc', () => {
  it('compare les codes d\'extension exactement (le bloc Base ne doit pas attraper bwp via wp)', () => {
    const url = decodeURIComponent(buildCardsUrl({ lang: 'fr', setIds: ['base1', 'wp'] }));
    expect(url).toContain('set.id=eq:base1|wp');
  });
});

describe('plage de n° de Pokédex', () => {
  beforeEach(() => clearCache());
  afterEach(() => vi.unstubAllGlobals());

  const askedNumbers = (fetchMock: ReturnType<typeof vi.fn>) =>
    fetchMock.mock.calls.map(([url]) => Number(decodeURIComponent(String(url)).match(/dexId=eq:(\d+)/)?.[1]));

  it('cherche toute la plage demandée, pas seulement ses 100 premiers numéros', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => [] }));
    vi.stubGlobal('fetch', fetchMock);
    await tcgdex.searchCards({ lang: 'fr', dexMin: 430, dexMax: 790 });
    const asked = askedNumbers(fetchMock);
    expect(asked).toHaveLength(361);
    expect(Math.min(...asked)).toBe(430);
    expect(Math.max(...asked)).toBe(790);
  });

  it('s\'arrête au plus haut numéro possible au lieu de lancer des milliers de requêtes', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => [] }));
    vi.stubGlobal('fetch', fetchMock);
    await tcgdex.searchCards({ lang: 'fr', dexMin: 1000, dexMax: 99999 });
    expect(Math.max(...askedNumbers(fetchMock))).toBe(MAX_DEX_NUMBER);
  });

  it('ne lance plus de requêtes une fois la recherche abandonnée (filtre modifié entre-temps)', async () => {
    const ctrl = new AbortController();
    const fetchMock = vi.fn(async () => {
      if (fetchMock.mock.calls.length === 10) ctrl.abort();
      return { ok: true, json: async () => [] };
    });
    vi.stubGlobal('fetch', fetchMock);
    // Échoue plutôt que de renvoyer une liste partielle qui aurait l'air complète.
    await expect(tcgdex.searchCards({ lang: 'fr', dexMin: 1, dexMax: 500 }, ctrl.signal)).rejects.toThrow();
    const afterAbort = fetchMock.mock.calls.length;
    await new Promise((r) => setTimeout(r, 20));
    expect(afterAbort).toBeLessThan(20);
    expect(fetchMock.mock.calls.length).toBe(afterAbort);
  });

  it('s\'arrête à la première erreur au lieu de continuer la plage pour rien', async () => {
    const fetchMock = vi.fn(async () =>
      fetchMock.mock.calls.length === 5 ? { ok: false, status: 404 } : { ok: true, json: async () => [] },
    );
    vi.stubGlobal('fetch', fetchMock);
    await expect(tcgdex.searchCards({ lang: 'fr', dexMin: 1, dexMax: 500 })).rejects.toThrow();
    await new Promise((r) => setTimeout(r, 20));
    expect(fetchMock.mock.calls.length).toBeLessThan(20);
  });

  it('ne conserve pas chaque numéro d\'une plage dans localStorage (quota)', async () => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      get length() { return store.size; },
      key: (i: number) => [...store.keys()][i] ?? null,
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    });
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [] })));
    await tcgdex.searchCards({ lang: 'fr', dexMin: 1, dexMax: 50 });
    expect([...store.keys()].filter((k) => k.includes('dexId'))).toEqual([]);
  });
});

describe('tcgdex.resolveImage', () => {
  const card = { lang: 'fr', id: 'mep-1', setId: 'mep', localId: '1' } as CardBrief;

  beforeEach(() => {
    clearCache();
    vi.stubGlobal('Image', class { onload?: () => void; set src(_: string) { queueMicrotask(() => this.onload?.()); } });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('réutilise le set en cache au lieu de le re-télécharger', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ id: 'mep', name: 'Promos', serie: { id: 'mep-serie' }, cards: [] }) }));
    vi.stubGlobal('fetch', fetchMock);
    await tcgdex.getSet('fr', 'mep');
    expect(await tcgdex.resolveImage!(card)).toBe('https://assets.tcgdex.net/fr/mep-serie/mep/1');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
