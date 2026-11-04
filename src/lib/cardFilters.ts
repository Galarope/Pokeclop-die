import type { SetRelease } from '../domain/types';

/** Valeur qu'aucune carte n'a : une liste d'extensions ou de raretés vide doit donner zéro résultat, pas tout. */
export const NO_MATCH = '-';

/** `AAAA-MM-JJ` → `JJ/MM/AAAA`, sans passer par `Date` (évite le décalage d'un jour selon le fuseau). */
export function formatShortDate(iso?: string): string | undefined {
  const m = iso?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

/** Années de sortie de la première et de la dernière extension d'un bloc. */
export function serieYears(serieId: string, releases: readonly SetRelease[]): { from: number; to: number } | undefined {
  const years = releases.filter((r) => r.serieId === serieId).map((r) => Number(r.releaseDate.slice(0, 4)));
  return years.length ? { from: Math.min(...years), to: Math.max(...years) } : undefined;
}

export function serieLabel(name: string, years?: { from: number; to: number }): string {
  if (!years) return name;
  return years.from === years.to ? `${name} (${years.from})` : `${name} (${years.from}–${years.to})`;
}

/** Extensions sorties le jour `from` (ISO) ou après. */
export const setIdsReleasedSince = (from: string, releases: readonly SetRelease[]): string[] =>
  releases.filter((r) => r.releaseDate.slice(0, 10) >= from).map((r) => r.id);

/**
 * Combine l'extension choisie et les listes d'extensions permises (bloc, date…), chacune optionnelle.
 * Une extension choisie hors des listes, ou des listes sans extension commune, ne donnent aucun résultat.
 */
export function resolveSetFilter(setId: string, ...allowed: (readonly string[] | undefined)[]): { setId?: string; setIds?: string[] } {
  const lists = allowed.filter((l): l is readonly string[] => l !== undefined);
  const ids = lists.length ? lists.reduce<string[]>((acc, l) => acc.filter((id) => l.includes(id)), [...lists[0]]) : undefined;
  if (setId) return ids && !ids.includes(setId) ? { setIds: [NO_MATCH] } : { setId };
  if (ids) return { setIds: ids.length ? ids : [NO_MATCH] };
  return {};
}

/** Types exclus, stockés dans l'URL séparés par des virgules. */
export const parseTypeList = (s: string): string[] => (s ? s.split(',').filter(Boolean) : []);
