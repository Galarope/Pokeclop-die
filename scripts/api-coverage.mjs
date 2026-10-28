// Mesure la couverture RÉELLE des API (aucune donnée simulée) : npm run coverage:api
const TCG = 'https://api.tcgdex.net/v2';
const LANGS = ['fr', 'en', 'ja'];
const SAMPLE = [1, 25, 133, 150, 448, 727, 1000]; // échantillon de n° Pokédex

const get = async (url, init) => {
  const r = await fetch(url, init);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
};

console.log('== PokéAPI ==');
const gql = await get('https://beta.pokeapi.co/graphql/v1beta', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: `{ pokemon_v2_pokemonspecies(order_by:{id:asc}){ id pokemon_v2_pokemonspeciesnames(where:{language_id:{_in:[5,9]}}){language_id} } }`,
  }),
});
const species = gql.data.pokemon_v2_pokemonspecies;
const has = (s, l) => s.pokemon_v2_pokemonspeciesnames.some((n) => n.language_id === l);
console.log(`espèces: ${species.length}, avec nom FR: ${species.filter((s) => has(s, 5)).length}, avec nom EN: ${species.filter((s) => has(s, 9)).length}`);

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
