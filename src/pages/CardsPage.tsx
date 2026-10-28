import { useEffect, useState } from 'react';
import { CardModal, CardTile } from '../components/Cards';
import { SelectField, TextField } from '../components/Fields';
import { Empty, ErrorBox, Loading } from '../components/Status';
import type { CardBrief } from '../domain/types';
import { useAsync } from '../hooks/useAsync';
import { usePokemonList } from '../hooks/usePokemonList';
import { useUrlState } from '../hooks/useUrlState';
import { MAX_DEX_RANGE, tcgdex } from '../sources/tcgdex';
import { LANGUAGE_LABELS } from '../sources/types';
import { cardSources } from '../sources';

const languageOptions = () =>
  [...new Set(cardSources.flatMap((s) => [...s.languages]))].map((l) => ({ value: l, label: LANGUAGE_LABELS[l] ?? l }));

const KEYS = ['lang', 'dex', 'dexMin', 'dexMax', 'serie', 'set', 'rarity', 'type', 'stage', 'hpMin', 'hpMax', 'illustrator', 'sort'] as const;

function useDebounced<T>(value: T, ms = 400): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

const toNumber = (s: string) => (s !== '' && Number.isFinite(Number(s)) ? Number(s) : undefined);

export function CardsPage() {
  const { values, set } = useUrlState(KEYS);
  const lang = values.lang || 'fr';
  const { data: pokemon } = usePokemonList();
  const [selected, setSelected] = useState<CardBrief | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const dexPokemon = pokemon?.find((p) => String(p.id) === values.dex);
  const [pokemonText, setPokemonText] = useState('');
  useEffect(() => {
    if (dexPokemon) setPokemonText(dexPokemon.nameFr ?? dexPokemon.nameEn ?? '');
    else if (!values.dex) setPokemonText('');
  }, [dexPokemon, values.dex]);

  const onPokemonText = (text: string) => {
    setPokemonText(text);
    const t = text.trim().toLowerCase();
    const match = t && pokemon?.find((p) => p.nameFr?.toLowerCase() === t || p.nameEn?.toLowerCase() === t);
    if (match) set({ dex: match.id });
    else if (!text) set({ dex: '' });
  };

  const sets = useAsync(() => tcgdex.listSets(lang), [lang]);
  const rarities = useAsync(() => tcgdex.listRarities(lang), [lang]);
  const types = useAsync(() => tcgdex.listTypes(lang), [lang]);
  const stages = useAsync(() => (tcgdex.listStages ? tcgdex.listStages(lang) : Promise.resolve([])), [lang]);
  const series = useAsync(() => (tcgdex.listSeries ? tcgdex.listSeries(lang) : Promise.resolve([])), [lang]);
  const serieSets = useAsync(
    () => (values.serie && tcgdex.getSerieSetIds ? tcgdex.getSerieSetIds(lang, values.serie) : Promise.resolve(undefined)),
    [lang, values.serie],
  );
  const serieLoading = !!values.serie && serieSets.data === undefined && !serieSets.error;

  // Les champs texte/numériques sont retardés pour ne pas lancer une requête à chaque frappe.
  const illustrator = useDebounced(values.illustrator.trim());
  const hpMin = useDebounced(values.hpMin);
  const hpMax = useDebounced(values.hpMax);
  const dexMin = useDebounced(values.dexMin);
  const dexMax = useDebounced(values.dexMax);
  const hasDexRange = !values.dex && !!(dexMin || dexMax);
  const hasFilter = !!(values.dex || hasDexRange || values.serie || values.set || values.rarity || values.type || values.stage || illustrator || hpMin || hpMax);
  const result = useAsync(
    () =>
      hasFilter && !serieLoading
        ? tcgdex.searchCards({
            lang,
            dexId: values.dex ? Number(values.dex) : undefined,
            dexMin: hasDexRange ? toNumber(dexMin) : undefined,
            dexMax: hasDexRange ? toNumber(dexMax) : undefined,
            setId: values.set || undefined,
            setIds: values.serie ? (serieSets.data?.length ? serieSets.data : ['-']) : undefined,
            rarity: values.rarity || undefined,
            type: values.type || undefined,
            stage: values.stage || undefined,
            hpMin: toNumber(hpMin),
            hpMax: toNumber(hpMax),
            illustrator: illustrator || undefined,
            sort: values.sort === 'illustrator' ? 'illustrator' : undefined,
          })
        : Promise.resolve(undefined),
    [lang, hasFilter, serieLoading, serieSets.data, hasDexRange, dexMin, dexMax, values.dex, values.set, values.rarity, values.type, values.stage, hpMin, hpMax, illustrator, values.sort],
  );

  const items = result.data?.items ?? [];

  return (
    <>
      <h1>Cartes du JCC</h1>
      <button type="button" className="btn filters-toggle" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((o) => !o)}>
        {filtersOpen ? 'Masquer les filtres' : 'Filtres'}
      </button>
      <div className="cards-layout">
      <form className={`filters filters-side${filtersOpen ? ' open' : ''}`} onSubmit={(e) => e.preventDefault()} aria-label="Filtres des cartes">
        <SelectField
          label="Langue"
          value={lang}
          onChange={(v) => set({ lang: v, serie: '', set: '', rarity: '', type: '', stage: '' })}
          options={languageOptions()}
          placeholder="Français (défaut)"
        />
        <TextField label="Pokémon (nom FR ou EN)" value={pokemonText} onChange={onPokemonText} list="pokemon-names" placeholder="Pikachu">
          <datalist id="pokemon-names">
            {pokemon?.map((p) => (
              <option key={p.id} value={p.nameFr ?? p.nameEn ?? p.slug} label={p.nameEn} />
            ))}
          </datalist>
        </TextField>
        <fieldset className="field-range">
          <legend>N° de Pokédex (de … à …)</legend>
          <input type="number" min={1} aria-label="N° Pokédex min." value={values.dexMin} placeholder="min" onChange={(e) => set({ dexMin: e.target.value })} />
          <span aria-hidden="true">–</span>
          <input type="number" min={1} aria-label="N° Pokédex max." value={values.dexMax} placeholder="max" onChange={(e) => set({ dexMax: e.target.value })} />
          <small className="muted">
            {values.dex ? 'Ignoré tant qu’un Pokémon est choisi.' : `Maximum ${MAX_DEX_RANGE} numéros par recherche.`}
          </small>
        </fieldset>
        <SelectField
          label="Bloc d'extensions"
          value={values.serie}
          onChange={(v) => set({ serie: v, set: '' })}
          options={(series.data ?? []).map((s) => ({ value: s.id, label: s.name }))}
          disabled={!series.data?.length}
        />
        <SelectField
          label="Extension"
          value={values.set}
          onChange={(v) => set({ set: v })}
          options={(sets.data ?? [])
            .filter((s) => !values.serie || !serieSets.data || serieSets.data.includes(s.id))
            .map((s) => ({ value: s.id, label: s.name }))}
          disabled={!sets.data}
        />
        <SelectField
          label="Rareté"
          value={values.rarity}
          onChange={(v) => set({ rarity: v })}
          options={(rarities.data ?? []).map((r) => ({ value: r, label: r }))}
          disabled={!rarities.data}
        />
        <SelectField
          label="Type (JCC)"
          value={values.type}
          onChange={(v) => set({ type: v })}
          options={(types.data ?? []).map((r) => ({ value: r, label: r }))}
          disabled={!types.data}
        />
        <SelectField
          label="Stade"
          value={values.stage}
          onChange={(v) => set({ stage: v })}
          options={(stages.data ?? []).map((r) => ({ value: r, label: r }))}
          disabled={!stages.data?.length}
        />
        <TextField label="PV min." type="number" value={values.hpMin} onChange={(v) => set({ hpMin: v })} placeholder="ex. 60" />
        <TextField label="PV max." type="number" value={values.hpMax} onChange={(v) => set({ hpMax: v })} placeholder="ex. 120" />
        <TextField label="Illustrateur" value={values.illustrator} onChange={(v) => set({ illustrator: v })} placeholder="Mitsuhiro Arita" />
        <SelectField
          label="Tri"
          value={values.sort}
          onChange={(v) => set({ sort: v })}
          options={[{ value: 'illustrator', label: 'Illustrateur (A→Z)' }]}
          placeholder="Par défaut"
        />
        <button type="button" className="btn" onClick={() => set({ dex: '', dexMin: '', dexMax: '', serie: '', set: '', rarity: '', type: '', stage: '', hpMin: '', hpMax: '', illustrator: '', sort: '' })}>
          Réinitialiser
        </button>
      </form>
      <div className="cards-results">
      <p className="muted small">
        Tous les résultats sont affichés sur une seule page. Choisissez au moins un filtre : charger toutes les cartes d'une langue en une fois serait trop lourd.
      </p>
      {!hasFilter && <Empty>Sélectionnez un filtre (Pokémon, extension, rareté, type, stade, PV ou illustrateur) pour afficher des cartes.</Empty>}
      {hasFilter && result.loading && <Loading label="Recherche des cartes…" />}
      {result.error && <ErrorBox error={result.error} onRetry={result.reload} />}
      {hasFilter && result.data && !result.loading && !items.length && <Empty>Aucune carte pour ces filtres.</Empty>}
      {hasFilter && items.length > 0 && (
        <>
          <p className="muted" role="status">
            {items.length} carte{items.length > 1 ? 's' : ''}
          </p>
          <ul className="grid cards-grid" aria-busy={result.loading}>
            {items.map((c) => (
              <CardTile key={c.uid} card={c} onOpen={setSelected} />
            ))}
          </ul>
        </>
      )}
      </div>
      </div>
      {selected && <CardModal card={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

