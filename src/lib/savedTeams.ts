import { useCallback, useEffect, useState } from 'react';

export interface SavedTeam {
  id: string;
  name: string;
  createdAt: string;
  /** numéros nationaux du Pokédex */
  members: number[];
}

const KEY = 'pokeclopedie:teams';
const FORMAT = 'pokeclopedie-teams';

function load(): SavedTeam[] {
  try {
    return sanitize(JSON.parse(localStorage.getItem(KEY) ?? '[]'));
  } catch {
    return [];
  }
}

/** Ne garde que les équipes bien formées (le fichier importé n'est jamais fiable). */
function sanitize(raw: unknown): SavedTeam[] {
  if (!Array.isArray(raw)) return [];
  const out: SavedTeam[] = [];
  for (const t of raw) {
    if (!t || typeof t !== 'object') continue;
    const { id, name, createdAt, members } = t as Record<string, unknown>;
    if (!Array.isArray(members)) continue;
    const ids = members.filter((m): m is number => Number.isInteger(m) && (m as number) > 0 && (m as number) < 100000).slice(0, 6);
    if (!ids.length) continue;
    out.push({
      id: typeof id === 'string' && id ? id : crypto.randomUUID(),
      name: (typeof name === 'string' && name.trim() ? name.trim() : 'Équipe importée').slice(0, 80),
      createdAt: typeof createdAt === 'string' ? createdAt : new Date().toISOString(),
      members: ids,
    });
  }
  return out;
}

export function useSavedTeams() {
  const [teams, setTeams] = useState<SavedTeam[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(teams));
    } catch {
      /* stockage plein ou indisponible : les équipes restent en mémoire pour la session */
    }
  }, [teams]);

  const save = useCallback((name: string, members: number[]) => {
    setTeams((l) => [...l, { id: crypto.randomUUID(), name: name.trim() || `Équipe ${l.length + 1}`, createdAt: new Date().toISOString(), members }]);
  }, []);
  const remove = useCallback((id: string) => setTeams((l) => l.filter((t) => t.id !== id)), []);
  const rename = useCallback((id: string, name: string) => setTeams((l) => l.map((t) => (t.id === id ? { ...t, name: name.trim() || t.name } : t))), []);

  const exportJson = useCallback(() => JSON.stringify({ format: FORMAT, version: 1, teams }, null, 2), [teams]);

  /** Fusionne le fichier avec les équipes existantes ; renvoie le nombre d'équipes ajoutées. */
  const importJson = useCallback(
    (text: string): number => {
      const data = JSON.parse(text) as { format?: string; teams?: unknown };
      if (data?.format !== FORMAT) throw new Error('Ce fichier n’est pas un export de Pokéclopédie.');
      const incoming = sanitize(data.teams);
      const existing = new Set(teams.map((t) => t.id));
      const fresh = incoming.filter((t) => !existing.has(t.id));
      setTeams((l) => [...l, ...fresh.filter((t) => !l.some((x) => x.id === t.id))]);
      return fresh.length;
    },
    [teams],
  );

  return { teams, save, remove, rename, exportJson, importJson };
}
