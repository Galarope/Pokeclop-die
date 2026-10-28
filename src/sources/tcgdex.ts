import { cached, TTL } from '../lib/cache';
import { fetchJson } from '../lib/http';
import type { CardBrief, CardDetail, CardQuery, CardSet, CardSetDetail, LangCode, Paged } from '../domain/types';
import type { CardSource } from './types';

const BASE = 'https://api.tcgdex.net/v2';
const SOURCE_ID = 'tcgdex';

// Le site se limite volontairement au français et à l'anglais.
export const TCGDEX_LANGUAGES = ['fr', 'en'] as const;

interface RawBrief {
  id: string;
  localId: string;
  name: string;
  image?: string;
}

interface RawSetBrief {
  id: string;
  name: string;
  logo?: string;
  symbol?: string;
  cardCount?: { total?: number; official?: number };
}

interface RawSet extends RawSetBrief {
  releaseDate?: string;
  serie?: { id?: string; name?: string };
  cards?: RawBrief[];
}

interface RawCard extends RawBrief {
  category?: string;
  illustrator?: string;
  rarity?: string;
  hp?: number;
  types?: string[];
  dexId?: number[];
  description?: string;
  set?: { id: string; name?: string; cardCount?: { total?: number; official?: number } };
}

/** L'id d'une carte est `${setId}-${localId}` ; l'id d'extension peut contenir des tirets. */
export function setIdOf(card: Pick<RawBrief, 'id' | 'localId'>): string {
  const suffix = `-${card.localId}`;
  return card.id.endsWith(suffix) ? card.id.slice(0, -suffix.length) : card.id;
}

/** TCGdex renvoie une URL d'asset sans extension ; on demande le format léger. */
export const imageUrl = (base: string | undefined, quality: 'low' | 'high' = 'low') =>
  base ? `${base}/${quality}.webp` : undefined;

const toBrief = (lang: LangCode) => (c: RawBrief): CardBrief => ({
  uid: `${SOURCE_ID}:${lang}:${c.id}`,
  source: SOURCE_ID,
  lang,
  id: c.id,
  localId: c.localId,
  name: c.name,
  image: c.image,
  setId: setIdOf(c),
});

const toSetBase = (lang: LangCode, s: RawSetBrief): CardSet => ({
  source: SOURCE_ID,
  lang,
  id: s.id,
  name: s.name,
  logo: s.logo ? `${s.logo}.webp` : undefined,
  symbol: s.symbol ? `${s.symbol}.webp` : undefined,
  cardCountOfficial: s.cardCount?.official,
  cardCountTotal: s.cardCount?.total,
});

export function buildCardsUrl(q: CardQuery): string {
  const p = new URLSearchParams();
  if (q.name) p.set('name', q.name);
  if (q.dexId !== undefined) p.set('dexId', `eq:${q.dexId}`);
  if (q.setId) p.set('set.id', `eq:${q.setId}`);
  if (q.rarity) p.set('rarity', `eq:${q.rarity}`);
  if (q.type) p.set('types', `eq:${q.type}`);
  if (q.stage) p.set('stage', `eq:${q.stage}`);
  if (q.hpMin !== undefined) p.append('hp', `gte:${q.hpMin}`);
  if (q.hpMax !== undefined) p.append('hp', `lte:${q.hpMax}`);
  if (q.illustrator) p.set('illustrator', q.illustrator);
  if (q.sort) {
    p.set('sort:field', q.sort);
    p.set('sort:order', 'ASC');
  }
  if (q.page !== undefined) {
    p.set('pagination:page', String(q.page));
    p.set('pagination:itemsPerPage', String(q.pageSize ?? 24));
  }
  const qs = p.toString();
  return `${BASE}/${q.lang}/cards${qs ? `?${qs}` : ''}`;
}

export const tcgdex: CardSource = {
  id: SOURCE_ID,
  label: 'TCGdex',
  homepage: 'https://tcgdex.dev',
  languages: TCGDEX_LANGUAGES,

  async searchCards(q) {
    const url = buildCardsUrl(q);
    // Pas de AbortSignal ici : la requête est partagée/dédupliquée par le cache ; useAsync ignore les réponses obsolètes.
    const raw = await cached(`tcgdex:search:${url}`, () => fetchJson<RawBrief[]>(url), {
      ttl: TTL.short,
      persistent: !q.page,
    });
    const items = raw.map(toBrief(q.lang));
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? items.length;
    let hasNext = false;
    if (q.page !== undefined && items.length === pageSize) {
      // TCGdex ne renvoie pas de total : on sonde la page suivante.
      const nextUrl = buildCardsUrl({ ...q, page: page + 1 });
      const next = await cached(`tcgdex:search:${nextUrl}`, () => fetchJson<RawBrief[]>(nextUrl), {
        ttl: TTL.short,
        persistent: false,
      });
      hasNext = next.length > 0;
    }
    return { items, page, pageSize, hasNext } satisfies Paged<CardBrief>;
  },

  getCard(lang, id) {
    return cached(
      `tcgdex:card:${lang}:${id}`,
      async (): Promise<CardDetail> => {
        const c = await fetchJson<RawCard>(`${BASE}/${lang}/cards/${encodeURIComponent(id)}`);
        return {
          ...toBrief(lang)(c),
          rarity: c.rarity && c.rarity !== 'None' ? c.rarity : undefined,
          illustrator: c.illustrator,
          category: c.category,
          hp: c.hp,
          types: c.types,
          dexIds: c.dexId,
          description: c.description,
          setName: c.set?.name,
          setTotal: c.set?.cardCount?.total,
          setOfficial: c.set?.cardCount?.official,
        };
      },
      { ttl: TTL.week },
    );
  },

  listSets(lang) {
    return cached(
      `tcgdex:sets:${lang}`,
      async () => (await fetchJson<RawSetBrief[]>(`${BASE}/${lang}/sets`)).map((s) => toSetBase(lang, s)),
      { ttl: TTL.day },
    );
  },

  getSet(lang, id) {
    return cached(
      `tcgdex:set:${lang}:${id}`,
      async (): Promise<CardSetDetail> => {
        const s = await fetchJson<RawSet>(`${BASE}/${lang}/sets/${encodeURIComponent(id)}`);
        return {
          ...toSetBase(lang, s),
          releaseDate: s.releaseDate,
          serieName: s.serie?.name,
          cards: (s.cards ?? []).map(toBrief(lang)),
        };
      },
      { ttl: TTL.day },
    );
  },

  listRarities(lang) {
    return cached(`tcgdex:rarities:${lang}`, () => fetchJson<string[]>(`${BASE}/${lang}/rarities`), { ttl: TTL.week });
  },

  listTypes(lang) {
    return cached(`tcgdex:types:${lang}`, () => fetchJson<string[]>(`${BASE}/${lang}/types`), { ttl: TTL.week });
  },

  listStages(lang) {
    return cached(`tcgdex:stages:${lang}`, () => fetchJson<string[]>(`${BASE}/${lang}/stages`), { ttl: TTL.week });
  },

  /**
   * Certaines cartes (ex. promos MEP) n'ont pas de champ `image` alors que l'asset existe
   * à l'adresse `assets.tcgdex.net/{langue}/{série}/{extension}/{numéro}`. On ne le renvoie que s'il répond réellement.
   */
  resolveImage(card) {
    return cached(
      `tcgdex:img:v3:${card.lang}:${card.id}`,
      async (): Promise<string | null> => {
        const set = await fetchJson<RawSet>(`${BASE}/${card.lang}/sets/${encodeURIComponent(card.setId)}`);
        if (!set.serie?.id) return null;
        const base = `https://assets.tcgdex.net/${card.lang}/${set.serie.id}/${card.setId}/${card.localId}`;
        // Les assets ont un en-tête CORS invalide : on teste le chargement via un <img>, pas via fetch.
        const load = (src: string) =>
          new Promise<boolean>((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = src;
          });
        const url = `${base}/low.webp`;
        // Un échec isolé peut être transitoire (rafale de requêtes) : une seconde tentative avant de conclure.
        const ok = (await load(url)) || (await new Promise((r) => setTimeout(r, 500)).then(() => load(`${url}?retry=1`)));
        return ok ? base : null;
      },
      { ttl: TTL.short },
    );
  },
};

