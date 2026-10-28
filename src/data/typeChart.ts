export const TYPES = [
  'normal', 'fire', 'water', 'grass', 'electric', 'ice', 'fighting', 'poison', 'ground',
  'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
] as const;
export type TypeSlug = (typeof TYPES)[number];

export const TYPE_FR: Record<TypeSlug, string> = {
  normal: 'Normal', fire: 'Feu', water: 'Eau', grass: 'Plante', electric: 'Électrik', ice: 'Glace',
  fighting: 'Combat', poison: 'Poison', ground: 'Sol', flying: 'Vol', psychic: 'Psy', bug: 'Insecte',
  rock: 'Roche', ghost: 'Spectre', dragon: 'Dragon', dark: 'Ténèbres', steel: 'Acier', fairy: 'Fée',
};

type Row = { x2?: TypeSlug[]; half?: TypeSlug[]; zero?: TypeSlug[] };

/** Attaquant → défenseurs (génération 6+). Tout le reste vaut ×1. */
const ROWS: Record<TypeSlug, Row> = {
  normal: { half: ['rock', 'steel'], zero: ['ghost'] },
  fire: { x2: ['grass', 'ice', 'bug', 'steel'], half: ['fire', 'water', 'rock', 'dragon'] },
  water: { x2: ['fire', 'ground', 'rock'], half: ['water', 'grass', 'dragon'] },
  grass: { x2: ['water', 'ground', 'rock'], half: ['fire', 'grass', 'poison', 'flying', 'bug', 'dragon', 'steel'] },
  electric: { x2: ['water', 'flying'], half: ['grass', 'electric', 'dragon'], zero: ['ground'] },
  ice: { x2: ['grass', 'ground', 'flying', 'dragon'], half: ['fire', 'water', 'ice', 'steel'] },
  fighting: { x2: ['normal', 'ice', 'rock', 'dark', 'steel'], half: ['poison', 'flying', 'psychic', 'bug', 'fairy'], zero: ['ghost'] },
  poison: { x2: ['grass', 'fairy'], half: ['poison', 'ground', 'rock', 'ghost'], zero: ['steel'] },
  ground: { x2: ['fire', 'electric', 'poison', 'rock', 'steel'], half: ['grass', 'bug'], zero: ['flying'] },
  flying: { x2: ['grass', 'fighting', 'bug'], half: ['electric', 'rock', 'steel'] },
  psychic: { x2: ['fighting', 'poison'], half: ['psychic', 'steel'], zero: ['dark'] },
  bug: { x2: ['grass', 'psychic', 'dark'], half: ['fire', 'fighting', 'poison', 'flying', 'ghost', 'steel', 'fairy'] },
  rock: { x2: ['fire', 'ice', 'flying', 'bug'], half: ['fighting', 'ground', 'steel'] },
  ghost: { x2: ['psychic', 'ghost'], half: ['dark'], zero: ['normal'] },
  dragon: { x2: ['dragon'], half: ['steel'], zero: ['fairy'] },
  dark: { x2: ['psychic', 'ghost'], half: ['fighting', 'dark', 'fairy'] },
  steel: { x2: ['ice', 'rock', 'fairy'], half: ['fire', 'water', 'electric', 'steel'] },
  fairy: { x2: ['fighting', 'dragon', 'dark'], half: ['fire', 'poison', 'steel'] },
};

export function effectiveness(attacker: TypeSlug, defender: TypeSlug): 0 | 0.5 | 1 | 2 {
  const r = ROWS[attacker];
  if (r.zero?.includes(defender)) return 0;
  if (r.x2?.includes(defender)) return 2;
  if (r.half?.includes(defender)) return 0.5;
  return 1;
}

/** Multiplicateur d'une attaque contre un Pokémon à un ou deux types. */
export const multiplier = (attacker: TypeSlug, defenders: string[]) =>
  defenders.reduce((m, d) => m * (TYPES.includes(d as TypeSlug) ? effectiveness(attacker, d as TypeSlug) : 1), 1);
