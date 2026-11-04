import type { CardSerie, CardBrief, CardDetail, CardQuery, CardSet, CardSetDetail, LangCode, Paged, SetRelease } from '../domain/types';

/**
 * Contrat que toute source de cartes doit respecter.
 * Pour ajouter une source (ex. cartes manquantes) : implémenter cette interface
 * puis l'enregistrer dans `sources/index.ts`. L'UI n'importe jamais une source directement.
 */
export interface CardSource {
  readonly id: string;
  readonly label: string;
  readonly languages: readonly LangCode[];
  readonly homepage?: string;

  /** `signal` : une recherche abandonnée peut cesser de lancer de nouvelles requêtes (son résultat est alors ignoré). */
  searchCards(q: CardQuery, signal?: AbortSignal): Promise<Paged<CardBrief>>;
  getCard(lang: LangCode, id: string): Promise<CardDetail>;
  listSets(lang: LangCode): Promise<CardSet[]>;
  getSet(lang: LangCode, id: string): Promise<CardSetDetail>;
  listRarities(lang: LangCode): Promise<string[]>;
  listTypes(lang: LangCode): Promise<string[]>;
  /** Optionnel : blocs d'extensions (séries) et leurs extensions. */
  listSeries?(lang: LangCode): Promise<CardSerie[]>;
  getSerieSetIds?(lang: LangCode, id: string): Promise<string[]>;
  listStages?(lang: LangCode): Promise<string[]>;
  /** Optionnel : date de sortie et bloc de chaque extension de la langue. */
  listSetReleases?(lang: LangCode): Promise<SetRelease[]>;
  listIllustrators?(lang: LangCode): Promise<string[]>;
  /** Optionnel : retrouve l'image d'une carte dont la liste ne fournit pas d'URL (renvoie null si introuvable). */
  resolveImage?(card: CardBrief): Promise<string | null>;
}

export const LANGUAGE_LABELS: Record<string, string> = {
  fr: 'Français',
  en: 'Anglais',
};

