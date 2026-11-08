import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CardBrief, CardDetail, PokemonSummary } from './domain/types';
import { mergeCatches, parseBackup, exportBackup, importBackup } from './lib/backup';
import { sortCards } from './lib/cardSort';
import { recommendTeam, weaknesses } from './lib/teamAnalysis';

const pokemon = (id: number, ...types: string[]): PokemonSummary => ({
  id, slug: `pokemon-${id}`, generation: 1, stats: {}, imageUrl: '', types: types.map((slug) => ({ slug })),
});

describe('comparaison et recommandations', () => {
  it('calcule les faiblesses des deux types, immunités comprises', () => {
    const weak = weaknesses(pokemon(1, 'water', 'ground'));
    expect(weak).toContain('grass');
    expect(weak).not.toContain('electric');
    expect(weak).not.toContain('water');
  });

  it('suggère les espèces qui couvrent des lacunes ou résistent aux faiblesses, sans les membres existants', () => {
    const fire = pokemon(1, 'fire');
    const water = pokemon(2, 'water');
    const grass = pokemon(3, 'grass');
    const result = recommendTeam([fire], [fire, water, grass]);
    expect(result.uncovered).toContain('fire');
    expect(result.vulnerable).toContain('water');
    expect(result.suggestions.find((s) => s.pokemon.id === 3)?.resistance).toContain('water');
    expect(result.suggestions.some((s) => s.pokemon.id === 1)).toBe(false);
  });
});

const card = (id: string, setId: string, localId: string): CardBrief => ({
  uid: id, id, setId, localId, source: 'tcgdex', lang: 'fr', name: id,
});

describe('tri des cartes', () => {
  const cards = [card('a', 's1', '10'), card('b', 's2', '2'), card('c', 's3', 'A1')];
  it('trie les numéros naturellement et les dates manquantes en dernier', () => {
    expect(sortCards(cards, 'number', new Map()).map((c) => c.uid)).toEqual(['b', 'a', 'c']);
    expect(sortCards(cards, 'year', new Map([['s1', '2020-12-01'], ['s2', '2019-01-01']])).map((c) => c.uid)).toEqual(['b', 'a', 'c']);
  });
  it('trie les raretés classées et laisse les inconnues en dernier', () => {
    const details = new Map<string, CardDetail>([
      ['a', { ...cards[0], rarity: 'Rare' }],
      ['b', { ...cards[1], rarity: 'Commune' }],
      ['c', { ...cards[2], rarity: 'Promo' }],
    ]);
    expect(sortCards(cards, 'rarity', new Map(), details).map((c) => c.uid)).toEqual(['b', 'a', 'c']);
  });
});

describe('sauvegarde fusionnée', () => {
  afterEach(() => vi.unstubAllGlobals());
  const caught = (id: number, count: number, shinyCount: number) => ({
    id, count, shinyCount, firstCaughtAt: '2020-01-01T00:00:00.000Z', lastCaughtAt: '2021-01-01T00:00:00.000Z',
  });
  it('fusionne les captures de manière idempotente et conserve les compteurs maximaux', () => {
    const merged = mergeCatches([caught(1, 5, 1)], [caught(1, 3, 2), caught(2, 1, 0)]);
    expect(merged).toEqual([caught(1, 5, 2), caught(2, 1, 0)]);
    expect(mergeCatches(merged, [caught(1, 3, 2), caught(2, 1, 0)])).toEqual(merged);
  });
  it('refuse les sauvegardes mal formées et les doublons', () => {
    expect(() => parseBackup('{}')).toThrow();
    expect(() => parseBackup(JSON.stringify({ format: 'pokeclopedie-backup', version: 1, teams: [], catches: [caught(1, 1, 0), caught(1, 2, 0)], caught: 3, encounters: 3 }))).toThrow();
  });
  it('exporte et fusionne les équipes et captures sans doubler une réimportation', () => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
    });
    vi.stubGlobal('window', { dispatchEvent: vi.fn() });
    const teams = [{ id: 'a', name: 'Équipe', createdAt: '2020-01-01T00:00:00.000Z', members: [1] }];
    store.set('pokeclopedie:v2:caught-dex', JSON.stringify([caught(1, 2, 1)]));
    store.set('pokeclopedie:v2:caught', '2');
    store.set('pokeclopedie:v2:encounters', '3');
    const backup = parseBackup(exportBackup(teams));
    store.clear();
    expect(importBackup(backup, []).teams).toBe(1);
    expect(store.get('pokeclopedie:v2:caught')).toBe('2');
    expect(store.get('pokeclopedie:v2:encounters')).toBe('3');
    expect(importBackup(backup, teams).teams).toBe(0);
    expect(store.get('pokeclopedie:v2:caught')).toBe('2');
  });
  it('préserve le total et annule les écritures si le stockage échoue', () => {
    const store = new Map<string, string>([
      ['pokeclopedie:teams', '[]'],
      ['pokeclopedie:v2:caught-dex', JSON.stringify([caught(1, 1, 0)])],
      ['pokeclopedie:v2:caught', '5'],
      ['pokeclopedie:v2:encounters', '6'],
    ]);
    let fail = true;
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        if (key === 'pokeclopedie:v2:caught' && fail) {
          fail = false;
          throw new Error('quota');
        }
        store.set(key, value);
      },
      removeItem: (key: string) => store.delete(key),
    });
    vi.stubGlobal('window', { dispatchEvent: vi.fn() });
    const backup = parseBackup(exportBackup([]));
    const before = [...store.entries()];
    expect(() => importBackup(backup, [])).toThrow('quota');
    expect([...store.entries()]).toEqual(before);
    importBackup(backup, []);
    expect(store.get('pokeclopedie:v2:caught')).toBe('5');
  });
});
