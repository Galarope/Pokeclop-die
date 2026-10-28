import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cached, clearCache } from './lib/cache';
import { mapLimit, normalize } from './lib/utils';
import { buildCardsUrl, imageUrl, setIdOf } from './sources/tcgdex';
import { mapSpecies, toEvolutionTree, describeEvolution } from './api/pokeapi';

describe('tcgdex helpers', () => {
  it('extrait l\'id d\'extension même avec des tirets', () => {
    expect(setIdOf({ id: 'base1-58', localId: '58' })).toBe('base1');
    expect(setIdOf({ id: 'tk-hs-r-2', localId: '2' })).toBe('tk-hs-r');
    expect(setIdOf({ id: 'exu-!', localId: '!' })).toBe('exu');
  });

  it('construit des URL avec filtres exacts (eq:) et pagination', () => {
    const url = decodeURIComponent(buildCardsUrl({ lang: 'fr', dexId: 25, setId: 'base1', rarity: 'Commune', page: 2, pageSize: 24 }));
    expect(url).toContain('/v2/fr/cards?');
    expect(url).toContain('dexId=eq:25');
    expect(url).toContain('set.id=eq:base1');
    expect(url).toContain('rarity=eq:Commune');
    expect(url).toContain('pagination:page=2');
    expect(buildCardsUrl({ lang: 'en' })).toBe('https://api.tcgdex.net/v2/en/cards');
  });

  it('construit les filtres PV, stade, illustrateur et tri', () => {
    const url = decodeURIComponent(buildCardsUrl({ lang: 'fr', stage: 'Base', hpMin: 60, hpMax: 90, illustrator: 'Arita', sort: 'illustrator' }));
    expect(url).toContain('stage=eq:Base');
    expect(url).toContain('hp=gte:60&hp=lte:90');
    expect(url).toContain('illustrator=Arita');
    expect(url).toContain('sort:field=illustrator');
  });

  it('ne fabrique pas d\'image quand elle est absente', () => {
    expect(imageUrl(undefined)).toBeUndefined();
    expect(imageUrl('https://x/y/1', 'high')).toBe('https://x/y/1/high.webp');
  });
});

describe('pokeapi mapping', () => {
  it('mappe une espèce GraphQL et laisse undefined ce qui manque', () => {
    const p = mapSpecies({
      id: 25,
      name: 'pikachu',
      generation_id: 1,
      pokemon_v2_pokemonspeciesnames: [{ name: 'Pikachu', language_id: 9 }],
      pokemon_v2_pokemons: [
        {
          height: 4,
          weight: 60,
          pokemon_v2_pokemontypes: [{ pokemon_v2_type: { name: 'electric', pokemon_v2_typenames: [] } }],
          pokemon_v2_pokemonstats: [{ base_stat: 35, pokemon_v2_stat: { name: 'hp' } }],
        },
      ],
    });
    expect(p.nameEn).toBe('Pikachu');
    expect(p.nameFr).toBeUndefined();
    expect(p.types[0]).toEqual({ slug: 'electric', labelFr: undefined });
    expect(p.stats).toEqual({ hp: 35 });
  });

  it('construit l\'arbre d\'évolution', () => {
    const tree = toEvolutionTree({
      species: { name: 'pichu', url: 'https://pokeapi.co/api/v2/pokemon-species/172/' },
      evolution_details: [],
      evolves_to: [
        {
          species: { name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon-species/25/' },
          evolution_details: [{ min_level: null, item: null, trigger: { name: 'level-up' }, min_happiness: 220, known_move: null, location: null, time_of_day: '' }],
          evolves_to: [],
        },
      ],
    });
    expect(tree.speciesId).toBe(172);
    expect(tree.children[0].speciesId).toBe(25);
    expect(tree.children[0].conditions).toEqual(['Bonheur ≥ 220']);
    expect(describeEvolution({ min_level: 16, item: null, trigger: null, min_happiness: null, known_move: null, location: null, time_of_day: '' })).toBe('Niveau 16');
  });
});

describe('utils', () => {
  it('normalise les accents', () => expect(normalize(' Évoli ')).toBe('evoli'));

  it('mapLimit respecte la concurrence et isole les erreurs', async () => {
    let running = 0;
    let max = 0;
    const res = await mapLimit([1, 2, 3, 4, 5, 6], 2, async (n) => {
      running++;
      max = Math.max(max, running);
      await new Promise((r) => setTimeout(r, 5));
      running--;
      if (n === 3) throw new Error('x');
      return n;
    });
    expect(max).toBeLessThanOrEqual(2);
    expect(res.filter((r) => r.status === 'rejected')).toHaveLength(1);
  });
});

describe('cache', () => {
  beforeEach(() => clearCache());

  it('met en cache et déduplique les appels simultanés', async () => {
    const fn = vi.fn(async () => 42);
    const [a, b] = await Promise.all([cached('k', fn, { persistent: false }), cached('k', fn, { persistent: false })]);
    await cached('k', fn, { persistent: false });
    expect([a, b]).toEqual([42, 42]);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('ne met pas les erreurs en cache', async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce('ok');
    await expect(cached('e', fn, { persistent: false })).rejects.toThrow('boom');
    expect(await cached('e', fn, { persistent: false })).toBe('ok');
  });

  it('expire selon le TTL', async () => {
    const fn = vi.fn(async () => 1);
    await cached('t', fn, { ttl: -1, persistent: false });
    await cached('t', fn, { ttl: -1, persistent: false });
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
