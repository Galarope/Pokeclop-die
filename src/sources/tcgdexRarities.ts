/** Niveaux de rareté, du plus courant (1) au plus rare (6) : TCGdex ne fournit aucun ordre entre ses raretés. */
export const RARITY_LEVELS = ['Commune', 'Peu commune', 'Rare', 'Rare holo', 'Ultra rare', 'Secrète'] as const;

/**
 * Niveau de chaque rareté TCGdex, en français et en anglais (les deux listes diffèrent).
 * TCG Pocket est rangé sur la même échelle : 1 à 4 diamants = niveaux 1 à 4, étoiles et chromatiques = 5, 3 étoiles et couronne = 6.
 */
const LEVEL_BY_RARITY: Record<string, number> = {
  Commune: 1,
  Common: 1,
  'Peu Commune': 2,
  Uncommon: 2,
  Rare: 3,

  'Holo Rare': 4,
  'Rare Holo': 4,
  'Rare Holo LV.X': 4,
  'Rare Prime': 4,
  'Rare PRIME': 4,
  LÉGENDE: 4,
  LEGEND: 4,
  'Holo Rare V': 4,
  'Holo Rare VMAX': 4,
  'Holo Rare VSTAR': 4,
  'Double rare': 4,
  'Radieux Rare': 4,
  'Radiant Rare': 4,
  // « Magnifique » est la traduction TCGdex d'Amazing Rare ; « Magnifique rare » celle de Secret Rare.
  Magnifique: 4,
  'Amazing Rare': 4,
  'HIGH-TECH rare': 4,
  'ACE SPEC Rare': 4,
  'Collection Classique': 4,
  'Classic Collection': 4,
  'Pikachu Rare': 4,
  'RGB Rare': 4,
  'Futuristic Rare': 4,
  'Mega Attack Rare': 4,

  'Ultra Rare': 5,
  'Illustration rare': 5,
  'Dresseur Full Art': 5,
  'Full Art Trainer': 5,
  'Shiny rare': 5,
  'Shiny rare V': 5,
  'Shiny rare VMAX': 5,
  'Rare Noir Blanc': 5,
  'Black White Rare': 5,

  'Illustration spéciale rare': 6,
  'Special illustration rare': 6,
  'Hyper rare': 6,
  'Magnifique rare': 6,
  'Secret Rare': 6,
  'Méga Hyper Rare': 6,
  'Mega Hyper Rare': 6,
  'Chromatique ultra rare': 6,
  'Shiny Ultra Rare': 6,

  'Un Diamant': 1,
  'One Diamond': 1,
  'Deux Diamants': 2,
  'Two Diamond': 2,
  'Trois Diamants': 3,
  'Three Diamond': 3,
  'Quatre Diamants': 4,
  'Four Diamond': 4,
  'Une Étoile': 5,
  'One Star': 5,
  'Deux Étoiles': 5,
  'Two Star': 5,
  'Un Chromatique': 5,
  'One Shiny': 5,
  'Deux Chromatiques': 5,
  'Two Shiny': 5,
  'Trois Étoiles': 6,
  'Three Star': 6,
  Couronne: 6,
  Crown: 6,
};

/** Raretés connues volontairement sans niveau : exclues des filtres par niveau. */
export const UNRANKED_RARITIES = ['Promo', 'Sans Rareté', 'None'];

export const rarityLevel = (rarity: string): number | undefined => LEVEL_BY_RARITY[rarity];

/** Raretés de la liste dont le niveau atteint `level` (les raretés inconnues sont écartées). */
export const raritiesAtLeast = (level: number, rarities: readonly string[]): string[] =>
  rarities.filter((r) => (rarityLevel(r) ?? 0) >= level);

/** Raretés classées dans la plage demandée, bornes incluses. */
export const raritiesBetween = (min: number, max: number, rarities: readonly string[]): string[] =>
  rarities.filter((r) => {
    const level = rarityLevel(r);
    return level !== undefined && (!min || level >= min) && (!max || level <= max);
  });
