import { useDeferredValue, useMemo } from 'react';
import { SelectField, TextField } from '../components/Fields';
import { PokemonModal } from '../components/PokemonModal';
import { PokemonTile } from '../components/Pokemon';
import { Empty, ErrorBox, Loading } from '../components/Status';
import { generationLabel } from '../lib/utils';
import { usePokemonList } from '../hooks/usePokemonList';
import { useUrlState } from '../hooks/useUrlState';
import { normalize } from '../lib/utils';


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
      <h1>Pokédex</h1>
      <form className="filters" onSubmit={(e) => e.preventDefault()} aria-label="Filtres du Pokédex">
        <TextField label="Nom ou numéro" value={values.q} onChange={(v) => set({ q: v })} placeholder="Pikachu, 25…" />
        <SelectField label="Génération" value={values.gen} onChange={(v) => set({ gen: v })} options={gens} />
        <SelectField label="Type" value={values.type} onChange={(v) => set({ type: v })} options={types} />
      </form>
      {loading && !data && <Loading label="Chargement des Pokémon…" />}
      {error && <ErrorBox error={error} onRetry={reload} />}
      {data && (
        <>
          <p className="muted" role="status">
            {filtered.length} Pokémon
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
