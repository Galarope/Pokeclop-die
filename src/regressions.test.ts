import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearCache } from './lib/cache';
import { applyPatch, shouldReplaceHistory } from './hooks/useUrlState';
import { resolveTeamName } from './lib/savedTeams';
import { clampTop } from './components/MusteboueeSwarm';
import { buildCardsUrl, tcgdex } from './sources/tcgdex';
import type { CardBrief } from './domain/types';

describe('useUrlState', () => {
  it('ajoute une entrée d\'historique quand le popup (p) s\'ouvre, change ou se ferme', () => {
    expect(shouldReplaceHistory({ p: '25' })).toBe(false);
    expect(shouldReplaceHistory({ p: '' })).toBe(false);
  });

  it('remplace l\'entrée courante pour les filtres', () => {
    expect(shouldReplaceHistory({ q: 'pika' })).toBe(true);
    expect(shouldReplaceHistory({ gen: '1', type: 'fire' })).toBe(true);
  });

  it('applique le patch : valeur vide = paramètre retiré, page remise à zéro', () => {
    const next = applyPatch(new URLSearchParams('q=a&p=3&page=4'), { p: '' }, false);
    expect(next.toString()).toBe('q=a&page=4');
    expect(applyPatch(new URLSearchParams('page=4'), { q: 'x' }).has('page')).toBe(false);
  });
});

describe('noms d\'équipe', () => {
  it('un nom vide ou blanc garde l\'ancien, sinon le nom est nettoyé', () => {
    expect(resolveTeamName('   ', 'Mon équipe')).toBe('Mon équipe');
    expect(resolveTeamName('', 'Mon équipe')).toBe('Mon équipe');
    expect(resolveTeamName('  Nouvelle  ', 'Mon équipe')).toBe('Nouvelle');
  });
});

describe('mustébouées', () => {
  it('reste dans la page quand elle est plus courte que la position stockée', () => {
    expect(clampTop(3000, 100, 800)).toBe(700);
    expect(clampTop(300, 100, 800)).toBe(300);
    expect(clampTop(10, 100, 50)).toBe(0);
  });
});

describe('filtre par bloc', () => {
  it('compare les codes d\'extension exactement (le bloc Base ne doit pas attraper bwp via wp)', () => {
    const url = decodeURIComponent(buildCardsUrl({ lang: 'fr', setIds: ['base1', 'wp'] }));
    expect(url).toContain('set.id=eq:base1|wp');
  });
});

describe('tcgdex.resolveImage', () => {
  const card = { lang: 'fr', id: 'mep-1', setId: 'mep', localId: '1' } as CardBrief;

  beforeEach(() => {
    clearCache();
    vi.stubGlobal('Image', class { onload?: () => void; set src(_: string) { queueMicrotask(() => this.onload?.()); } });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('réutilise le set en cache au lieu de le re-télécharger', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ id: 'mep', name: 'Promos', serie: { id: 'mep-serie' }, cards: [] }) }));
    vi.stubGlobal('fetch', fetchMock);
    await tcgdex.getSet('fr', 'mep');
    expect(await tcgdex.resolveImage!(card)).toBe('https://assets.tcgdex.net/fr/mep-serie/mep/1');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
