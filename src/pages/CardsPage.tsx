import { useEffect, useMemo, useState } from 'react';
import { CardModal, CardTile } from '../components/Cards';
import { SelectField, TextField } from '../components/Fields';
import { Empty, ErrorBox, Loading } from '../components/Status';
import type { CardBrief } from '../domain/types';
import { useAsync } from '../hooks/useAsync';
import { usePokemonList } from '../hooks/usePokemonList';
import { useUrlState } from '../hooks/useUrlState';
import { formatShortDate, NO_MATCH, parseTypeList, resolveSetFilter, serieLabel, serieYears, setIdsReleasedSince } from '../lib/cardFilters';
import { MAX_DEX_RANGE, tcgdex } from '../sources/tcgdex';
import { RARITY_LEVELS, raritiesAtLeast } from '../sources/tcgdexRarities';
import { LANGUAGE_LABELS } from '../sources/types';
import { cardSources } from '../sources';

const languageOptions = () =>
  [...new Set(cardSources.flatMap((s) => [...s.languages]))].map((l) => ({ value: l, label: LANGUAGE_LABELS[l] ?? l }));

const rarityMinOptions = RARITY_LEVELS.map((label, i) => ({
  value: String(i + 1),
  label: i + 1 === RARITY_LEVELS.length ? label : `${label} ou plus`,
}));

const KEYS = [
  'lang', 'dex', 'dexMin', 'dexMax', 'serie', 'set', 'from', 'rarity', 'rarityMin', 'type', 'notType', 'stage', 'hpMin', 'hpMax', 'illustrator', 'sort',
] as const;

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
  const releases = useAsync(() => (tcgdex.listSetReleases ? tcgdex.listSetReleases(lang) : Promise.resolve([])), [lang]);
  const illustrators = useAsync(() => (tcgdex.listIllustrators ? tcgdex.listIllustrators(lang) : Promise.resolve([])), [lang]);
  const releaseDates = useMemo(() => new Map((releases.data ?? []).map((r) => [r.id, r.releaseDate])), [releases.data]);
  const excludedTypes = parseTypeList(values.notType);

  // Les champs texte/numériques sont retardés pour ne pas lancer une requête à chaque frappe.
  const illustrator = useDebounced(values.illustrator.trim());
  const hpMin = useDebounced(values.hpMin);
  const hpMax = useDebounced(values.hpMax);
  const dexMin = useDebounced(values.dexMin);
  const dexMax = useDebounced(values.dexMax);
  const from = useDebounced(values.from);
  const rarityMin = Number(values.rarityMin) || 0;
  const hasDexRange = !values.dex && !!(dexMin || dexMax);
  // Exclure des types ne suffit pas à lui seul : cela chargerait presque toutes les cartes de la langue.
  const hasFilter = !!(
    values.dex || hasDexRange || values.serie || values.set || from || values.rarity || rarityMin || values.type || values.stage || illustrator || hpMin || hpMax
  );
  // Sans ces listes, le filtre date ou rareté minimum serait ignoré en silence : on attend (ou on affiche l'erreur).
  // `loading` compte aussi : au changement de langue, `data` garde un temps la liste de l'autre langue.
  const neededLists = [...(from ? [releases] : []), ...(rarityMin ? [rarities] : [])];
  const listError = neededLists.find((l) => l.error);
  const waiting = serieLoading || neededLists.some((l) => l.loading || !l.data);
  // Mémoïsés : ce sont des dépendances de la recherche, qui ne doit pas repartir quand une liste inutilisée arrive.
  const setsSince = useMemo(() => (from && releases.data ? setIdsReleasedSince(from, releases.data) : undefined), [from, releases.data]);
  const minRarities = useMemo(() => (rarityMin && rarities.data ? raritiesAtLeast(rarityMin, rarities.data) : undefined), [rarityMin, rarities.data]);
  const result = useAsync(
    () => {
      if (!hasFilter || waiting) return Promise.resolve(undefined);
      return tcgdex.searchCards({
        lang,
        dexId: values.dex ? Number(values.dex) : undefined,
        dexMin: hasDexRange ? toNumber(dexMin) : undefined,
        dexMax: hasDexRange ? toNumber(dexMax) : undefined,
        ...resolveSetFilter(values.set, values.serie ? (serieSets.data ?? []) : undefined, setsSince),
        rarity: values.rarity || undefined,
        rarities: minRarities && (minRarities.length ? minRarities : [NO_MATCH]),
        type: values.type || undefined,
        excludeTypes: excludedTypes.filter((t) => t !== values.type),
        stage: values.stage || undefined,
        hpMin: toNumber(hpMin),
        hpMax: toNumber(hpMax),
        illustrator: illustrator || undefined,
        sort: values.sort === 'illustrator' ? 'illustrator' : undefined,
      });
    },
    [
      lang, hasFilter, waiting, serieSets.data, setsSince, minRarities, hasDexRange, dexMin, dexMax, values.dex, values.serie, values.set,
      values.rarity, values.type, values.notType, values.stage, hpMin, hpMax, illustrator, values.sort,
    ],
  );

  const setsSinceFrom = values.from && releases.data ? setIdsReleasedSince(values.from, releases.data) : undefined;
  const onFromChange = (v: string) => {
    const keepSet = !values.set || !v || !releases.data || setIdsReleasedSince(v, releases.data).includes(values.set);
    set(keepSet ? { from: v } : { from: v, set: '' });
  };
  const toggleExcludedType = (t: string) =>
    set({ notType: (excludedTypes.includes(t) ? excludedTypes.filter((x) => x !== t) : [...excludedTypes, t]).join(',') });

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
          onChange={(v) => set({ lang: v, serie: '', set: '', rarity: '', type: '', notType: '', stage: '' })}
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
          options={(series.data ?? []).map((s) => ({ value: s.id, label: serieLabel(s.name, releases.data && serieYears(s.id, releases.data)) }))}
          disabled={!series.data?.length}
        />
        <SelectField
          label="Extension"
          value={values.set}
          onChange={(v) => set({ set: v })}
          options={(sets.data ?? [])
            .filter((s) => !values.serie || !serieSets.data || serieSets.data.includes(s.id))
            .filter((s) => !setsSinceFrom || setsSinceFrom.includes(s.id))
            .map((s) => {
              const date = formatShortDate(releaseDates.get(s.id));
              return { value: s.id, label: date ? `${s.name} (${date})` : s.name };
            })}
          disabled={!sets.data}
        />
        <TextField label="Sorties à partir du" type="date" value={values.from} onChange={onFromChange}>
          <small className="muted">Date de sortie de l'extension de la carte.</small>
        </TextField>
        <SelectField
          label="Rareté"
          value={values.rarity}
          onChange={(v) => set({ rarity: v })}
          options={(rarities.data ?? []).map((r) => ({ value: r, label: r }))}
          disabled={!rarities.data}
        />
        <SelectField
          label="Rareté minimum"
          value={values.rarityMin}
          onChange={(v) => set({ rarityMin: v })}
          options={rarityMinOptions}
          disabled={!rarities.data}
        />
        <SelectField
          label="Type (JCC)"
          value={values.type}
          onChange={(v) => set({ type: v, notType: excludedTypes.filter((t) => t !== v).join(',') })}
          options={(types.data ?? []).map((r) => ({ value: r, label: r }))}
          disabled={!types.data}
        />
        <fieldset className="field-range" disabled={!types.data}>
          <legend>Exclure des types</legend>
          {(types.data ?? []).map((t) => {
            const excluded = excludedTypes.includes(t);
            return (
              <button key={t} type="button" className="type-toggle" aria-pressed={excluded} disabled={t === values.type} onClick={() => toggleExcludedType(t)}>
                {excluded && <span aria-hidden="true">✕ </span>}
                {t}
              </button>
            );
          })}
          <small className="muted">À combiner avec un autre filtre. Les cartes sans type, comme les Dresseurs, sont alors retirées aussi.</small>
        </fieldset>
        <SelectField
          label="Stade"
          value={values.stage}
          onChange={(v) => set({ stage: v })}
          options={(stages.data ?? []).map((r) => ({ value: r, label: r }))}
          disabled={!stages.data?.length}
        />
        <TextField label="PV min." type="number" value={values.hpMin} onChange={(v) => set({ hpMin: v })} placeholder="ex. 60" />
        <TextField label="PV max." type="number" value={values.hpMax} onChange={(v) => set({ hpMax: v })} placeholder="ex. 120" />
        <TextField label="Illustrateur" value={values.illustrator} onChange={(v) => set({ illustrator: v })} list="illustrator-names" placeholder="Mitsuhiro Arita">
          <datalist id="illustrator-names">
            {illustrators.data?.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </TextField>
        <SelectField
          label="Tri"
          value={values.sort}
          onChange={(v) => set({ sort: v })}
          options={[{ value: 'illustrator', label: 'Illustrateur (A→Z)' }]}
          placeholder="Par défaut"
        />
        <button
          type="button"
          className="btn"
          onClick={() =>
            set({
              dex: '', dexMin: '', dexMax: '', serie: '', set: '', from: '', rarity: '', rarityMin: '', type: '', notType: '', stage: '', hpMin: '', hpMax: '',
              illustrator: '', sort: '',
            })
          }
        >
          Réinitialiser
        </button>
      </form>
      <div className="cards-results">
      <p className="muted small">
        Tous les résultats sont affichés sur une seule page. Choisissez au moins un filtre : charger toutes les cartes d'une langue en une fois serait trop lourd.
      </p>
      {!hasFilter && <Empty>Sélectionnez un filtre (Pokémon, extension, date, rareté, type, stade, PV ou illustrateur) pour afficher des cartes.</Empty>}
      {hasFilter && (result.loading || (waiting && !listError)) && <Loading label="Recherche des cartes…" />}
      {listError?.error && <ErrorBox error={listError.error} onRetry={listError.reload} />}
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

