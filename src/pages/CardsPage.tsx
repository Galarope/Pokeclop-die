import { useEffect, useMemo, useState } from 'react';
import { CardModal, CardTile } from '../components/Cards';
import { SelectField, TextField } from '../components/Fields';
import { Empty, ErrorBox, Loading } from '../components/Status';
import type { CardBrief } from '../domain/types';
import { useAsync } from '../hooks/useAsync';
import { usePokemonList } from '../hooks/usePokemonList';
import { useUrlState } from '../hooks/useUrlState';
import { NO_MATCH, parseTypeList, releaseYear, resolveSetFilter, serieLabel, serieYears, setIdsReleasedBetween } from '../lib/cardFilters';
import { tcgdex } from '../sources/tcgdex';
import { RARITY_LEVELS, raritiesBetween } from '../sources/tcgdexRarities';
import { LANGUAGE_LABELS } from '../sources/types';
import { cardSources } from '../sources';
import { sortCards } from '../lib/cardSort';
import { mapLimit } from '../lib/utils';

const languageOptions = () =>
  [...new Set(cardSources.flatMap((s) => [...s.languages]))].map((l) => ({ value: l, label: LANGUAGE_LABELS[l] ?? l }));

const rarityMinOptions = RARITY_LEVELS.map((label, i) => ({
  value: String(i + 1),
  label: i + 1 === RARITY_LEVELS.length ? label : `${label} ou plus`,
}));
const rarityMaxOptions = RARITY_LEVELS.map((label, i) => ({
  value: String(i + 1),
  label: i === 0 ? label : `${label} ou moins`,
}));

const KEYS = [
  'lang', 'dex', 'dexMin', 'dexMax', 'serie', 'set', 'from', 'to', 'rarity', 'rarityMin', 'rarityMax', 'type', 'notType', 'stage', 'hpMin', 'hpMax', 'illustrator', 'sort',
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
  // Les anciennes URL contiennent une date ISO complète : conserver leur année.
  const fromInput = values.from.includes('-') ? values.from.slice(0, 4) : values.from;
  const toInput = values.to.includes('-') ? values.to.slice(0, 4) : values.to;
  const from = useDebounced(fromInput);
  const to = useDebounced(toInput);
  const invalidYear = [fromInput, toInput].some((year) => year !== '' && !/^\d{4}$/.test(year));
  const rarityMin = Number(values.rarityMin) || 0;
  const rarityMax = Number(values.rarityMax) || 0;
  const hasDexRange = !values.dex && !!(dexMin || dexMax);
  // Exclure des types ne suffit pas à lui seul : cela chargerait presque toutes les cartes de la langue.
  const hasFilter = !!(
    values.dex || hasDexRange || values.serie || values.set || fromInput || toInput || values.rarity || rarityMin || rarityMax || values.type || values.stage || illustrator || hpMin || hpMax
  );
  // Sans ces listes, les filtres par année ou niveau de rareté seraient ignorés en silence.
  // `loading` compte aussi : au changement de langue, `data` garde un temps la liste de l'autre langue.
  const neededLists = [...(fromInput || toInput ? [releases] : []), ...(rarityMin || rarityMax ? [rarities] : [])];
  const listError = neededLists.find((l) => l.error);
  const waiting = serieLoading || from !== fromInput || to !== toInput || neededLists.some((l) => l.loading || !l.data);
  // Mémoïsés : ce sont des dépendances de la recherche, qui ne doit pas repartir quand une liste inutilisée arrive.
  const setsInYears = useMemo(() => ((from || to) && releases.data ? setIdsReleasedBetween(from, to, releases.data) : undefined), [from, to, releases.data]);
  const rangeRarities = useMemo(() => ((rarityMin || rarityMax) && rarities.data ? raritiesBetween(rarityMin, rarityMax, rarities.data) : undefined), [rarityMin, rarityMax, rarities.data]);
  const result = useAsync(
    (signal) => {
      if (!hasFilter || waiting || invalidYear) return Promise.resolve(undefined);
      return tcgdex.searchCards({
        lang,
        dexId: values.dex ? Number(values.dex) : undefined,
        dexMin: hasDexRange ? toNumber(dexMin) : undefined,
        dexMax: hasDexRange ? toNumber(dexMax) : undefined,
        ...resolveSetFilter(values.set, values.serie ? (serieSets.data ?? []) : undefined, setsInYears),
        rarity: values.rarity || undefined,
        rarities: rangeRarities && (rangeRarities.length ? rangeRarities : [NO_MATCH]),
        type: values.type || undefined,
        excludeTypes: excludedTypes.filter((t) => t !== values.type),
        stage: values.stage || undefined,
        hpMin: toNumber(hpMin),
        hpMax: toNumber(hpMax),
        illustrator: illustrator || undefined,
        sort: values.sort === 'illustrator' ? 'illustrator' : undefined,
      }, signal);
    },
    [
      lang, hasFilter, waiting, invalidYear, serieSets.data, setsInYears, rangeRarities, hasDexRange, dexMin, dexMax, values.dex, values.serie, values.set,
      values.rarity, values.type, values.notType, values.stage, hpMin, hpMax, illustrator, values.sort,
    ],
  );

  const setsInInputYears = !invalidYear && (fromInput || toInput) && releases.data ? setIdsReleasedBetween(fromInput, toInput, releases.data) : undefined;
  const onYearChange = (key: 'from' | 'to', v: string) => {
    const newFrom = key === 'from' ? v : fromInput;
    const newTo = key === 'to' ? v : toInput;
    const valid = [newFrom, newTo].every((year) => year === '' || /^\d{4}$/.test(year));
    const keepSet = !values.set || !valid || !releases.data || setIdsReleasedBetween(newFrom, newTo, releases.data).includes(values.set);
    set(keepSet ? { [key]: v } : { [key]: v, set: '' });
  };
  const toggleExcludedType = (t: string) =>
    set({ notType: (excludedTypes.includes(t) ? excludedTypes.filter((x) => x !== t) : [...excludedTypes, t]).join(',') });

  const rawItems = result.data?.items;
  const rarityDetails = useAsync(async (signal) => {
    if (values.sort !== 'rarity' || !rawItems) return undefined;
    const results = await mapLimit(rawItems, 6, async (card) => {
      if (signal.aborted) throw new DOMException('Tri abandonné', 'AbortError');
      return tcgdex.getCard(card.lang, card.id);
    });
    const details = results.map((entry) => {
      if (entry.status === 'rejected') throw entry.reason;
      return entry.value;
    });
    return { cards: rawItems, details: new Map(details.map((detail) => [detail.uid, detail])) };
  }, [values.sort, rawItems]);
  const sortWaiting = values.sort === 'rarity' && !!rawItems && (rarityDetails.loading || rarityDetails.data?.cards !== rawItems);
  const yearWaiting = values.sort === 'year' && (releases.loading || !releases.data);
  const items = useMemo(() => {
    if (!rawItems) return [];
    if (values.sort === 'year' || values.sort === 'number' || values.sort === 'rarity') {
      return sortCards(rawItems, values.sort, releaseDates, rarityDetails.data?.details);
    }
    return rawItems;
  }, [rawItems, values.sort, releaseDates, rarityDetails.data]);

  const chips: { key: typeof KEYS[number]; label: string; value: string }[] = [
    { key: 'lang', label: 'Langue', value: values.lang ? (LANGUAGE_LABELS[lang] ?? lang) : '' },
    { key: 'dex', label: 'Pokémon', value: dexPokemon?.nameFr ?? dexPokemon?.nameEn ?? values.dex },
    { key: 'dexMin', label: 'N° min.', value: values.dexMin }, { key: 'dexMax', label: 'N° max.', value: values.dexMax },
    { key: 'serie', label: 'Bloc', value: series.data?.find((s) => s.id === values.serie)?.name ?? values.serie },
    { key: 'set', label: 'Extension', value: sets.data?.find((s) => s.id === values.set)?.name ?? values.set },
    { key: 'from', label: 'Année min.', value: fromInput }, { key: 'to', label: 'Année max.', value: toInput },
    { key: 'rarity', label: 'Rareté', value: values.rarity },
    { key: 'rarityMin', label: 'Rareté min.', value: rarityMinOptions[rarityMin - 1]?.label ?? values.rarityMin },
    { key: 'rarityMax', label: 'Rareté max.', value: rarityMaxOptions[rarityMax - 1]?.label ?? values.rarityMax },
    { key: 'type', label: 'Type', value: values.type },
    { key: 'stage', label: 'Stade', value: values.stage },
    { key: 'hpMin', label: 'PV min.', value: values.hpMin }, { key: 'hpMax', label: 'PV max.', value: values.hpMax },
    { key: 'illustrator', label: 'Illustrateur', value: values.illustrator },
  ];

  return (
    <>
      <header className="page-hero">
        <p className="eyebrow">Jeu de cartes à collectionner</p>
        <h1>Cartes du JCC</h1>
      </header>
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
            {values.dex ? 'Ignoré tant qu’un Pokémon est choisi.' : 'Une large plage peut prendre quelques secondes.'}
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
            .filter((s) => !setsInInputYears || setsInInputYears.includes(s.id))
            .map((s) => {
              const year = releaseYear(releaseDates.get(s.id));
              return { value: s.id, label: year ? `${s.name} (${year})` : s.name };
            })}
          disabled={!sets.data}
        />
        <TextField label="Année de sortie minimum" type="number" value={fromInput} onChange={(v) => onYearChange('from', v)} placeholder="ex. 2015">
          <small className="muted">Années de sortie de l'extension, bornes incluses.</small>
        </TextField>
        <TextField label="Année de sortie maximum" type="number" value={toInput} onChange={(v) => onYearChange('to', v)} placeholder="ex. 2020" />
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
          label="Rareté maximum"
          value={values.rarityMax}
          onChange={(v) => set({ rarityMax: v })}
          options={rarityMaxOptions}
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
          options={[
            { value: 'illustrator', label: 'Illustrateur (A→Z)' },
            { value: 'year', label: 'Année (croissante)' },
            { value: 'rarity', label: 'Rareté (croissante)' },
            { value: 'number', label: 'Numéro (croissant)' },
          ]}
          placeholder="Par défaut"
        />
        <button
          type="button"
          className="btn"
          onClick={() =>
            set({
              dex: '', dexMin: '', dexMax: '', serie: '', set: '', from: '', to: '', rarity: '', rarityMin: '', rarityMax: '', type: '', notType: '', stage: '', hpMin: '', hpMax: '',
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
      {(chips.some((chip) => chip.value) || excludedTypes.length > 0) && (
        <ul className="chips" aria-label="Filtres actifs">
          {chips.filter((chip) => chip.value).map((chip) => (
            <li key={chip.key}>{chip.label} : {chip.value}{' '}
              <button type="button" className="chip-x" aria-label={`Retirer le filtre ${chip.label}`} onClick={() => set({ [chip.key]: '', ...(chip.key === 'serie' ? { set: '' } : {}), ...(chip.key === 'lang' ? { serie: '', set: '', rarity: '', type: '', notType: '', stage: '' } : {}) })}>✕</button>
            </li>
          ))}
          {excludedTypes.map((type) => <li key={type}>Sans {type}{' '}
            <button type="button" className="chip-x" aria-label={`Ne plus exclure ${type}`} onClick={() => toggleExcludedType(type)}>✕</button>
          </li>)}
        </ul>
      )}
      {!hasFilter && <Empty>Sélectionnez un filtre (Pokémon, extension, date, rareté, type, stade, PV ou illustrateur) pour afficher des cartes.</Empty>}
      {invalidYear && <p className="status error" role="alert">Saisissez une année sur quatre chiffres.</p>}
      {hasFilter && !invalidYear && (result.loading || (waiting && !listError)) && <Loading label="Recherche des cartes…" />}
      {listError?.error && <ErrorBox error={listError.error} onRetry={listError.reload} />}
      {!listError && releases.error && <ErrorBox error={releases.error} onRetry={releases.reload} />}
      {result.error && <ErrorBox error={result.error} onRetry={result.reload} />}
      {rarityDetails.error && values.sort === 'rarity' && <ErrorBox error={rarityDetails.error} onRetry={rarityDetails.reload} />}
      {hasFilter && !invalidYear && !waiting && ((sortWaiting && !rarityDetails.error) || (yearWaiting && !releases.error)) && <Loading label="Tri des cartes…" />}
      {hasFilter && !invalidYear && !waiting && result.data && !result.loading && !items.length && <Empty>Aucune carte pour ces filtres.</Empty>}
      {hasFilter && !invalidYear && !waiting && !sortWaiting && !yearWaiting && items.length > 0 && (
        <>
          <p className="result-count" role="status">
            <strong>{items.length}</strong> carte{items.length > 1 ? 's' : ''}
          </p>
          <ul className="grid cards-grid" aria-busy={result.loading}>
            {items.map((c) => (
              <CardTile key={c.uid} card={c} onOpen={setSelected} year={releaseYear(releaseDates.get(c.setId))} />
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
