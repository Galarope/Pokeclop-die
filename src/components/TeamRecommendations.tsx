import { Link } from 'react-router-dom';
import { TYPE_FR } from '../data/typeChart';
import type { PokemonSummary } from '../domain/types';
import { recommendTeam } from '../lib/teamAnalysis';

export function TeamRecommendations({ team, pokemon }: { team: PokemonSummary[]; pokemon: PokemonSummary[] }) {
  if (!team.length) return null;
  const { uncovered, vulnerable, suggestions } = recommendTeam(team, pokemon);
  return (
    <section className="team-weak">
      <h3>Couverture et suggestions</h3>
      <p className="muted small">Estimation basée uniquement sur les types des espèces, sans leurs attaques, talents ou formes.</p>
      <p>Types sans attaque super efficace : {uncovered.length ? uncovered.map((t) => TYPE_FR[t]).join(', ') : 'aucun'}.</p>
      <p>Faiblesses collectives : {vulnerable.length ? vulnerable.map((t) => TYPE_FR[t]).join(', ') : 'aucune'}.</p>
      {suggestions.length ? (
        <ul>
          {suggestions.map(({ pokemon: p, coverage, resistance }) => (
            <li key={p.id}>
              <Link to={`/?p=${p.id}`}>{p.nameFr ?? p.nameEn ?? p.slug}</Link>
              {' — '}{coverage.length ? `couvre ${coverage.map((t) => TYPE_FR[t]).join(', ')}` : ''}
              {coverage.length && resistance.length ? ' ; ' : ''}
              {resistance.length ? `résiste à ${resistance.map((t) => TYPE_FR[t]).join(', ')}` : ''}
            </li>
          ))}
        </ul>
      ) : <p>Aucune suggestion améliorant ces critères.</p>}
    </section>
  );
}
