export type LangCode = string;

export const STAT_KEYS = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'] as const;
export type StatKey = (typeof STAT_KEYS)[number];

export interface PokemonType {
  slug: string;
  labelFr?: string;
}

/** Données de liste du Pokédex (une ligne par espèce). */
export interface PokemonSummary {
  id: number;
  slug: string;
  nameFr?: string;
  nameEn?: string;
  generation: number;
  types: PokemonType[];
  /** décimètres, tel que fourni par PokéAPI */
  height?: number;
  /** hectogrammes, tel que fourni par PokéAPI */
  weight?: number;
  stats: Partial<Record<StatKey, number>>;
  imageUrl: string;
}

export interface PokemonForm {
  slug: string;
  isDefault: boolean;
  types: PokemonType[];
  height?: number;
  weight?: number;
  stats: Partial<Record<StatKey, number>>;
  imageUrl?: string;
  shinyImageUrl?: string;
}

export interface EvolutionNode {
  speciesId: number;
  slug: string;
  /** conditions d'évolution connues (niveau, objet…), vide si non fournies */
  conditions: string[];
  children: EvolutionNode[];
}

export interface PokemonDetail extends PokemonSummary {
  genusFr?: string;
  genusEn?: string;
  flavorFr?: string;
  flavorEn?: string;
  forms: PokemonForm[];
  evolution?: EvolutionNode;
}

// ---- Cartes (indépendant de la source) ----

export interface CardBrief {
  /** identifiant global unique : `${source}:${lang}:${id}` */
  uid: string;
  source: string;
  lang: LangCode;
  id: string;
  localId: string;
  name: string;
  image?: string;
  setId: string;
}

export interface CardDetail extends CardBrief {
  rarity?: string;
  illustrator?: string;
  category?: string;
  hp?: number;
  types?: string[];
  dexIds?: number[];
  setName?: string;
  setTotal?: number;
  setOfficial?: number;
  releaseDate?: string;
  description?: string;
}

export interface CardSet {
  source: string;
  lang: LangCode;
  id: string;
  name: string;
  logo?: string;
  symbol?: string;
  cardCountOfficial?: number;
  cardCountTotal?: number;
  releaseDate?: string;
  serieName?: string;
}

export interface CardSerie {
  id: string;
  name: string;
}

export interface CardSetDetail extends CardSet {
  cards: CardBrief[];
}

export interface CardQuery {
  lang: LangCode;
  name?: string;
  dexId?: number;
  /** plage de numéros de Pokédex (bornes incluses) ; une seule borne = même valeur */
  dexMin?: number;
  dexMax?: number;
  setId?: string;
  /** plusieurs extensions (ex. un bloc entier) ; ignoré si setId est fourni */
  setIds?: string[];
  rarity?: string;
  type?: string;
  stage?: string;
  hpMin?: number;
  hpMax?: number;
  illustrator?: string;
  /** tri côté serveur */
  sort?: 'illustrator';
  /** pagination côté serveur ; omise = tout récupérer */
  page?: number;
  pageSize?: number;
}

export interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  hasNext: boolean;
}
