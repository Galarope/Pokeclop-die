import type { CaughtPokemon } from '../components/MusteboueeSwarm';
import type { SavedTeam } from './savedTeams';

const FORMAT = 'pokeclopedie-backup';
const DEX_KEY = 'pokeclopedie:v2:caught-dex';
const CAUGHT_KEY = 'pokeclopedie:v2:caught';
const ENCOUNTERS_KEY = 'pokeclopedie:v2:encounters';

interface Backup {
  format: typeof FORMAT;
  version: 1;
  teams: SavedTeam[];
  catches: CaughtPokemon[];
  caught: number;
  encounters: number;
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

export function parseBackup(text: string): Backup {
  const data: unknown = JSON.parse(text);
  if (!data || typeof data !== 'object') throw new Error('Fichier de sauvegarde invalide.');
  const raw = data as Record<string, unknown>;
  if (raw.format !== FORMAT || raw.version !== 1 || !Array.isArray(raw.teams) || !Array.isArray(raw.catches) || !isCount(raw.caught) || !isCount(raw.encounters)) {
    throw new Error('Format ou version de sauvegarde invalide.');
  }
  const teamIds = new Set<string>();
  const teams: SavedTeam[] = raw.teams.map((item: unknown) => {
    if (!item || typeof item !== 'object') throw new Error('Équipe invalide dans la sauvegarde.');
    const t = item as Record<string, unknown>;
    if (typeof t.id !== 'string' || !t.id || teamIds.has(t.id) || typeof t.name !== 'string' || !t.name.trim() || t.name.length > 80 ||
        typeof t.createdAt !== 'string' || !Number.isFinite(Date.parse(t.createdAt)) || !Array.isArray(t.members) || !t.members.length ||
        t.members.length > 6 || !t.members.every((id: unknown) => isCount(id) && id > 0 && id < 100000)) {
      throw new Error('Équipe invalide dans la sauvegarde.');
    }
    teamIds.add(t.id);
    return { id: t.id, name: t.name, createdAt: t.createdAt, members: t.members };
  });
  const ids = new Set<number>();
  const catches: CaughtPokemon[] = raw.catches.map((item: unknown) => {
    if (!item || typeof item !== 'object') throw new Error('Capture invalide dans la sauvegarde.');
    const c = item as Record<string, unknown>;
    if (!isCount(c.id) || c.id === 0 || ids.has(c.id) || !isCount(c.count) || c.count === 0 || !isCount(c.shinyCount) ||
        c.shinyCount > c.count || typeof c.firstCaughtAt !== 'string' || !Number.isFinite(Date.parse(c.firstCaughtAt)) ||
        typeof c.lastCaughtAt !== 'string' || !Number.isFinite(Date.parse(c.lastCaughtAt)) || c.firstCaughtAt > c.lastCaughtAt) {
      throw new Error('Capture invalide dans la sauvegarde.');
    }
    ids.add(c.id);
    return { id: c.id, count: c.count, shinyCount: c.shinyCount, firstCaughtAt: c.firstCaughtAt, lastCaughtAt: c.lastCaughtAt };
  });
  if (raw.caught < catches.reduce((sum, c) => sum + c.count, 0)) throw new Error('Total de captures invalide dans la sauvegarde.');
  return { format: FORMAT, version: 1, teams, catches, caught: raw.caught, encounters: raw.encounters };
}

export function mergeCatches(existing: CaughtPokemon[], incoming: CaughtPokemon[]): CaughtPokemon[] {
  const result = new Map(existing.map((c) => [c.id, c]));
  for (const c of incoming) {
    const old = result.get(c.id);
    result.set(c.id, old ? {
      id: c.id, count: Math.max(old.count, c.count), shinyCount: Math.max(old.shinyCount, c.shinyCount),
      firstCaughtAt: old.firstCaughtAt < c.firstCaughtAt ? old.firstCaughtAt : c.firstCaughtAt,
      lastCaughtAt: old.lastCaughtAt > c.lastCaughtAt ? old.lastCaughtAt : c.lastCaughtAt,
    } : c);
  }
  return [...result.values()];
}

export function exportBackup(teams: SavedTeam[]): string {
  const catches: unknown = JSON.parse(localStorage.getItem(DEX_KEY) ?? '[]');
  const caught = Number(localStorage.getItem(CAUGHT_KEY) ?? '0');
  const encounters = Number(localStorage.getItem(ENCOUNTERS_KEY) ?? '0');
  const text = JSON.stringify({ format: FORMAT, version: 1, teams, catches, caught, encounters }, null, 2);
  parseBackup(text);
  return text;
}

export function importBackup(backup: Backup, teams: SavedTeam[]): { teams: number } {
  const existing = parseBackup(exportBackup([]));
  const catches = mergeCatches(existing.catches, backup.catches);
  const caught = Math.max(existing.caught, backup.caught, catches.reduce((sum, c) => sum + c.count, 0));
  const teamIds = new Set(teams.map((team) => team.id));
  const added = backup.teams.filter((team) => !teamIds.has(team.id));
  const updates: [string, string][] = [
    ['pokeclopedie:teams', JSON.stringify([...teams, ...added])],
    [DEX_KEY, JSON.stringify(catches)],
    [CAUGHT_KEY, String(caught)],
    [ENCOUNTERS_KEY, String(Math.max(existing.encounters, backup.encounters, caught))],
  ];
  const previous = updates.map(([key]) => [key, localStorage.getItem(key)] as const);
  try {
    for (const [key, value] of updates) localStorage.setItem(key, value);
  } catch (error) {
    for (const [key, value] of previous) {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    }
    throw error;
  }
  window.dispatchEvent(new Event('storage'));
  return { teams: added.length };
}
