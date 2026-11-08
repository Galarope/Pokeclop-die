import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CardModal, CardTile } from '../components/Cards';
import { SelectField } from '../components/Fields';
import { Empty, ErrorBox, Loading, Val } from '../components/Status';
import type { CardBrief } from '../domain/types';
import { useAsync } from '../hooks/useAsync';
import { useUrlState } from '../hooks/useUrlState';
import { formatDate } from '../lib/utils';
import { releaseYear } from '../lib/cardFilters';
import { tcgdex } from '../sources/tcgdex';
import { LANGUAGE_LABELS } from '../sources/types';

export function SetPage() {
  const { lang = 'fr', id = '' } = useParams();
  const { values, set } = useUrlState(['rarity'] as const);
  const [selected, setSelected] = useState<CardBrief | null>(null);

  const setData = useAsync(() => tcgdex.getSet(lang, id), [lang, id]);
  const rarities = useAsync(() => tcgdex.listRarities(lang), [lang]);
  const filtered = useAsync(
    async () => (values.rarity ? (await tcgdex.searchCards({ lang, setId: id, rarity: values.rarity })).items : null),
    [lang, id, values.rarity],
  );

  const cards = useMemo(() => filtered.data ?? setData.data?.cards ?? [], [filtered.data, setData.data]);
  const slice = cards;

  if (setData.loading && !setData.data) return <Loading />;
  if (setData.error) return <ErrorBox error={setData.error} onRetry={setData.reload} />;
  const s = setData.data!;

  return (
    <>
      <p>
        <Link to="/cards">← Cartes</Link>
      </p>
      <header className="panel set-hero">
        {s.logo ? <img src={s.logo} alt={`Logo ${s.name}`} className="set-logo-large" /> : <span className="no-image">Logo non disponible</span>}
        <div>
          <h1>{s.name}</h1>
          <dl className="facts">
            <dt>Code</dt>
            <dd>{s.id}</dd>
            <dt>Langue</dt>
            <dd>{LANGUAGE_LABELS[lang] ?? lang}</dd>
            <dt>Sortie</dt>
            <dd>
              <Val v={formatDate(s.releaseDate)} />
            </dd>
            <dt>Série</dt>
            <dd>
              <Val v={s.serieName} />
            </dd>
            <dt>Cartes</dt>
            <dd>
              <Val v={s.cardCountTotal} />
              {s.cardCountOfficial !== undefined && s.cardCountOfficial !== s.cardCountTotal ? ` (${s.cardCountOfficial} officielles)` : ''}
            </dd>
          </dl>
        </div>
      </header>

      <form className="filters" onSubmit={(e) => e.preventDefault()} aria-label="Filtres de l'extension">
        <SelectField
          label="Rareté"
          value={values.rarity}
          onChange={(v) => set({ rarity: v })}
          options={(rarities.data ?? []).map((r) => ({ value: r, label: r }))}
          disabled={!rarities.data}
        />
      </form>
      {filtered.loading && values.rarity && <Loading />}
      {filtered.error && <ErrorBox error={filtered.error} onRetry={filtered.reload} />}
      <p className="result-count" role="status">
        <strong>{cards.length}</strong> carte{cards.length > 1 ? 's' : ''}
      </p>
      {slice.length ? (
        <ul className="grid cards-grid">
          {slice.map((c) => (
            <CardTile key={c.uid} card={c} onOpen={setSelected} year={releaseYear(s.releaseDate)} />
          ))}
        </ul>
      ) : (
        !filtered.loading && <Empty>Aucune carte.</Empty>
      )}
      {selected &&  <CardModal card={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
