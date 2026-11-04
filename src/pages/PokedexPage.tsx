import { useDeferredValue, useMemo } from 'react';
import { SelectField, TextField } from '../components/Fields';
import { PokemonModal } from '../components/PokemonModal';
import { PokemonTile } from '../components/Pokemon';
import { Empty, ErrorBox, Loading, SkeletonGrid } from '../components/Status';
import type { PokemonSummary } from '../domain/types';
import { generationLabel } from '../lib/utils';
import { usePokemonList } from '../hooks/usePokemonList';
import { useUrlState } from '../hooks/useUrlState';
import { normalize } from '../lib/utils';

/** Les trois mascottes du site (celles des curseurs) : Axoloto, Mustébouée au centre, Pikachu. */
const MASCOTS = [
  { id: 194, className: 'mascot mascot-left' },
  { id: 418, className: 'mascot mascot-main' },
  { id: 25, className: 'mascot mascot-right' },
];

function Mascots({ data }: { data?: PokemonSummary[] }) {
  if (!data) return <div className="mascots" aria-hidden="true" />;
  return (
    <div className="mascots" aria-hidden="true">
      {MASCOTS.map((m) => {
        const p = data.find((x) => x.id === m.id);
        return p ? <img key={m.id} className={m.className} src={p.imageUrl} alt="" width={200} height={200} /> : null;
      })}
    </div>
  );
}

export function PokedexPage() {
  const { data, error, loading, reload } = usePokemonList();
  const { values, set } = useUrlState(['q', 'gen', 'type', 'p'] as const);
  const openId = Number(values.p) || undefined;
  // La frappe reste fluide : le filtrage des 1025 tuiles est traité en priorité basse.
  const deferredQ = useDeferredValue(values.q);

  const types = useMemo(() => {
    const m = new Map<string, string>();
    data?.forEach((p) => p.types.forEach((t) => m.set(t.slug, t.labelFr ?? t.slug)));
    return [...m].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label, 'fr'));
  }, [data]);

  const gens = useMemo(
    () => [...new Set(data?.map((p) => p.generation))].sort((a, b) => a - b).map((g) => ({ value: String(g), label: generationLabel(g) })),
    [data],
  );

  const filtered = useMemo(() => {
    const q = normalize(deferredQ);
    return (data ?? []).filter(
      (p) =>
        (!values.gen || p.generation === Number(values.gen)) &&
        (!values.type || p.types.some((t) => t.slug === values.type)) &&
        (!q || normalize(p.nameFr ?? '').includes(q) || normalize(p.nameEn ?? '').includes(q) || String(p.id) === q),
    );
  }, [data, deferredQ, values.gen, values.type]);

  const onGridClick = (e: React.MouseEvent<HTMLUListElement>) => {
    const id = (e.target as HTMLElement).closest<HTMLElement>('button[data-id]')?.dataset.id;
    if (id) set({ p: id }, false);
  };

  return (
    <>
      <header className="page-hero dex-hero">
        <div>
          <p className="eyebrow">Encyclopédie Pokémon & JCC</p>
          <h1>Pokédex</h1>
          <p className="lede">Chaque espèce, ses formes, ses évolutions et toutes ses cartes, en français et en anglais.</p>
        </div>
        <Mascots data={data} />
      </header>
      <form className="filters filters-bar" onSubmit={(e) => e.preventDefault()} aria-label="Filtres du Pokédex">
        <TextField label="Nom ou numéro" value={values.q} onChange={(v) => set({ q: v })} placeholder="Pikachu, 25…" />
        <SelectField label="Génération" value={values.gen} onChange={(v) => set({ gen: v })} options={gens} />
        <SelectField label="Type" value={values.type} onChange={(v) => set({ type: v })} options={types} />
      </form>
      {loading && !data && (
        <>
          <Loading label="Chargement des Pokémon…" />
          <SkeletonGrid />
        </>
      )}
      {error && <ErrorBox error={error} onRetry={reload} />}
      {data && (
        <>
          <p className="result-count" role="status">
            <strong>{filtered.length}</strong> Pokémon
          </p>
          {filtered.length ? (
            <ul className="grid pokemon-grid" onClick={onGridClick}>
              {filtered.map((p) => (
                <PokemonTile key={p.id} p={p} />
              ))}
            </ul>
          ) : (
            <Empty>Aucun Pokémon ne correspond à ces filtres.</Empty>
          )}
        </>
      )}
      {openId && <PokemonModal id={openId} onClose={() => set({ p: '' }, false)} onSelect={(id) => set({ p: id }, false)} />}
    </>
  );
}
