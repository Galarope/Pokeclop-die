import { useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';

/** Paramètres qui ouvrent une surcouche (popup) : chaque changement crée une entrée d'historique pour que « Retour » la ferme. */
const HISTORY_KEYS: readonly string[] = ['p'];

/** Les filtres remplacent l'entrée courante (pas de pile d'historique à chaque frappe) ; le popup en ajoute une. */
export function shouldReplaceHistory(patch: object): boolean {
  return !Object.keys(patch).some((k) => HISTORY_KEYS.includes(k));
}

export function applyPatch(
  prev: URLSearchParams,
  patch: Record<string, string | number | undefined | null>,
  resetPage = true,
): URLSearchParams {
  const next = new URLSearchParams(prev);
  for (const [k, v] of Object.entries(patch)) {
    if (v === '' || v === undefined || v === null) next.delete(k);
    else next.set(k, String(v));
  }
  if (resetPage && !('page' in patch)) next.delete('page');
  return next;
}

/** État de filtres stocké dans l'URL (partageable, retour navigateur fonctionnel). */
export function useUrlState<K extends string>(keys: readonly K[]) {
  const [params, setParams] = useSearchParams();
  const values = Object.fromEntries(keys.map((k) => [k, params.get(k) ?? ''])) as Record<K, string>;
  const page = Math.max(1, Number(params.get('page')) || 1);

  const set = useCallback(
    (patch: Partial<Record<K | 'page', string | number>>, resetPage = true) => {
      setParams((prev) => applyPatch(prev, patch, resetPage), { replace: shouldReplaceHistory(patch) });
    },
    [setParams],
  );

  return { values, page, set };
}
