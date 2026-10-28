import type { CardBrief, CardQuery } from '../domain/types';
import { mapLimit } from '../lib/utils';
import { tcgdex } from './tcgdex';
import type { CardSource } from './types';

/**
 * Registre des sources. Pour brancher une source complémentaire (cartes absentes de TCGdex),
 * implémenter `CardSource` et l'ajouter ici : les pages Pokémon l'interrogeront automatiquement
 * et les cartes seront regroupées par extension/langue avec leur `source` d'origine.
 */
export const cardSources: CardSource[] = [tcgdex];

export const getSource = (id: string): CardSource => {
  const s = cardSources.find((x) => x.id === id);
  if (!s) throw new Error(`Source de cartes inconnue : ${id}`);
  return s;
};

export const allLanguages = (): string[] => [...new Set(cardSources.flatMap((s) => [...s.languages]))];

export interface PokemonCardsResult {
  cards: CardBrief[];
  /** erreurs partielles (source/langue) — jamais masquées */
  failures: { source: string; lang: string; message: string }[];
}

/** Toutes les cartes d'un Pokémon (n° Pokédex), toutes sources et langues, dédupliquées par uid. */
export async function getCardsForPokemon(dexId: number): Promise<PokemonCardsResult> {
  const jobs = cardSources.flatMap((s) => s.languages.map((lang) => ({ s, lang })));
  const settled = await mapLimit(jobs, 6, ({ s, lang }) => s.searchCards({ lang, dexId } satisfies CardQuery));
  const byUid = new Map<string, CardBrief>();
  const failures: PokemonCardsResult['failures'] = [];
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled') r.value.items.forEach((c) => byUid.set(c.uid, c));
    else failures.push({ source: jobs[i].s.id, lang: jobs[i].lang, message: String((r.reason as Error)?.message ?? r.reason) });
  });
  return { cards: [...byUid.values()], failures };
}
