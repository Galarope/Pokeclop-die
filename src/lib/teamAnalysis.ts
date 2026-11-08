import { TYPES, effectiveness, multiplier, type TypeSlug } from '../data/typeChart';
import type { PokemonSummary } from '../domain/types';

const typesOf = (p: PokemonSummary) => p.types.map((t) => t.slug);

export function weaknesses(p: PokemonSummary): TypeSlug[] {
  return TYPES.filter((type) => multiplier(type, typesOf(p)) > 1);
}

export function recommendTeam(team: PokemonSummary[], all: PokemonSummary[]) {
  const attackTypes = team.flatMap(typesOf).filter((t): t is TypeSlug => TYPES.some((type) => type === t));
  const uncovered = TYPES.filter((defender) => !attackTypes.some((attacker) => effectiveness(attacker, defender) > 1));
  const vulnerable = TYPES.filter((attacker) => {
    const factors = team.map((p) => multiplier(attacker, typesOf(p)));
    return factors.filter((m) => m > 1).length > factors.filter((m) => m < 1).length;
  });
  const suggestions = all.filter((p) => !team.some((member) => member.id === p.id)).map((pokemon) => {
    const types = typesOf(pokemon).filter((t): t is TypeSlug => TYPES.some((type) => type === t));
    const coverage = uncovered.filter((d) => types.some((a) => effectiveness(a, d) > 1));
    const resistance = vulnerable.filter((a) => multiplier(a, typesOf(pokemon)) < 1);
    return { pokemon, coverage, resistance, score: coverage.length + resistance.length };
  }).filter((s) => s.score > 0).sort((a, b) => b.score - a.score || a.pokemon.id - b.pokemon.id).slice(0, 5);
  return { uncovered, vulnerable, suggestions };
}
