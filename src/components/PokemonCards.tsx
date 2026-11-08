import { useEffect, useMemo, useState } from 'react';
import type { CardBrief, CardSet, CardSetDetail } from '../domain/types';
import { getCardsForPokemon } from '../sources';
import { getSource } from '../sources';
import { LANGUAGE_LABELS } from '../sources/types';
import { formatDate, mapLimit } from '../lib/utils';
import { releaseYear } from '../lib/cardFilters';
import { useAsync } from '../hooks/useAsync';
import { CardModal, CardTile } from './Cards';
import { Empty, ErrorBox, Loading } from './Status';

/** Section dépliable qui ne monte son contenu qu'à la première ouverture. */
function Lazy({ summary, children, className }: { summary: React.ReactNode; children: (open: boolean) => React.ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  const [everOpened, setEverOpened] = useState(false);
  return (
    <details
      className={className}
      onToggle={(e) => {
        const o = (e.currentTarget as HTMLDetailsElement).open;
        setOpen(o);
        if (o) setEverOpened(true);
      }}
    >
      <summary>{summary}</summary>
      {everOpened && children(open)}
    </details>
  );
}

function SetGroup({
  set,
  cards,
  onOpenCard,
}: {
  set: CardSet | undefined;
  cards: CardBrief[];
  onOpenCard: (c: CardBrief) => void;
}) {
  return (
    <Lazy
      className="set-group"
      summary={
        <span className="set-summary">
          {set?.logo ? <img src={set.logo} alt="" loading="lazy" className="set-logo-small" /> : null}
          <strong>{set?.name ?? cards[0].setId}</strong>
          <span className="muted small">
            {set?.releaseDate ? formatDate(set.releaseDate) : 'date non fournie'} · {cards.length} carte{cards.length > 1 ? 's' : ''}
          </span>
        </span>
      }
    >
      {() => <SetCards cards={cards} onOpenCard={onOpenCard} year={releaseYear(set?.releaseDate)} />}
    </Lazy>
  );
}

function SetCards({ cards, onOpenCard, year }: { cards: CardBrief[]; onOpenCard: (c: CardBrief) => void; year?: string }) {
  return (
    <ul className="grid cards-grid">
      {cards.map((c) => (
        <CardTile key={c.uid} card={c} onOpen={onOpenCard} year={year} />
      ))}
    </ul>
  );
}

function LanguageSection({
  lang,
  source,
  cards,
  onOpenCard,
}: {
  lang: string;
  source: string;
  cards: CardBrief[];
  onOpenCard: (c: CardBrief) => void;
}) {
  const [open, setOpen] = useState(false);
  const [everOpened, setEverOpened] = useState(false);
  const bySet = useMemo(() => {
    const m = new Map<string, CardBrief[]>();
    cards.forEach((c) => m.set(c.setId, [...(m.get(c.setId) ?? []), c]));
    return m;
  }, [cards]);

  return (
    <details
      className="lang-group"
      onToggle={(e) => {
        const o = (e.currentTarget as HTMLDetailsElement).open;
        setOpen(o);
        if (o) setEverOpened(true);
      }}
    >
      <summary>
        <strong>{LANGUAGE_LABELS[lang] ?? lang}</strong>{' '}
        <span className="muted small">
          {cards.length} carte{cards.length > 1 ? 's' : ''} · {bySet.size} extension{bySet.size > 1 ? 's' : ''}
        </span>
      </summary>
      {everOpened && <LanguageBody lang={lang} source={source} bySet={bySet} active={open} onOpenCard={onOpenCard} />}
    </details>
  );
}

function LanguageBody({
  lang,
  source,
  bySet,
  onOpenCard,
}: {
  lang: string;
  source: string;
  bySet: Map<string, CardBrief[]>;
  active: boolean;
  onOpenCard: (c: CardBrief) => void;
}) {
  const sets = useAsync(() => getSource(source).listSets(lang), [lang, source]);
  const [dates, setDates] = useState<Record<string, CardSetDetail | null>>({});

  useEffect(() => {
    let cancelled = false;
    mapLimit([...bySet.keys()], 6, async (id) => {
      let v: CardSetDetail | null = null;
      try {
        v = await getSource(source).getSet(lang, id);
      } catch {
        v = null;
      }
      if (!cancelled) setDates((d) => ({ ...d, [id]: v }));
    });
    return () => {
      cancelled = true;
    };
  }, [bySet, lang, source]);

  const ordered = useMemo(() => {
    const byId = new Map((sets.data ?? []).map((s) => [s.id, s]));
    return [...bySet.entries()]
      .map(([id, cards]) => {
        const meta = dates[id];
        const base = byId.get(id);
        const set: CardSet | undefined = meta ? { ...base, ...meta } : base;
        return { id, cards, set };
      })
      .sort((a, b) => (b.set?.releaseDate ?? '').localeCompare(a.set?.releaseDate ?? '') || a.id.localeCompare(b.id));
  }, [bySet, sets.data, dates]);

  if (sets.error) return <ErrorBox error={sets.error} onRetry={sets.reload} />;
  return (
    <div className="lang-body">
      {sets.loading && <Loading label="Chargement des extensions…" />}
      {ordered.map((o) => (
        <SetGroup key={o.id} set={o.set} cards={o.cards} onOpenCard={onOpenCard} />
      ))}
    </div>
  );
}

export function PokemonCards({ dexId }: { dexId: number }) {
  const { data, error, loading, reload } = useAsync(() => getCardsForPokemon(dexId), [dexId]);
  const [selected, setSelected] = useState<CardBrief | null>(null);

  const groups = useMemo(() => {
    const m = new Map<string, { lang: string; source: string; cards: CardBrief[] }>();
    (data?.cards ?? []).forEach((c) => {
      const k = `${c.source}:${c.lang}`;
      const g = m.get(k) ?? { lang: c.lang, source: c.source, cards: [] };
      g.cards.push(c);
      m.set(k, g);
    });
    return [...m.values()].sort((a, b) => b.cards.length - a.cards.length);
  }, [data]);

  return (
    <section aria-labelledby="cards-title" className="panel">
      <h2 id="cards-title">Cartes du JCC</h2>
      {loading && <Loading label="Recherche des cartes dans toutes les langues…" />}
      {error && <ErrorBox error={error} onRetry={reload} />}
      {data && (
        <>
          <p className="muted">
            {data.cards.length} carte{data.cards.length > 1 ? 's' : ''} référencée{data.cards.length > 1 ? 's' : ''} dans {groups.length} langue
            {groups.length > 1 ? 's' : ''} (selon les sources interrogées).
          </p>
          {data.failures.length > 0 && (
            <div className="status error" role="alert">
              Données partielles : échec pour {data.failures.map((f) => `${f.source}/${f.lang}`).join(', ')}.{' '}
              <button type="button" className="btn" onClick={reload}>
                Réessayer
              </button>
            </div>
          )}
          {!groups.length && <Empty>Aucune carte connue pour ce Pokémon dans les sources actuelles.</Empty>}
          {groups.map((g) => (
            <LanguageSection key={`${g.source}:${g.lang}`} lang={g.lang} source={g.source} cards={g.cards} onOpenCard={setSelected} />
          ))}
        </>
      )}
      {selected && <CardModal card={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}
