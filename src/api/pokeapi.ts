import { cached, TTL } from '../lib/cache';
import { fetchJson, fetchText } from '../lib/http';
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
const CSV = 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv';
const FR = 5;
const EN = 9;
const LIST_FILES = [
  'pokemon_species.csv',
  'pokemon_species_names.csv',
  'pokemon.csv',
  'pokemon_types.csv',
  'pokemon_stats.csv',
  'types.csv',
  'type_names.csv',
  'stats.csv',
] as const;

export const artworkUrl = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

type CsvRow = Record<string, string>;

function parseCsv(input: string): CsvRow[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"' && field === '') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field.replace(/\r$/, ''));
    rows.push(row);
  }

  const [headers, ...records] = rows;
  if (!headers) throw new Error('Fichier CSV PokéAPI vide');
  return records.map((values) => Object.fromEntries(headers.map((header, i) => [header, values[i] ?? ''])));
}

function toStats(rows: { base_stat: number; stat: string }[]): Partial<Record<StatKey, number>> {
  const out: Partial<Record<StatKey, number>> = {};
  for (const r of rows) {
    const k = r.stat as StatKey;
    if ((STAT_KEYS as readonly string[]).includes(k)) out[k] = r.base_stat;
  }
  return out;
}

async function loadPokemonList(): Promise<PokemonSummary[]> {
  const files = await Promise.all(LIST_FILES.map(async (file) => parseCsv(await fetchText(`${CSV}/${file}`))));
  const [species, names, pokemon, pokemonTypes, pokemonStats, types, typeNames, stats] = files;

  const namesBySpecies = new Map<number, Map<number, string>>();
  for (const row of names) {
    const speciesId = Number(row.pokemon_species_id);
    const languageId = Number(row.local_language_id);
    if (languageId !== FR && languageId !== EN) continue;
    let localizedNames = namesBySpecies.get(speciesId);
    if (!localizedNames) namesBySpecies.set(speciesId, (localizedNames = new Map()));
    localizedNames.set(languageId, row.name);
  }

  const defaultPokemon = new Map<number, CsvRow>();
  for (const row of pokemon) {
    if (row.is_default === '1') defaultPokemon.set(Number(row.species_id), row);
  }

  const typeNamesFr = new Map<number, string>();
  for (const row of typeNames) {
    if (Number(row.local_language_id) === FR) typeNamesFr.set(Number(row.type_id), row.name);
  }
  const typesById = new Map(types.map((row) => [Number(row.id), row.identifier]));
  const typeRowsByPokemon = new Map<number, { slot: number; typeId: number }[]>();
  for (const row of pokemonTypes) {
    const pokemonId = Number(row.pokemon_id);
    let entries = typeRowsByPokemon.get(pokemonId);
    if (!entries) typeRowsByPokemon.set(pokemonId, (entries = []));
    entries.push({ slot: Number(row.slot), typeId: Number(row.type_id) });
  }

  const statNames = new Map(stats.map((row) => [Number(row.id), row.identifier]));
  const statRowsByPokemon = new Map<number, { base_stat: number; stat: string }[]>();
  for (const row of pokemonStats) {
    const stat = statNames.get(Number(row.stat_id));
    if (!stat) continue;
    const pokemonId = Number(row.pokemon_id);
    let entries = statRowsByPokemon.get(pokemonId);
    if (!entries) statRowsByPokemon.set(pokemonId, (entries = []));
    entries.push({ base_stat: Number(row.base_stat), stat });
  }

  return species.map((row): PokemonSummary => {
    const id = Number(row.id);
    const p = defaultPokemon.get(id);
    const localizedNames = namesBySpecies.get(id);
    const pokemonId = Number(p?.id);
    return {
      id,
      slug: row.identifier,
      nameFr: localizedNames?.get(FR),
      nameEn: localizedNames?.get(EN),
      generation: Number(row.generation_id),
      evolvesFromId: row.evolves_from_species_id ? Number(row.evolves_from_species_id) : undefined,
      isLegendary: row.is_legendary === '1',
      isMythical: row.is_mythical === '1',
      types: (typeRowsByPokemon.get(pokemonId) ?? [])
        .sort((a, b) => a.slot - b.slot)
        .flatMap(({ typeId }) => {
          const slug = typesById.get(typeId);
          return slug ? [{ slug, labelFr: typeNamesFr.get(typeId) }] : [];
        }),
      height: p ? Number(p.height) : undefined,
      weight: p ? Number(p.weight) : undefined,
      stats: toStats(statRowsByPokemon.get(pokemonId) ?? []),
      imageUrl: artworkUrl(id),
    };
  });
}

export function getPokemonList(): Promise<PokemonSummary[]> {
  return cached(
    'pokeapi:list:v4',
    loadPokemonList,
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
  forms?: { url: string }[];
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
    `pokeapi:detail:v4:${summary.id}`,
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
            // Les noms localisés d'une forme sont sur /pokemon-form ; la forme par défaut n'en a pas (on reprend le nom de l'espèce).
            const formNames = p.forms?.[0]
              ? await fetchJson<{ names: { name: string; language: { name: string } }[] }>(p.forms[0].url)
                  .then((f) => f.names)
                  .catch(() => [])
              : [];
            const formName = (l: string) => formNames.find((n) => n.language.name === l)?.name || undefined;
            return {
              slug: p.name,
              nameFr: formName('fr') ?? (v.is_default ? summary.nameFr : undefined),
              nameEn: formName('en') ?? (v.is_default ? summary.nameEn : undefined),
              isDefault: v.is_default,
              types: toTypes(p.types, labels),
              abilities,
              height: p.height,
              weight: p.weight,
              stats: toStats(p.stats.map((s) => ({ base_stat: s.base_stat, stat: s.stat.name }))),
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
