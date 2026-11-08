import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TypeBadge } from '../components/Pokemon';
import { ErrorBox, Loading } from '../components/Status';
import { TYPE_FR } from '../data/typeChart';
import { STAT_KEYS, type PokemonSummary, type StatKey } from '../domain/types';
import { usePokemonList } from '../hooks/usePokemonList';
import { weaknesses } from '../lib/teamAnalysis';

const LABELS: Record<StatKey, string> = {
  hp: 'PV', attack: 'Attaque', defense: 'Défense', 'special-attack': 'Attaque spéciale',
  'special-defense': 'Défense spéciale', speed: 'Vitesse',
};

function Selector({ label, all, value, onChange }: { label: string; all: PokemonSummary[]; value: string; onChange: (v: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Choisir un Pokémon</option>
        {all.map((p) => <option key={p.id} value={p.id}>#{p.id} · {p.nameFr ?? p.nameEn ?? p.slug}</option>)}
      </select>
    </label>
  );
}

export function ComparePage() {
  const { data, error, loading, reload } = usePokemonList();
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  const selected = [left, right].map((id) => data?.find((p) => String(p.id) === id));
  return (
    <>
      <header className="page-hero"><p className="eyebrow">Pokédex</p><h1>Comparer des Pokémon</h1></header>
      {loading && <Loading label="Chargement des Pokémon…" />}
      {error && <ErrorBox error={error} onRetry={reload} />}
      {data && (
        <>
          <div className="compare-selectors">
            <Selector label="Premier Pokémon" all={data} value={left} onChange={setLeft} />
            <Selector label="Second Pokémon" all={data} value={right} onChange={setRight} />
          </div>
          <p className="muted small">Statistiques de base et types des espèces ; les talents et formes ne sont pas pris en compte.</p>
          <div className="chart-scroll">
            <table className="compare-table">
              <caption className="sr-only">Comparaison des Pokémon</caption>
              <thead><tr><th scope="col">Caractéristique</th>{selected.map((p, i) => <th scope="col" key={i}>{p ? <Link to={`/?p=${p.id}`}>{p.nameFr ?? p.nameEn ?? p.slug}</Link> : '—'}</th>)}</tr></thead>
              <tbody>
                <tr><th scope="row">Types</th>{selected.map((p, i) => <td key={i}>{p ? p.types.map((t) => <TypeBadge key={t.slug} type={t} />) : '—'}</td>)}</tr>
                <tr><th scope="row">Faiblesses</th>{selected.map((p, i) => <td key={i}>{p ? weaknesses(p).map((t) => TYPE_FR[t]).join(', ') || 'Aucune' : '—'}</td>)}</tr>
                {STAT_KEYS.map((key) => <tr key={key}><th scope="row">{LABELS[key]}</th>{selected.map((p, i) => <td key={i}>{p?.stats[key] ?? '—'}</td>)}</tr>)}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
