# Pokéclopédie

Pokédex et encyclopédie du JCC Pokémon (React + TypeScript + Vite).
Données : [PokéAPI](https://pokeapi.co) (Pokédex) et [TCGdex](https://tcgdex.dev) (cartes, extensions).
Polices auto-hébergées : [Unbounded](https://github.com/googlefonts/unbounded) et [Plus Jakarta Sans](https://github.com/tokotype/PlusJakartaSans), sous licence SIL OFL 1.1 (textes dans `public/fonts/`).
**Aucune donnée n'est simulée** : si une source ne fournit pas une valeur, l'UI affiche « — ».

## Installation

Prérequis : Node.js ≥ 18.

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # typecheck + build de production (dist/)
npm test             # tests unitaires (vitest)
npm run coverage:api # mesure la couverture réelle des API (réseau requis)
```

> Sous PowerShell avec scripts désactivés, utilisez `npm.cmd`.

## Fonctionnalités

| Page | Route | Contenu |
|---|---|---|
| Pokédex (accueil) | `/` | 1025 espèces sur une seule page, filtres génération/type/nom, filtres dans la page |
| Comparaison | `/comparer` | comparaison de deux espèces : types, faiblesses et statistiques de base |
| Fiche Pokémon | pop-up (`/?p=25`) | noms FR/EN, n°, types, taille, poids, stats, génération (+ région), formes (normal et shiny), évolutions, **cartes par langue → extension → carte** |
| Extension | `/sets/:lang/:id` | page d'une extension (accessible depuis la recherche globale ; plus d'onglet « Extensions ») |
| Extension | `/sets/:lang/:id` | détail, filtre de rareté, liste complète des cartes, fiche carte (pop-up) |
| Cartes | `/cards` | filtres langue, Pokémon, bloc et extension, années de sortie min/max incluses, rareté exacte ou niveaux min/max inclus, type (un à inclure, plusieurs à exclure), stade, PV et illustrateur ; filtres actifs amovibles et tri par illustrateur, année, rareté ou numéro. Le tri par rareté charge le détail de chaque carte ; les raretés non classées sont placées en dernier. |
| Équipe et types | `/equipe` | équipes sauvegardées, suggestions fondées sur la couverture et les résistances de type, export/import des équipes et captures. L'import fusionne les équipes par identifiant et conserve pour chaque espèce le plus grand nombre de captures ; les anciens exports d'équipes restent compatibles. |
| Toutes les pages | — | mini-jeu de capture avec 80 % de chances de capture (100 % pour les shinies, légendaires et fabuleux), niveaux de rareté et Pokédex des captures sauvegardé localement |

## Architecture

```
src/
  lib/        http.ts (fetch + retry + ApiError), cache.ts (mémoire + localStorage, TTL, dédup), utils.ts
  domain/     types.ts — modèle de données indépendant des API
  api/        pokeapi.ts — client PokéAPI (GraphQL pour la liste, REST pour le détail)
  sources/    types.ts (interface CardSource), tcgdex.ts, index.ts (registre + agrégation)
  hooks/      useAsync, useUrlState, usePokemonList (contexte)
  components/ Layout, SearchBox, Cards, PokemonModal, PokemonCards, Status…
  pages/      Pokedex, Sets, Set, Cards
scripts/      api-coverage.mjs
```

### Ajouter une source de cartes

1. Créer `src/sources/maSource.ts` implémentant `CardSource` (`searchCards`, `getCard`, `listSets`, `getSet`, `listRarities`, `listTypes`) et renvoyant le modèle de `domain/types.ts`.
2. L'ajouter à `cardSources` dans `src/sources/index.ts`.

La fiche Pokémon interroge alors toutes les sources et toutes leurs langues (`getCardsForPokemon`), déduplique par `uid` (`source:lang:id`) et signale les échecs partiels.
Les pages Extensions/Cartes utilisent pour l'instant TCGdex directement ; les rendre multi-sources demandera un sélecteur de source (non implémenté).

### Cache et erreurs

- `cached()` : mémoire + `localStorage` (préfixe `pkc:v1:`), TTL (10 min recherches, 24 h extensions, 7 j Pokémon/cartes), déduplication des requêtes en vol, éviction en cas de quota, erreurs jamais mises en cache.
- `fetchJson()` : 2 retries avec backoff sur erreur réseau/429/5xx.
- Les erreurs s'affichent avec un bouton « Réessayer » ; échecs partiels (une langue) signalés sans bloquer le reste.

## Couverture réelle des API (mesurée le 2026-10-27, `npm run coverage:api`)

- **PokéAPI** : 1025 espèces, 1025 noms FR et 1025 noms EN.
- **TCGdex** (langues conservées : fr, en) : extensions — en 220, fr 202.
- Cartes de Pikachu (#25) : en 248, fr 222. Couverture inégale selon la langue.
- Champs sur 60 cartes Pikachu (en) : image 41/60, rareté 36/60, illustrateur 59/60 ; date de sortie des extensions 30/30.

## Limites connues (vérifiées)

- **Pas de pagination** : tout est affiché sur une page. Performances mesurées (1025 tuiles, ~8800 nœuds DOM, ~43 Mo de heap, défilement fluide) grâce à `content-visibility` et aux images différées. La page Cartes exige au moins un filtre (toutes les cartes d'une langue = ~2 Mo et des milliers de tuiles).
- **Langues limitées volontairement** à fr/en (`TCGDEX_LANGUAGES`).
- Rareté, illustrateur et catégorie ne sont que dans le **détail** d'une carte (1 requête/carte) : chargés quand la carte devient visible (`IntersectionObserver`, mis en cache).
- La **date d'une extension** n'est pas dans la liste REST des extensions. La page Cartes les obtient toutes en une requête au GraphQL de TCGdex, qui ne connaît que les extensions anglaises (mêmes dates en français) ; les exclusivités françaises (3) sont lues dans leur détail. La fiche Pokémon charge la date d'une extension quand sa tuile devient visible.
- Le filtre type des cartes utilise les types **du JCC** (Eau, Feu…), distincts des types Pokémon. Exclure un type retire aussi les cartes sans type (Dresseurs…) : TCGdex les écarte de toute exclusion.
- **Rareté minimum** : TCGdex ne classe pas ses raretés. L'échelle à 6 niveaux (commune → secrète, TCG Pocket rangé dessus) est dans `src/sources/tcgdexRarities.ts` ; « Promo » et « Sans rareté » n'y figurent pas. Une rareté que TCGdex ajouterait n'est pas proposée par ce filtre tant qu'elle n'y est pas rangée.
- **Plage de n° de Pokédex** : TCGdex ne sait pas filtrer une plage, donc une requête par numéro (6 à la fois, jusqu'au n° 1200, `MAX_DEX_NUMBER`). Mesuré : ~3,5 s pour 361 numéros. Ces résultats restent en mémoire, pas dans `localStorage`, qu'une large plage saturerait.
- La liste du Pokédex dépend de **PokéAPI GraphQL (`beta.pokeapi.co`)**, service en bêta : s'il est indisponible, la liste s'affiche en erreur (pas de repli REST, qui exigerait 1025 requêtes pour les noms FR).
- Les noms de formes et conditions d'évolution (objets, lieux) sont affichés tels que fournis (slugs anglais).
- Pas d'images pour certaines cartes (TCGdex) : « Image non disponible ».
- **Images de cartes manquantes** : TCGdex n'a pas d'image pour certaines cartes (Pikachu fr : 69/222). Si la même carte existe en anglais avec une image, elle est affichée et signalée « Image de la version anglaise » (29 récupérées sur 69) ; sinon « Image non disponible ». pokemontcg.io a été testé comme source de repli : seuls 14 des 48 ids manquants en anglais correspondent, le reste exigerait un appariement approximatif, donc non fiable.
- **Promos Méga-Évolution (MEP)** : toutes les cartes sont listées par TCGdex (en 112, fr 80) mais sans champ `image`. Pour 40 des 112 (en), l'asset existe pourtant à `assets.tcgdex.net/{langue}/{série}/{extension}/{n°}` : le site le retrouve et le vérifie (`CardSource.resolveImage`). Pour les 72 autres, l'image n'existe pas chez TCGdex ; pokemontcg.io n'a pas l'extension MEP. Le français en a 32 de moins (80 cartes) : absentes de la source.
- **Performances** : tuiles Pokémon mémoïsées avec clic délégué, recherche différée (`useDeferredValue`), `content-visibility` sur les cellules de grille (avec une marge intérieure pour que l'élévation et la lueur au survol ne soient pas coupées). Effets visuels : flou réservé à l'en-tête et aux pop-ups (le fond animé se met en pause quand une pop-up est ouverte), inclinaison 3D des tuiles par un seul écouteur délégué (`useTiltEffect`), animations limitées au survol ou à l'entrée. Mesuré (dev) : ouverture de la pop-up 43 ms, aucune tâche longue au défilement, 1 tâche de 50 ms en filtrant ; après la refonte visuelle (build, headless) : aucune tâche longue en parcourant les 1025 tuiles, pire image 14 ms.
- **Illustrateurs** : la liste de TCGdex (`/illustrators`) contient quelques valeurs concaténées (ex. `"Big Mama" Tagawa"Big Mama" Tagawa`), telles qu'elles figurent sur les cartes. Elle sert de suggestions sous un champ texte, qui garde la recherche partielle (« Arita » trouve « Mitsuhiro Arita »).
