/**
 * Données éditoriales des régions (jeux principaux). Les Pokémon sont référencés par numéro national ;
 * les noms et images viennent du Pokédex. Les équipes sont celles des jeux d'origine indiqués ;
 * les formes régionales sont affichées sous la forme de base. Les noms de dresseurs hors Kanto
 * sont donnés en version originale.
 */
export interface Trainer {
  name: string;
  place?: string;
  type?: string;
  badge?: string;
  team: number[];
  note?: string;
  /** dresseur alternatif selon la version du jeu */
  alt?: Trainer;
}

export interface Region {
  id: string;
  name: string;
  generation: number;
  games: string;
  inspiration: string;
  professor: string;
  starters: number[];
  legendaries: number[];
  villains: string;
  cities: string[];
  challengeLabel: string;
  gyms: Trainer[];
  leagueName: string;
  eliteFour: Trainer[];
  champion: Trainer;
  color: string;
  notes?: string;
  /** champion alternatif selon la version (ex. Alola) */
  altChampion?: Trainer;
  /** mécanique majeure introduite par la génération (une phrase) */
  mechanic: string;
  /** bornes du Pokédex national introduites par la génération */
  dexFirst: number;
  dexLast: number;
  differences: GameDifference[];
}

export interface GameDifference {
  games: string;
  text: string;
}

export const REGIONS: Region[] = [
  {
    id: 'kanto',
    name: 'Kanto',
    generation: 1,
    games: 'Rouge, Bleu, Jaune · Rouge Feu, Vert Feuille · Let’s Go Pikachu/Évoli',
    inspiration: 'Région de Kantō, Japon',
    professor: 'Professeur Chen',
    starters: [1, 4, 7],
    legendaries: [144, 145, 146, 150],
    villains: 'Team Rocket',
    cities: ['Bourg Palette', 'Jadielle', 'Argenta', 'Azuria', 'Carmin sur Mer', 'Lavanville', 'Céladopole', 'Parmanie', 'Safrania', 'Cramois’Île'],
    challengeLabel: 'Arènes',
    gyms: [
      { name: 'Pierre', place: 'Argenta', type: 'Roche', badge: 'Badge Roche', team: [74, 95] },
      { name: 'Ondine', place: 'Azuria', type: 'Eau', badge: 'Badge Cascade', team: [120, 121] },
      { name: 'Major Bob', place: 'Carmin sur Mer', type: 'Électrik', badge: 'Badge Foudre', team: [100, 25, 26] },
      { name: 'Érika', place: 'Céladopole', type: 'Plante', badge: 'Badge Prisme', team: [71, 114, 45] },
      { name: 'Koga', place: 'Parmanie', type: 'Poison', badge: 'Badge Âme', team: [109, 89, 109, 110] },
      { name: 'Morgane', place: 'Safrania', type: 'Psy', badge: 'Badge Marais', team: [64, 122, 49, 65] },
      { name: 'Auguste', place: 'Cramois’Île', type: 'Feu', badge: 'Badge Volcan', team: [58, 77, 78, 59] },
      { name: 'Giovanni', place: 'Jadielle', type: 'Sol', badge: 'Badge Terre', team: [111, 51, 31, 34, 112] },
    ],
    leagueName: 'Ligue Indigo',
    eliteFour: [
      { name: 'Olga (Lorelei)', type: 'Glace', team: [87, 91, 80, 124, 131] },
      { name: 'Aldo (Bruno)', type: 'Combat', team: [95, 107, 106, 95, 68] },
      { name: 'Agatha', type: 'Spectre', team: [94, 42, 93, 24, 94] },
      { name: 'Peter (Lance)', type: 'Dragon', team: [130, 148, 148, 142, 149] },
    ],
    champion: { name: 'Blue', team: [18, 65, 112, 130, 59, 103], note: 'Les derniers Pokémon varient selon le starter choisi (Gyarados, Arcanine ou Exeggutor).' },
    color: '#e0533d',
    mechanic: 'Les types et les combats au tour par tour, ainsi que les 151 premiers Pokémon.',
    dexFirst: 1,
    dexLast: 151,
    differences: [
      { games: 'Rouge / Bleu / Jaune', text: 'Rouge et Bleu ont des Pokémon exclusifs différents ; Jaune suit l’anime (Pikachu de départ, équipes de dresseurs modifiées).' },
      { games: 'Rouge Feu / Vert Feuille', text: 'Remakes qui ajoutent les îles Sevii, les Talents et les Natures, avec les arènes dans le même ordre.' },
      { games: 'Let’s Go Pikachu / Évoli', text: 'Capture à la manière de Pokémon GO, seuls les 151 premiers Pokémon plus Meltan et Melmetal ; les arènes restent dans le même ordre.' },
    ],
  },
  {
    id: 'johto',
    name: 'Johto',
    generation: 2,
    games: 'Or, Argent, Cristal · HeartGold, SoulSilver',
    inspiration: 'Région du Kansai, Japon',
    professor: 'Professeur Orme',
    starters: [152, 155, 158],
    legendaries: [243, 244, 245, 249, 250],
    villains: 'Team Rocket (retour)',
    cities: ['Bourg Geon', 'Rosalia', 'Mauville', 'Écorcia', 'Doublonville', 'Irisia', 'Oliville', 'Acajou', 'Ébènelle'],
    challengeLabel: 'Arènes',
    gyms: [
      { name: 'Falkner', place: 'Mauville', type: 'Vol', badge: 'Badge Zéphyr', team: [16, 17] },
      { name: 'Bugsy', place: 'Écorcia', type: 'Insecte', badge: 'Badge Essaim', team: [11, 14, 123] },
      { name: 'Whitney', place: 'Doublonville', type: 'Normal', badge: 'Badge Plaine', team: [35, 241] },
      { name: 'Morty', place: 'Rosalia', type: 'Spectre', badge: 'Badge Brume', team: [92, 93, 94, 93] },
      { name: 'Chuck', place: 'Irisia', type: 'Combat', badge: 'Badge Tempête', team: [57, 62] },
      { name: 'Jasmine', place: 'Oliville', type: 'Acier', badge: 'Badge Minéral', team: [81, 81, 208] },
      { name: 'Pryce', place: 'Acajou', type: 'Glace', badge: 'Badge Glacier', team: [86, 87, 221] },
      { name: 'Clair', place: 'Ébènelle', type: 'Dragon', badge: 'Badge Dragon', team: [148, 148, 148, 230] },
    ],
    leagueName: 'Ligue Indigo (Plateau Indigo)',
    eliteFour: [
      { name: 'Will', type: 'Psy', team: [178, 124, 103, 80, 178] },
      { name: 'Koga', type: 'Poison', team: [168, 49, 205, 89, 169] },
      { name: 'Bruno', type: 'Combat', team: [237, 106, 107, 95, 68] },
      { name: 'Karen', type: 'Ténèbres', team: [197, 45, 198, 94, 229] },
    ],
    champion: { name: 'Lance', team: [130, 149, 149, 149, 142, 6] },
    color: '#d7a53a',
    mechanic: 'Les Pokémon Ténèbres et Acier, les Œufs et la reproduction, ainsi que les Pokémon chromatiques.',
    dexFirst: 152,
    dexLast: 251,
    differences: [
      { games: 'Or / Argent / Cristal', text: 'Or et Argent ont des Pokémon exclusifs différents ; Cristal ajoute des animations de Pokémon et une histoire centrée sur Suicune.' },
      { games: 'HeartGold / SoulSilver', text: 'Remakes qui ajoutent le Pokéwalker et le Pokémon qui suit le joueur, avec les arènes dans le même ordre que les originaux.' },
    ],
    notes: 'Après la Ligue, on peut remonter à Kanto, affronter ses 8 Arènes puis Red au Mont Argenté.',
  },
  {
    id: 'hoenn',
    name: 'Hoenn',
    generation: 3,
    games: 'Rubis, Saphir, Émeraude · Rubis Oméga, Saphir Alpha',
    inspiration: 'Île de Kyūshū, Japon',
    professor: 'Professeur Seko',
    starters: [252, 255, 258],
    legendaries: [377, 378, 379, 380, 381, 382, 383, 384],
    villains: 'Team Magma et Team Aqua',
    cities: ['Bourg-en-Vol', 'Clémenti-Ville', 'Mérouville', 'Myokara', 'Lavandia', 'Vermilava', 'Cimetronelle', 'Algatia', 'Atalanopolis', 'Éternara'],
    challengeLabel: 'Arènes',
    gyms: [
      { name: 'Roxanne', place: 'Mérouville', type: 'Roche', badge: 'Badge Pierre', team: [74, 74, 299] },
      { name: 'Brawly', place: 'Myokara', type: 'Combat', badge: 'Badge Poing', team: [66, 296] },
      { name: 'Wattson', place: 'Lavandia', type: 'Électrik', badge: 'Badge Dynamo', team: [100, 309, 82, 310] },
      { name: 'Flannery', place: 'Vermilava', type: 'Feu', badge: 'Badge Chaleur', team: [218, 322, 323, 324] },
      { name: 'Norman', place: 'Clémenti-Ville', type: 'Normal', badge: 'Badge Équilibre', team: [288, 289, 289] },
      { name: 'Winona', place: 'Cimetronelle', type: 'Vol', badge: 'Badge Plume', team: [333, 357, 279, 227, 334] },
      { name: 'Tate & Liza', place: 'Algatia', type: 'Psy', badge: 'Badge Esprit', team: [344, 178, 337, 338] },
      { name: 'Wallace', place: 'Atalanopolis', type: 'Eau', badge: 'Badge Pluie', team: [370, 340, 364, 119, 350] },
    ],
    leagueName: 'Ligue Pokémon d’Éternara',
    eliteFour: [
      { name: 'Sidney', type: 'Ténèbres', team: [262, 275, 332, 319, 359] },
      { name: 'Phoebe', type: 'Spectre', team: [356, 354, 302, 354, 356] },
      { name: 'Glacia', type: 'Glace', team: [362, 364, 362, 364, 365] },
      { name: 'Drake', type: 'Dragon', team: [372, 334, 330, 330, 373] },
    ],
    champion: { name: 'Steven Stone (Pierre Rochard)', team: [227, 344, 306, 346, 348, 376] },
    color: '#3b9ad6',
    mechanic: 'Les Talents et les Natures, ainsi que les combats en double.',
    dexFirst: 252,
    dexLast: 386,
    differences: [
      { games: 'Rubis / Saphir', text: 'Équipe Magma (Rubis) contre Équipe Aqua (Saphir) ; Groudon est dans Rubis et Kyogre dans Saphir.' },
      { games: 'Émeraude', text: 'Les deux équipes sont présentes, Rayquaza est la légendaire de couverture et la Zone de Combat est ajoutée.' },
      { games: 'Rubis Oméga / Saphir Alpha', text: 'Remakes qui ajoutent la Méga-évolution et l’épisode Delta ; les arènes sont dans le même ordre.' },
    ],
    notes: 'Équipes tirées d’Émeraude.',
  },
  {
    id: 'sinnoh',
    name: 'Sinnoh',
    generation: 4,
    games: 'Diamant, Perle, Platine · Diamant Étincelant, Perle Scintillante',
    inspiration: 'Île d’Hokkaidō, Japon',
    professor: 'Professeur Sorbier',
    starters: [387, 390, 393],
    legendaries: [480, 481, 482, 483, 484, 487, 491],
    villains: 'Team Galaxie',
    cities: ['Bonaugure', 'Charbourg', 'Vestigion', 'Voilaroc', 'Verchamps', 'Unionpolis', 'Joliberges', 'Frimapic', 'Rivamar'],
    challengeLabel: 'Arènes',
    gyms: [
      { name: 'Roark', place: 'Charbourg', type: 'Roche', badge: 'Badge Charbon', team: [74, 95, 408] },
      { name: 'Gardenia', place: 'Vestigion', type: 'Plante', badge: 'Badge Forêt', team: [420, 421, 407] },
      { name: 'Fantina', place: 'Unionpolis', type: 'Spectre', badge: 'Badge Pavé', team: [426, 94, 429] },
      { name: 'Maylene', place: 'Voilaroc', type: 'Combat', badge: 'Badge Mine', team: [307, 67, 448] },
      { name: 'Crasher Wake', place: 'Verchamps', type: 'Eau', badge: 'Badge Fen', team: [130, 195, 419] },
      { name: 'Byron', place: 'Joliberges', type: 'Acier', badge: 'Badge Relique', team: [436, 208, 411] },
      { name: 'Candice', place: 'Frimapic', type: 'Glace', badge: 'Badge Glacier', team: [459, 215, 308, 460] },
      { name: 'Volkner', place: 'Rivamar', type: 'Électrik', badge: 'Badge Phare', team: [26, 424, 224, 405] },
    ],
    leagueName: 'Ligue Pokémon de Sinnoh',
    eliteFour: [
      { name: 'Aaron', type: 'Insecte', team: [269, 267, 416, 214, 452] },
      { name: 'Bertha', type: 'Sol', team: [195, 185, 76, 340, 450] },
      { name: 'Flint', type: 'Feu', team: [229, 136, 78, 392, 467] },
      { name: 'Lucian', type: 'Psy', team: [122, 196, 437, 65, 475] },
    ],
    champion: { name: 'Cynthia', team: [442, 407, 423, 448, 350, 445] },
    color: '#7c6fd1',
    mechanic: 'La séparation des attaques en physiques et spéciales, ainsi que les échanges et combats en ligne.',
    dexFirst: 387,
    dexLast: 493,
    differences: [
      { games: 'Diamant / Perle', text: 'Équipes de dresseurs identiques ; Dialga est dans Diamant et Palkia dans Perle.' },
      { games: 'Platine', text: 'Ajoute le Monde Distorsion et la forme Alternative de Giratina, avec des équipes d’arène renforcées et la Zone de Combat.' },
      { games: 'Diamant Étincelant / Perle Scintillante', text: 'Remakes fidèles de Diamant et Perle, avec les Grands Souterrains.' },
    ],
    notes: 'Équipes de Diamant/Perle.',
  },
  {
    id: 'unys',
    name: 'Unys',
    generation: 5,
    games: 'Noir, Blanc · Noir 2, Blanc 2',
    inspiration: 'New York, États-Unis',
    professor: 'Professeure Keteleeria',
    starters: [495, 498, 501],
    legendaries: [638, 639, 640, 641, 642, 643, 644, 646],
    villains: 'Team Plasma',
    cities: ['Bourg Nuvéa', 'Ogoesse', 'Maillard', 'Volucité', 'Méanville', 'Port Yoneuve', 'Parsemille', 'Flocombe', 'Janusia'],
    challengeLabel: 'Arènes',
    gyms: [
      { name: 'Cilan / Chili / Cress', place: 'Ogoesse', type: 'Plante, Feu ou Eau', badge: 'Badge Trio', team: [511, 513, 515], note: 'Celui à affronter dépend du starter choisi.' },
      { name: 'Lenora', place: 'Maillard', type: 'Normal', badge: 'Badge Basique', team: [507, 505] },
      { name: 'Burgh', place: 'Volucité', type: 'Insecte', badge: 'Badge Insecte', team: [544, 557, 542] },
      { name: 'Elesa', place: 'Méanville', type: 'Électrik', badge: 'Badge Volt', team: [587, 587, 523] },
      { name: 'Clay', place: 'Port Yoneuve', type: 'Sol', badge: 'Badge Fissure', team: [552, 530, 536] },
      { name: 'Skyla', place: 'Parsemille', type: 'Vol', badge: 'Badge Jet', team: [528, 561, 581] },
      { name: 'Brycen', place: 'Flocombe', type: 'Glace', badge: 'Badge Glacier', team: [583, 615, 614] },
      { name: 'Drayden', place: 'Janusia', type: 'Dragon', badge: 'Badge Légende', team: [611, 621, 612] },
    ],
    leagueName: 'Ligue Pokémon d’Unys',
    eliteFour: [
      { name: 'Shauntal', type: 'Spectre', team: [563, 593, 623, 609] },
      { name: 'Marshal', type: 'Combat', team: [538, 539, 620, 534] },
      { name: 'Grimsley', type: 'Ténèbres', team: [560, 553, 510, 625] },
      { name: 'Caitlin', type: 'Psy', team: [518, 561, 579, 576] },
    ],
    champion: { name: 'Alder', team: [617, 626, 621, 584, 589, 637] },
    color: '#54535c',
    mechanic: 'Les combats en triple et les Capacités cachées, avec des saisons qui changent l’environnement.',
    dexFirst: 494,
    dexLast: 649,
    differences: [
      { games: 'Noir / Blanc', text: 'Zekrom est dans Noir et Reshiram dans Blanc ; l’aventure ne propose que de nouveaux Pokémon avant la fin de l’histoire.' },
      { games: 'Noir 2 / Blanc 2', text: 'Se passent deux ans plus tard : les arènes ne sont pas les mêmes et ne sont pas dans le même ordre que dans Noir et Blanc.' },
    ],
    notes: 'Équipes de Noir/Blanc.',
  },
  {
    id: 'kalos',
    name: 'Kalos',
    generation: 6,
    games: 'X, Y',
    inspiration: 'France',
    professor: 'Professeur Platane',
    starters: [650, 653, 656],
    legendaries: [716, 717, 718],
    villains: 'Team Flare',
    cities: ['Bourg Geon', 'Neuvartault', 'Relifac-le-Haut', 'Yantreizh', 'Port Tempères', 'Illumis', 'Romant-sous-Bois', 'Flusselles', 'Auffrac-les-Congères'],
    challengeLabel: 'Arènes',
    gyms: [
      { name: 'Viola', place: 'Neuvartault', type: 'Insecte', badge: 'Badge Insecte', team: [283, 666] },
      { name: 'Grant', place: 'Relifac-le-Haut', type: 'Roche', badge: 'Badge Paroi', team: [698, 696] },
      { name: 'Korrina', place: 'Yantreizh', type: 'Combat', badge: 'Badge Boxe', team: [619, 67, 701] },
      { name: 'Ramos', place: 'Port Tempères', type: 'Plante', badge: 'Badge Herbe', team: [189, 70, 673] },
      { name: 'Clemont', place: 'Illumis', type: 'Électrik', badge: 'Badge Voltage', team: [587, 82, 695] },
      { name: 'Valerie', place: 'Romant-sous-Bois', type: 'Fée', badge: 'Badge Fée', team: [303, 122, 700] },
      { name: 'Olympia', place: 'Flusselles', type: 'Psy', badge: 'Badge Psy', team: [561, 199, 678] },
      { name: 'Wulfric', place: 'Auffrac-les-Congères', type: 'Glace', badge: 'Badge Iceberg', team: [460, 615, 713] },
    ],
    leagueName: 'Ligue Pokémon de Kalos',
    eliteFour: [
      { name: 'Malva', type: 'Feu', team: [668, 324, 609, 663] },
      { name: 'Siebold', type: 'Eau', team: [693, 130, 121, 689] },
      { name: 'Wikstrom', type: 'Acier', team: [707, 476, 212, 681] },
      { name: 'Drasna', type: 'Dragon', team: [691, 621, 334, 715] },
    ],
    champion: { name: 'Diantha', team: [701, 697, 711, 706, 282] },
    color: '#c94f8a',
    mechanic: 'La Méga-évolution et le type Fée.',
    dexFirst: 650,
    dexLast: 721,
    differences: [
      { games: 'X / Y', text: 'Xerneas est dans X et Yveltal dans Y ; les arènes et la Ligue sont identiques.' },
    ],
  },
  {
    id: 'alola',
    name: 'Alola',
    generation: 7,
    games: 'Soleil, Lune · Ultra-Soleil, Ultra-Lune',
    inspiration: 'Archipel d’Hawaï, États-Unis',
    professor: 'Professeur Kukui',
    starters: [722, 725, 728],
    legendaries: [785, 786, 787, 788, 791, 792],
    villains: 'Team Skull et la Fondation Æther',
    cities: ['Bourg-Feuillage', 'Ho’ohale', 'Ohana', 'Konikoni', 'Malié', 'Village Flottant', 'Jardin d’Ula-Ula'],
    challengeLabel: 'Épreuves et grands kahunas',
    gyms: [
      { name: 'Ilima', place: 'Île Mele-Mele', type: 'Normal', team: [735], note: 'Capitaine. Pokémon Totem : Argouste.' },
      { name: 'Lana', place: 'Île Mele-Mele', type: 'Eau', team: [746], note: 'Capitaine. Pokémon Totem : Wishiwashi.' },
      { name: 'Kiawe', place: 'Île Akala', type: 'Feu', team: [758], note: 'Capitaine. Pokémon Totem : Malamandre.' },
      { name: 'Mallow', place: 'Île Akala', type: 'Plante', team: [754], note: 'Capitaine. Pokémon Totem : Lianaja.' },
      { name: 'Sophocles', place: 'Île Ula-Ula', type: 'Électrik', team: [], note: 'Capitaine.' },
      { name: 'Acerola', place: 'Île Ula-Ula', type: 'Spectre', team: [], note: 'Capitaine.' },
      { name: 'Mina', place: 'Île Poni', type: 'Fée', team: [], note: 'Capitaine.' },
      { name: 'Hala', place: 'Île Mele-Mele', type: 'Combat', team: [], note: 'Grand kahuna.' },
      { name: 'Olivia', place: 'Île Akala', type: 'Roche', team: [], note: 'Grande kahuna.' },
      { name: 'Nanu', place: 'Île Ula-Ula', type: 'Ténèbres', team: [], note: 'Grand kahuna.' },
      { name: 'Hapu', place: 'Île Poni', type: 'Sol', team: [], note: 'Grande kahuna.' },
    ],
    leagueName: 'Ligue Pokémon d’Alola',
    eliteFour: [
      { name: 'Hala', type: 'Combat', team: [297, 57, 760, 62, 740], note: 'Soleil / Lune. Dans Ultra-Soleil / Ultra-Lune, il est remplacé par Molayne.' },
      { name: 'Molayne', type: 'Acier', team: [707, 625, 462, 376, 51], note: 'Ultra-Soleil / Ultra-Lune uniquement.' },
      { name: 'Olivia', type: 'Roche', team: [369, 703, 476, 745, 76] },
      { name: 'Acerola', type: 'Spectre', team: [302, 426, 781, 478, 770, 778] },
      { name: 'Kahili', type: 'Vol', team: [227, 169, 741, 630, 733, 701] },
    ],
    champion: { name: 'Kukui', team: [745, 628, 462, 143, 38], note: 'Champion dans Soleil / Lune. Le dernier Pokémon dépend du starter.' },
    altChampion: { name: 'Hau', team: [26, 128, 715, 740, 38], note: 'Champion dans Ultra-Soleil / Ultra-Lune. Le dernier Pokémon dépend du starter.' },
    color: '#2fb59b',
    mechanic: 'Les Capacités Z et les formes d’Alola.',
    dexFirst: 722,
    dexLast: 809,
    differences: [
      { games: 'Soleil / Lune', text: 'Solgaleo est dans Soleil et Lunala dans Lune ; la Ligue compte Hala, Olivia, Acerola et Kahili, avec Kukui comme champion.' },
      { games: 'Ultra-Soleil / Ultra-Lune', text: 'Molayne remplace Hala à la Ligue et Hau devient champion ; l’histoire change, avec Necrozma et de nouvelles Capacités Z.' },
    ],
    notes: 'Pas d’Arènes : chaque Épreuve se conclut par un duel contre un Pokémon Totem. La Ligue est construite après le Défi des Îles.',
  },
  {
    id: 'galar',
    name: 'Galar',
    generation: 8,
    games: 'Épée, Bouclier',
    inspiration: 'Royaume-Uni',
    professor: 'Professeure Magnolia',
    starters: [810, 813, 816],
    legendaries: [888, 889, 890],
    villains: 'Team Yell et Macro Cosmos',
    cities: ['Bourg Chêne', 'Motorby', 'Greenbury', 'Skifford', 'Old Chister', 'Corrifey', 'Ludester', 'Smashings', 'Kickenham', 'Winscor'],
    challengeLabel: 'Arènes (Défi des Arènes)',
    gyms: [
      { name: 'Milo', place: 'Greenbury', type: 'Plante', team: [829, 830] },
      { name: 'Nessa', place: 'Skifford', type: 'Eau', team: [118, 846, 834] },
      { name: 'Kabu', place: 'Motorby', type: 'Feu', team: [38, 59, 851] },
      {
        name: 'Bea', place: 'Old Chister', type: 'Combat', team: [237, 675, 865, 68], note: 'Version Épée.',
        alt: { name: 'Allister', place: 'Old Chister', type: 'Spectre', team: [562, 778, 864, 94], note: 'Version Bouclier.' },
      },
      { name: 'Opal', place: 'Corrifey', type: 'Fée', team: [110, 303, 468, 869] },
      {
        name: 'Gordie', place: 'Ludester', type: 'Roche', team: [689, 213, 874, 839], note: 'Version Épée.',
        alt: { name: 'Melony', place: 'Ludester', type: 'Glace', team: [872, 873, 555, 131, 875], note: 'Version Bouclier.' },
      },
      { name: 'Piers', place: 'Smashings', type: 'Ténèbres', team: [560, 687, 435, 862] },
      { name: 'Raihan', place: 'Kickenham', type: 'Dragon', team: [526, 330, 844, 884] },
    ],
    leagueName: 'Tournoi des Champions',
    eliteFour: [],
    champion: { name: 'Leon', team: [681, 887, 612, 537, 866, 6] },
    color: '#4a64d8',
    mechanic: 'Le Dynamax et le Gigamax.',
    dexFirst: 810,
    dexLast: 905,
    differences: [
      { games: 'Épée / Bouclier', text: 'Dans Épée, l’arène d’Old Chister est celle de Bea (Combat) et celle de Ludester celle de Gordie (Roche) ; dans Bouclier, ce sont Allister (Spectre) et Melony (Glace).' },
    ],
    notes: 'Pas de Conseil des 4 : la Ligue est un tournoi à élimination directe réunissant les Champions d’Arène, avant le duel contre Leon.',
  },
  {
    id: 'paldea',
    name: 'Paldea',
    generation: 9,
    games: 'Écarlate, Violet',
    inspiration: 'Péninsule Ibérique (Espagne, Portugal)',
    professor: 'Professeure Olim (Écarlate) / Professeur Turum (Violet)',
    starters: [906, 909, 912],
    legendaries: [1007, 1008],
    villains: 'Team Star',
    cities: ['Mesaledo', 'Cortondo', 'Artazon', 'Levincia', 'Cascarrafa', 'Medali', 'Montenevera', 'Alfornada', 'Glaseado'],
    challengeLabel: 'Arènes (ordre libre)',
    gyms: [
      { name: 'Katy', place: 'Cortondo', type: 'Insecte', team: [919, 917, 216] },
      { name: 'Brassius', place: 'Artazon', type: 'Plante', team: [548, 928, 185] },
      { name: 'Iono', place: 'Levincia', type: 'Électrik', team: [940, 939, 404, 429] },
      { name: 'Kofu', place: 'Cascarrafa', type: 'Eau', team: [976, 961, 740] },
      { name: 'Larry', place: 'Medali', type: 'Normal', team: [982, 397, 775] },
      { name: 'Ryme', place: 'Montenevera', type: 'Spectre', team: [849, 972, 778, 354] },
      { name: 'Tulip', place: 'Alfornada', type: 'Psy', team: [981, 282, 956, 671] },
      { name: 'Grusha', place: 'Glaseado', type: 'Glace', team: [873, 975, 614, 334] },
    ],
    leagueName: 'Ligue Pokémon de Paldea',
    eliteFour: [
      { name: 'Rika', type: 'Sol', team: [340, 323, 232, 51, 980] },
      { name: 'Poppy', type: 'Acier', team: [879, 462, 437, 823, 959] },
      { name: 'Larry', type: 'Vol', team: [357, 398, 334, 973] },
      { name: 'Hassel', type: 'Dragon', team: [715, 691, 842, 612, 998] },
    ],
    champion: { name: 'Geeta', team: [956, 673, 976, 713, 983, 970] },
    color: '#e08a2e',
    mechanic: 'La Téracristallisation.',
    dexFirst: 906,
    dexLast: 1025,
    differences: [
      { games: 'Écarlate / Violet', text: 'Koraidon et Miraidon, les Pokémon exclusifs, le professeur et l’uniforme scolaire diffèrent ; les arènes sont identiques.' },
    ],
    notes: 'Trois aventures : Chemin des Champions, Chasse aux Étoiles (Team Star) et Trésor Caché d’Area Zero.',
  },
];
