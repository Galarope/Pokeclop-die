import type { CardBrief, CardDetail } from '../domain/types';
import { rarityLevel } from '../sources/tcgdexRarities';

export type LocalCardSort = 'year' | 'number' | 'rarity';

export function sortCards(cards: CardBrief[], sort: LocalCardSort, dates: ReadonlyMap<string, string>, details: ReadonlyMap<string, CardDetail> = new Map()): CardBrief[] {
  const missingLast = (a: number | undefined, b: number | undefined) =>
    a === undefined ? (b === undefined ? 0 : 1) : b === undefined ? -1 : a - b;
  return [...cards].sort((a, b) => {
    let order = 0;
    if (sort === 'year') {
      const aYear = dates.get(a.setId)?.slice(0, 4);
      const bYear = dates.get(b.setId)?.slice(0, 4);
      order = missingLast(aYear ? Number(aYear) : undefined, bYear ? Number(bYear) : undefined);
    } else if (sort === 'rarity') {
      const ar = details.get(a.uid)?.rarity;
      const br = details.get(b.uid)?.rarity;
      order = missingLast(ar ? rarityLevel(ar) : undefined, br ? rarityLevel(br) : undefined);
    } else {
      order = a.localId.localeCompare(b.localId, 'fr', { numeric: true, sensitivity: 'base' });
    }
    return order || a.setId.localeCompare(b.setId) || a.localId.localeCompare(b.localId, 'fr', { numeric: true }) || a.uid.localeCompare(b.uid);
  });
}
