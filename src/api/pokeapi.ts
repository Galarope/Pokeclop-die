import { cached, TTL } from '../lib/cache';
import { fetchJson } from '../lib/http';
import type {
  EvolutionNode,
  PokemonAbility,
  PokemonDetail,
  PokemonForm,
  PokemonSummary,
  PokemonType,
  StatKey,
} from '../domain/types';
import { STAT_KEYS } from '../domain/types';

const REST = 'https://pokeapi.co/api/v2';
const GRAPHQL = 'https://beta.pokeapi.co/graphql/v1beta';
const FR = 5;
const EN = 9;

export const artworkUrl = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

// ---------- Liste (GraphQL : 1 requête pour toutes les espèces) ----------

interface GqlSpecies {
  id: number;
  name: string;
  generation_id: number;
  evolves_from_species_id?: number | null;
  pokemon_v2_pokemonspeciesnames: { name: string; language_id: number }[];
  pokemon_v2_pokemons: {
    height: number | null;
    weight: number | null;
    pokemon_v2_pokemontypes: {
      pokemon_v2_type: { name: string; pokemon_v2_typenames: { name: string }[] };
    }[];
    pokemon_v2_pokemonstats: { base_stat: number; pokemon_v2_stat: { name: string } }[];
  }[];
}

const LIST_QUERY = `query {
  pokemon_v2_pokemonspecies(order_by: {id: asc}) {
    id name generation_id evolves_from_species_id
    pokemon_v2_pokemonspeciesnames(where: {language_id: {_in: [${FR}, ${EN}]}}) { name language_id }
    pokemon_v2_pokemons(where: {is_default: {_eq: true}}) {
      height weight
      pokemon_v2_pokemontypes(order_by: {slot: asc}) {
        pokemon_v2_type { name pokemon_v2_typenames(where: {language_id: {_eq: ${FR}}}) { name } }
      }
      pokemon_v2_pokemonstats { base_stat pokemon_v2_stat { name } }
    }
  }
}`;

function toStats(rows: { base_stat: number; pokemon_v2_stat: { name: string } }[]): Partial<Record<StatKey, number>> {
  const out: Partial<Record<StatKey, number>> = {};
  for (const r of rows) {
    const k = r.pokemon_v2_stat.name as StatKey;
    if ((STAT_KEYS as readonly string[]).includes(k)) out[k] = r.base_stat;
  }
  return out;
}

export function mapSpecies(s: GqlSpecies): PokemonSummary {
  const p = s.pokemon_v2_pokemons[0];
  const name = (lang: number) => s.pokemon_v2_pokemonspeciesnames.find((n) => n.language_id === lang)?.name || undefined;
  return {
    id: s.id,
    slug: s.name,
    nameFr: name(FR),
    nameEn: name(EN),
    generation: s.generation_id,
    evolvesFromId: s.evolves_from_species_id ?? undefined,
    types: (p?.pokemon_v2_pokemontypes ?? []).map((t) => ({
      slug: t.pokemon_v2_type.name,
      labelFr: t.pokemon_v2_type.pokemon_v2_typenames[0]?.name,
    })),
    height: p?.height ?? undefined,
    weight: p?.weight ?? undefined,
    stats: toStats(p?.pokemon_v2_pokemonstats ?? []),
    imageUrl: artworkUrl(s.id),
  };
}

export function getPokemonList(): Promise<PokemonSummary[]> {
  return cached(
    'pokeapi:list:v2',
    async () => {
      const json = await fetchJson<{ data?: { pokemon_v2_pokemonspecies: GqlSpecies[] }; errors?: unknown }>(GRAPHQL, {
        init: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: LIST_QUERY }),
        },
      });
      if (!json.data) throw new Error('Réponse PokéAPI GraphQL invalide');
      return json.data.pokemon_v2_pokemonspecies.map(mapSpecies);
    },
    { ttl: TTL.week },
  );
}

// ---------- Détail (REST) ----------

interface RestSpecies {
  genera: { genus: string; language: { name: string } }[];
  flavor_text_entries: { flavor_text: string; language: { name: string } }[];
  varieties: { is_default: boolean; pokemon: { name: string } }[];
  evolution_chain: { url: string } | null;
}

interface RestPokemon {
  name: string;
  height: number;
  weight: number;
  types: { slot: number; type: { name: string } }[];
  stats: { base_stat: number; stat: { name: string } }[];
  abilities?: { ability: { name: string; url: string }; is_hidden: boolean; slot: number }[];
  sprites: { other?: { 'official-artwork'?: { front_default: string | null; front_shiny?: string | null } } };
}

interface RestChainLink {
  species: { name: string; url: string };
  evolution_details: {
    min_level: number | null;
    item: { name: string } | null;
    trigger: { name: string } | null;
    min_happiness: number | null;
    known_move: { name: string } | null;
    location: { name: string } | null;
    time_of_day: string;
  }[];
  evolves_to: RestChainLink[];
}

const clean = (t?: string) => t?.replace(/[\n\f\r]+/g, ' ').trim() || undefined;
const speciesIdFromUrl = (url: string) => Number(url.split('/').filter(Boolean).pop());

export function describeEvolution(d: RestChainLink['evolution_details'][number]): string {
  const parts: string[] = [];
  if (d.min_level) parts.push(`Niveau ${d.min_level}`);
  if (d.item) parts.push(`Objet : ${d.item.name}`);
  if (d.min_happiness) parts.push(`Bonheur ≥ ${d.min_happiness}`);
  if (d.known_move) parts.push(`Connaît ${d.known_move.name}`);
  if (d.location) parts.push(`Lieu : ${d.location.name}`);
  if (d.time_of_day) parts.push(d.time_of_day === 'day' ? 'De jour' : 'De nuit');
  if (!parts.length && d.trigger && d.trigger.name !== 'level-up') parts.push(d.trigger.name);
  return parts.join(', ');
}

export function toEvolutionTree(link: RestChainLink): EvolutionNode {
  return {
    speciesId: speciesIdFromUrl(link.species.url),
    slug: link.species.name,
    conditions: link.evolution_details.map(describeEvolution).filter(Boolean),
    children: link.evolves_to.map(toEvolutionTree),
  };
}

const toTypes = (t: RestPokemon['types'], labels: Map<string, string | undefined>): PokemonType[] =>
  [...t].sort((a, b) => a.slot - b.slot).map((x) => ({ slug: x.type.name, labelFr: labels.get(x.type.name) }));

export async function getPokemonDetail(summary: PokemonSummary, allTypes: PokemonSummary[]): Promise<PokemonDetail> {
  return cached(
    `pokeapi:detail:v3:${summary.id}`,
    async () => {
      const labels = new Map<string, string | undefined>();
      allTypes.forEach((p) => p.types.forEach((t) => labels.set(t.slug, t.labelFr)));

      const species = await fetchJson<RestSpecies>(`${REST}/pokemon-species/${summary.id}`);
      const [forms, chain] = await Promise.all([
        Promise.all(
          species.varieties.map(async (v): Promise<PokemonForm> => {
            const p = await fetchJson<RestPokemon>(`${REST}/pokemon/${v.pokemon.name}`);
            const abilities = await Promise.all(
              [...(p.abilities ?? [])]
                .sort((a, b) => a.slot - b.slot)
                .map(async (a): Promise<PokemonAbility> => {
                  const nameFr = await cached(
                    `pokeapi:ability:v1:${a.ability.name}`,
                    async () => {
                      const r = await fetchJson<{ names: { name: string; language: { name: string } }[] }>(a.ability.url);
                      return r.names.find((n) => n.language.name === 'fr')?.name ?? null;
                    },
                    { ttl: TTL.week },
                  ).catch(() => null);
                  return { slug: a.ability.name, nameFr: nameFr ?? undefined, hidden: a.is_hidden };
                }),
            );
            return {
              slug: p.name,
              isDefault: v.is_default,
              types: toTypes(p.types, labels),
              abilities,
              height: p.height,
              weight: p.weight,
              stats: toStats(p.stats.map((s) => ({ base_stat: s.base_stat, pokemon_v2_stat: { name: s.stat.name } }))),
              imageUrl: p.sprites.other?.['official-artwork']?.front_default ?? undefined,
                            shinyImageUrl: p.sprites.other?.['official-artwork']?.front_shiny ?? undefined,
                          };
          }),
        ),
        species.evolution_chain
          ? fetchJson<{ chain: RestChainLink }>(species.evolution_chain.url).then((c) => toEvolutionTree(c.chain))
          : Promise.resolve(undefined),
      ]);

      const genus = (l: string) => clean(species.genera.find((g) => g.language.name === l)?.genus);
      // PokéAPI liste plusieurs jeux ; on prend la dernière entrée de la langue.
      const flavor = (l: string) => clean([...species.flavor_text_entries].reverse().find((f) => f.language.name === l)?.flavor_text);

      return {
        ...summary,
        genusFr: genus('fr'),
        genusEn: genus('en'),
        flavorFr: flavor('fr'),
        flavorEn: flavor('en'),
        forms,
        evolution: chain,
      };
    },
    { ttl: TTL.week },
  );
}
