// Mesure la couverture RÉELLE des API (aucune donnée simulée) : npm run coverage:api
const TCG = 'https://api.tcgdex.net/v2';
const POKE_CSV = 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv';
const LANGS = ['fr', 'en', 'ja'];
const SAMPLE = [1, 25, 133, 150, 448, 727, 1000]; // échantillon de n° Pokédex

const get = async (url, init) => {
  const r = await fetch(url, init);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
};

const getText = async (url) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.text();
};

const parseCsv = (input) => {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"' && field === '') quoted = true;
    else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else field += char;
  }
  if (field || row.length) {
    row.push(field.replace(/\r$/, ''));
    rows.push(row);
  }
  const [headers, ...records] = rows;
  if (!headers) throw new Error('Fichier CSV PokéAPI vide');
  return records.map((values) => Object.fromEntries(headers.map((header, i) => [header, values[i] ?? ''])));
};

console.log('== PokéAPI ==');
const [species, names] = await Promise.all([
  getText(`${POKE_CSV}/pokemon_species.csv`).then(parseCsv),
  getText(`${POKE_CSV}/pokemon_species_names.csv`).then(parseCsv),
]);
const speciesIds = new Set(species.map((s) => Number(s.id)));
const namedIn = (languageId) => new Set(
  names.filter((name) => Number(name.local_language_id) === languageId).map((name) => Number(name.pokemon_species_id)),
);
const frNames = namedIn(5);
const enNames = namedIn(9);
console.log(`espèces: ${speciesIds.size}, avec nom FR: ${[...speciesIds].filter((id) => frNames.has(id)).length}, avec nom EN: ${[...speciesIds].filter((id) => enNames.has(id)).length}`);

console.log('\n== TCGdex : extensions par langue ==');
const sets = {};
for (const l of LANGS) sets[l] = (await get(`${TCG}/${l}/sets`)).length;
console.table(sets);

console.log('== TCGdex : nombre de cartes par Pokémon (n° Pokédex) et par langue ==');
const rows = {};
for (const id of SAMPLE) {
  rows[`#${id}`] = {};
  for (const l of LANGS) rows[`#${id}`][l] = (await get(`${TCG}/${l}/cards?dexId=eq:${id}`)).length;
}
console.table(rows);

console.log('== TCGdex : complétude des champs sur un échantillon de cartes (Pikachu, en) ==');
const brief = (await get(`${TCG}/en/cards?dexId=eq:25`)).slice(0, 60);
const details = await Promise.all(brief.map((c) => get(`${TCG}/en/cards/${c.id}`).catch(() => null)));
const ok = details.filter(Boolean);
const pct = (f) => `${ok.filter(f).length}/${ok.length}`;
console.table({
  image: pct((c) => c.image),
  rarity: pct((c) => c.rarity && c.rarity !== 'None'),
  illustrator: pct((c) => c.illustrator),
});
const setIds = [...new Set(ok.map((c) => c.set.id))].slice(0, 30);
const setDetails = await Promise.all(setIds.map((id) => get(`${TCG}/en/sets/${id}`).catch(() => null)));
console.log(`extensions avec releaseDate: ${setDetails.filter((s) => s?.releaseDate).length}/${setIds.length}`);
