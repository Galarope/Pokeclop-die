import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cached, clearCache } from './lib/cache';
import { mapLimit, normalize } from './lib/utils';
import { buildCardsUrl, cleanIllustrators, imageUrl, setIdOf, tcgdex } from './sources/tcgdex';
import { raritiesAtLeast, rarityLevel, UNRANKED_RARITIES } from './sources/tcgdexRarities';
import { formatShortDate, NO_MATCH, parseTypeList, resolveSetFilter, serieLabel, serieYears, setIdsReleasedSince } from './lib/cardFilters';
import type { SetRelease } from './domain/types';
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

  it('cumule rareté exacte et raretés acceptées, et exclut chaque type refusé', () => {
    const url = decodeURIComponent(
      buildCardsUrl({ lang: 'fr', rarity: 'Rare', rarities: ['Rare', 'Ultra Rare'], type: 'Eau', excludeTypes: ['Feu', 'Psy'] }),
    ).replace(/\+/g, ' ');
    expect(url).toContain('rarity=eq:Rare&rarity=eq:Rare|Ultra Rare');
    expect(url).toContain('types=eq:Eau&types=neq:Feu&types=neq:Psy');
  });

  it('nettoie la liste des illustrateurs', () => {
    expect(cleanIllustrators([' Ken Sugimori', 'aoki', 'Ken Sugimori', '', 'Ébila', 'Atsuko Nishida'])).toEqual([
      'aoki',
      'Atsuko Nishida',
      'Ébila',
      'Ken Sugimori',
    ]);
  });

  it('ne fabrique pas d\'image quand elle est absente', () => {
    expect(imageUrl(undefined)).toBeUndefined();
    expect(imageUrl('https://x/y/1', 'high')).toBe('https://x/y/1/high.webp');
  });
});

describe('dates des extensions', () => {
  const releases: SetRelease[] = [
    { id: 'sm1', releaseDate: '2017-02-03', serieId: 'sm' },
    { id: 'sm12', releaseDate: '2019-11-01', serieId: 'sm' },
    { id: 'swsh1', releaseDate: '2020-02-07', serieId: 'swsh' },
    { id: 'sv01', releaseDate: '2023-03-31', serieId: 'sv' },
  ];

  it('affiche la plage d\'années d\'un bloc, ou une seule année', () => {
    expect(serieLabel('Soleil et Lune', serieYears('sm', releases))).toBe('Soleil et Lune (2017–2019)');
    expect(serieLabel('Épée et Bouclier', serieYears('swsh', releases))).toBe('Épée et Bouclier (2020)');
    expect(serieLabel('Inconnu', serieYears('xx', releases))).toBe('Inconnu');
  });

  it('formate une date ISO en JJ/MM/AAAA sans décalage de fuseau', () => {
    expect(formatShortDate('2019-11-01')).toBe('01/11/2019');
    expect(formatShortDate(undefined)).toBeUndefined();
  });

  it('garde les extensions sorties à la date choisie ou après', () => {
    expect(setIdsReleasedSince('2019-11-01', releases)).toEqual(['sm12', 'swsh1', 'sv01']);
    expect(setIdsReleasedSince('2030-01-01', releases)).toEqual([]);
  });

  it('combine extension, bloc et date', () => {
    expect(resolveSetFilter('')).toEqual({});
    expect(resolveSetFilter('sm1')).toEqual({ setId: 'sm1' });
    expect(resolveSetFilter('', ['sm1', 'sm12'], ['sm12', 'swsh1'])).toEqual({ setIds: ['sm12'] });
    expect(resolveSetFilter('', undefined, ['swsh1'])).toEqual({ setIds: ['swsh1'] });
    expect(resolveSetFilter('', ['sm1'], ['swsh1'])).toEqual({ setIds: [NO_MATCH] });
    expect(resolveSetFilter('', [])).toEqual({ setIds: [NO_MATCH] });
    expect(resolveSetFilter('sm1', ['sm1', 'sm12'], ['sm12'])).toEqual({ setIds: [NO_MATCH] });
    expect(resolveSetFilter('sm12', ['sm1', 'sm12'], ['sm12'])).toEqual({ setId: 'sm12' });
  });

  it('lit les types exclus depuis l\'URL', () => {
    expect(parseTypeList('')).toEqual([]);
    expect(parseTypeList('Feu,Eau')).toEqual(['Feu', 'Eau']);
  });
});

describe('tcgdex.listSetReleases', () => {
  beforeEach(() => clearCache());
  afterEach(() => vi.unstubAllGlobals());

  it('prend les dates du GraphQL et lit le détail des extensions qu\'il ne connaît pas', async () => {
    const responses: Record<string, unknown> = {
      'https://api.tcgdex.net/v2/fr/sets': [
        { id: 'sm1', name: 'Soleil et Lune' },
        { id: '2018sm-fr', name: 'Exclu FR' },
      ],
      'https://api.tcgdex.net/v2/graphql': { data: { sets: [{ id: 'sm1', releaseDate: '2017-02-03', serie: { id: 'sm' } }, { id: 'en-only', releaseDate: '2020-01-01' }] } },
      'https://api.tcgdex.net/v2/fr/sets/2018sm-fr': { id: '2018sm-fr', name: 'Exclu FR', releaseDate: '2018-06-01', serie: { id: 'sm' }, cards: [] },
    };
    const fetchMock = vi.fn(async (url: string) => ({ ok: true, json: async () => responses[url] }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await tcgdex.listSetReleases!('fr')).toEqual([
      { id: 'sm1', releaseDate: '2017-02-03', serieId: 'sm' },
      { id: '2018sm-fr', releaseDate: '2018-06-01', serieId: 'sm' },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('échoue (sans mettre en cache) si le détail d\'une extension manque, plutôt que de la perdre', async () => {
    const responses: Record<string, unknown> = {
      'https://api.tcgdex.net/v2/fr/sets': [{ id: '2018sm-fr', name: 'Exclu FR' }],
      'https://api.tcgdex.net/v2/graphql': { data: { sets: [] } },
    };
    vi.stubGlobal('fetch', vi.fn(async (url: string) => (url in responses ? { ok: true, json: async () => responses[url] } : { ok: false, status: 404 })));
    await expect(tcgdex.listSetReleases!('fr')).rejects.toThrow();
  });
});

describe('rareté minimum', () => {
  // Listes renvoyées par TCGdex le 2026-11-04 (/fr/rarities et /en/rarities).
  const FR = ['Chromatique ultra rare', 'Collection Classique', 'Commune', 'Couronne', 'Deux Chromatiques', 'Deux Diamants', 'Deux Étoiles', 'Double rare', 'Dresseur Full Art', 'Futuristic Rare', 'HIGH-TECH rare', 'Holo Rare', 'Holo Rare V', 'Holo Rare VMAX', 'Holo Rare VSTAR', 'Hyper rare', 'Illustration rare', 'Illustration spéciale rare', 'LÉGENDE', 'Magnifique', 'Magnifique rare', 'Mega Attack Rare', 'Méga Hyper Rare', 'Peu Commune', 'Pikachu Rare', 'Promo', 'Quatre Diamants', 'RGB Rare', 'Radieux Rare', 'Rare', 'Rare Holo', 'Rare Holo LV.X', 'Rare Noir Blanc', 'Rare Prime', 'Sans Rareté', 'Shiny rare', 'Shiny rare V', 'Shiny rare VMAX', 'Trois Diamants', 'Trois Étoiles', 'Ultra Rare', 'Un Chromatique', 'Un Diamant', 'Une Étoile'];
  const EN = ['ACE SPEC Rare', 'Amazing Rare', 'Black White Rare', 'Classic Collection', 'Common', 'Crown', 'Double rare', 'Four Diamond', 'Full Art Trainer', 'Futuristic Rare', 'Holo Rare', 'Holo Rare V', 'Holo Rare VMAX', 'Holo Rare VSTAR', 'Hyper rare', 'Illustration rare', 'LEGEND', 'Mega Attack Rare', 'Mega Hyper Rare', 'None', 'One Diamond', 'One Shiny', 'One Star', 'Pikachu Rare', 'Promo', 'RGB Rare', 'Radiant Rare', 'Rare', 'Rare Holo', 'Rare Holo LV.X', 'Rare PRIME', 'Secret Rare', 'Shiny Ultra Rare', 'Shiny rare', 'Shiny rare V', 'Shiny rare VMAX', 'Special illustration rare', 'Three Diamond', 'Three Star', 'Two Diamond', 'Two Shiny', 'Two Star', 'Ultra Rare', 'Uncommon'];

  it('range chaque rareté connue, sauf promo et « sans rareté »', () => {
    const unclassified = [...FR, ...EN].filter((r) => rarityLevel(r) === undefined && !UNRANKED_RARITIES.includes(r));
    expect(unclassified).toEqual([]);
  });

  it('garde la rareté choisie et les plus rares', () => {
    expect(raritiesAtLeast(6, EN)).toEqual(
      expect.arrayContaining(['Crown', 'Hyper rare', 'Mega Hyper Rare', 'Secret Rare', 'Shiny Ultra Rare', 'Special illustration rare', 'Three Star']),
    );
    expect(raritiesAtLeast(6, EN)).toHaveLength(7);
    const atLeastRare = raritiesAtLeast(3, FR);
    expect(atLeastRare).toContain('Rare');
    expect(atLeastRare).toContain('Magnifique rare');
    expect(atLeastRare).not.toContain('Peu Commune');
    expect(atLeastRare).not.toContain('Promo');
    expect(raritiesAtLeast(2, ['Inconnue'])).toEqual([]);
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
