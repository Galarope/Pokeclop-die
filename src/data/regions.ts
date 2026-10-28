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
      { name: 'Pierre', place: 'Argenta', type: 'Roche', badge: 'Badge Roche', team: [74, 95], note: 'Identique dans tous les jeux (Racaillou, Onix).' },
      { name: 'Ondine', place: 'Azuria', type: 'Eau', badge: 'Badge Cascade', team: [120, 121], note: 'Rouge / Bleu / Jaune / Rouge Feu / Vert Feuille.',
        alt: { name: 'Ondine', place: 'Azuria', type: 'Eau', badge: 'Badge Cascade', team: [54, 121], note: 'Let’s Go Pikachu / Évoli : Psykokwak remplace Stari.' },
      },
      { name: 'Major Bob', place: 'Carmin sur Mer', type: 'Électrik', badge: 'Badge Foudre', team: [100, 25, 26], note: 'Rouge / Bleu / Rouge Feu / Vert Feuille.',
        alt: { name: 'Major Bob', place: 'Carmin sur Mer', type: 'Électrik', badge: 'Badge Foudre', team: [26], note: 'Jaune : un seul Pokémon, Raichu.',
          alt: { name: 'Major Bob', place: 'Carmin sur Mer', type: 'Électrik', badge: 'Badge Foudre', team: [100, 81, 26], note: 'Let’s Go Pikachu / Évoli : Voltorb, Magnéti, Raichu.' },
        },
      },
      { name: 'Érika', place: 'Céladopole', type: 'Plante', badge: 'Badge Prisme', team: [71, 114, 45], note: 'Rouge / Bleu / Rouge Feu / Vert Feuille.',
        alt: { name: 'Érika', place: 'Céladopole', type: 'Plante', badge: 'Badge Prisme', team: [114, 70, 44], note: 'Jaune : Saquedeneu, Boustiflor, Ortide (pas de Empiflor/Rafflesia).',
          alt: { name: 'Érika', place: 'Céladopole', type: 'Plante', badge: 'Badge Prisme', team: [114, 70, 45], note: 'Let’s Go Pikachu / Évoli : Saquedeneu, Boustiflor, Rafflesia.' },
        },
      },
      { name: 'Koga', place: 'Parmanie', type: 'Poison', badge: 'Badge Âme', team: [109, 89, 109, 110], note: 'Rouge / Bleu / Rouge Feu / Vert Feuille.',
        alt: { name: 'Koga', place: 'Parmanie', type: 'Poison', badge: 'Badge Âme', team: [48, 48, 48, 49], note: 'Jaune : trois Mimitoss et un Aéromite.',
          alt: { name: 'Koga', place: 'Parmanie', type: 'Poison', badge: 'Badge Âme', team: [110, 89, 42, 49], note: 'Let’s Go Pikachu / Évoli : Smogogo, Grotadmorv, Nosferalto, Aéromite.' },
        },
      },
      { name: 'Morgane', place: 'Safrania', type: 'Psy', badge: 'Badge Marais', team: [64, 122, 49, 65], note: 'Rouge / Bleu / Rouge Feu / Vert Feuille.',
        alt: { name: 'Morgane', place: 'Safrania', type: 'Psy', badge: 'Badge Marais', team: [63, 64, 65], note: 'Jaune : Abra, Kadabra, Alakazam.',
          alt: { name: 'Morgane', place: 'Safrania', type: 'Psy', badge: 'Badge Marais', team: [122, 80, 124, 65], note: 'Let’s Go Pikachu / Évoli : M. Mime, Flagadoss, Lippoutou, Alakazam.' },
        },
      },
      { name: 'Auguste', place: 'Cramois’Île', type: 'Feu', badge: 'Badge Volcan', team: [58, 77, 78, 59], note: 'Rouge / Bleu / Rouge Feu / Vert Feuille.',
        alt: { name: 'Auguste', place: 'Cramois’Île', type: 'Feu', badge: 'Badge Volcan', team: [38, 78, 59], note: 'Jaune : Feunard, Galopa, Arcanin.',
          alt: { name: 'Auguste', place: 'Cramois’Île', type: 'Feu', badge: 'Badge Volcan', team: [126, 78, 38, 59], note: 'Let’s Go Pikachu / Évoli : Magmar, Galopa, Feunard, Arcanin.' },
        },
      },
      { name: 'Giovanni', place: 'Jadielle', type: 'Sol', badge: 'Badge Terre', team: [111, 51, 31, 34, 112], note: 'Rouge / Bleu / Rouge Feu / Vert Feuille.',
        alt: { name: 'Giovanni', place: 'Jadielle', type: 'Sol', badge: 'Badge Terre', team: [51, 53, 31, 34, 112], note: 'Jaune : Triopikeur, Persian, Nidoqueen, Nidoking, Rhinoféros.',
          alt: { name: 'Giovanni', place: 'Jadielle', type: 'Sol', badge: 'Badge Terre', team: [51, 31, 34, 112], note: 'Let’s Go Pikachu / Évoli : quatre Pokémon seulement (Triopikeur, Nidoqueen, Nidoking, Rhinoféros).' },
        },
      },
    ],
    leagueName: 'Ligue Indigo',
    eliteFour: [
      { name: 'Olga (Lorelei)', type: 'Glace', team: [87, 91, 80, 124, 131], note: 'Identique dans tous les jeux (seul l’ordre des Pokémon change dans Let’s Go).' },
      { name: 'Aldo (Bruno)', type: 'Combat', team: [95, 107, 106, 95, 68], note: 'Rouge / Bleu / Jaune / Rouge Feu / Vert Feuille.',
        alt: { name: 'Aldo (Bruno)', type: 'Combat', team: [95, 107, 106, 62, 68], note: 'Let’s Go Pikachu / Évoli : Tartard remplace le second Onix.' },
      },
      { name: 'Agatha', type: 'Spectre', team: [94, 42, 93, 24, 94], note: 'Rouge / Bleu / Jaune / Rouge Feu / Vert Feuille.',
        alt: { name: 'Agatha', type: 'Spectre', team: [24, 94, 42, 110, 94], note: 'Let’s Go Pikachu / Évoli : Arbok, Ectoplasma, Nosferalto, Smogogo, Ectoplasma (pas de Spectrum).' },
      },
      { name: 'Peter (Lance)', type: 'Dragon', team: [130, 148, 148, 142, 149], note: 'Rouge / Bleu / Jaune / Rouge Feu / Vert Feuille.',
        alt: { name: 'Peter (Lance)', type: 'Dragon', team: [117, 142, 130, 6, 149], note: 'Let’s Go Pikachu / Évoli : Hypocéan, Ptéra, Léviator, Dracaufeu, Dracolosse.' },
      },
    ],
    champion: {
      name: 'Blue', team: [18, 65, 112, 103, 130, 6],
      note: 'Rouge / Bleu / Rouge Feu / Vert Feuille. Roucarnage, Alakazam et Rhinoféros sont fixes ; les trois autres dépendent du starter choisi : Bulbizarre → Noadkoko, Léviator, Dracaufeu (équipe affichée) ; Salamèche → Arcanin, Noadkoko, Tortank ; Carapuce → Léviator, Arcanin, Florizarre.',
      alt: {
        name: 'Blue', team: [28, 65, 103, 38, 82, 134],
        note: 'Jaune : Sablaireau, Alakazam et Noadkoko sont fixes ; les trois derniers varient et se terminent par Aquali (équipe affichée), Voltali ou Pyroli (Feunard/Magnéton, Crustabri/Feunard ou Magnéton/Crustabri).',
        alt: {
          name: 'Trace', team: [18, 45, 105, 78, 80, 135],
          note: 'Let’s Go Pikachu / Évoli : Trace remplace Blue comme Champion. Let’s Go Pikachu : Voltali en dernier (équipe affichée) ; Let’s Go Évoli : Raichu à la place de Voltali.',
        },
      },
    },
    color: '#e0533d',
    mechanic: 'Les types et les combats au tour par tour, ainsi que les 151 premiers Pokémon.',
    dexFirst: 1,
    dexLast: 151,
    differences: [
      { games: 'Rouge / Bleu / Jaune', text: 'Rouge et Bleu ont des Pokémon exclusifs différents ; Jaune suit l’anime (Pikachu de départ). Ses dresseurs changent : Major Bob n’a qu’un Raichu, Érika, Koga, Morgane, Auguste et Giovanni ont d’autres équipes, Blue a un Sablaireau et un dernier Pokémon issu d’Évoli. Les équipes de Pierre, Ondine et du Conseil des 4 sont identiques à celles de Rouge / Bleu.' },
      { games: 'Rouge Feu / Vert Feuille', text: 'Remakes avec les mêmes équipes d’Arènes, de Conseil des 4 et de Champion que Rouge / Bleu (niveaux un peu plus bas, ex. Peter 56 au lieu de 58), mais avec les îles Sevii, les Talents et les Natures. Après la Ligue, le Conseil des 4 et Blue peuvent être réaffrontés avec des équipes de niveau 63 à 75 qui changent (Mammochon, Steelix, Nosferalto, Kingdra, Scarhino, Tyranocif…).' },
      { games: 'Let’s Go Pikachu / Évoli', text: 'Capture à la manière de Pokémon GO, seuls les 151 premiers Pokémon plus Meltan et Melmetal (et formes d’Alola). Les 8 Arènes restent dans le même ordre, mais 7 équipes changent (seul Pierre est identique : Ondine, Major Bob, Érika, Koga, Morgane, Auguste et Giovanni). Aldo, Agatha et Peter ont de nouvelles équipes, Olga est identique, et le Champion est Trace (rival) et non Blue.' },
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
  { name: 'Falkner', place: 'Mauville', type: 'Vol', badge: 'Badge Zéphyr', team: [16, 17], note: 'Même équipe dans Or / Argent / Cristal et HeartGold / SoulSilver (niveaux plus élevés dans HGSS).' },
  {
    name: 'Bugsy', place: 'Écorcia', type: 'Insecte', badge: 'Badge Essaim', team: [11, 14, 123], note: 'Or / Argent / Cristal.',
    alt: { name: 'Bugsy', place: 'Écorcia', type: 'Insecte', badge: 'Badge Essaim', team: [123, 14, 11], note: 'HeartGold / SoulSilver : Insécateur ouvre le combat.' },
  },
  { name: 'Whitney', place: 'Doublonville', type: 'Normal', badge: 'Badge Plaine', team: [35, 241], note: 'Même équipe dans Or / Argent / Cristal et HeartGold / SoulSilver (niveaux plus élevés dans HGSS).' },
  { name: 'Morty', place: 'Rosalia', type: 'Spectre', badge: 'Badge Brume', team: [92, 93, 94, 93], note: 'Même équipe dans Or / Argent / Cristal et HeartGold / SoulSilver.' },
  { name: 'Chuck', place: 'Irisia', type: 'Combat', badge: 'Badge Tempête', team: [57, 62], note: 'Même équipe dans Or / Argent / Cristal et HeartGold / SoulSilver (niveaux plus élevés dans HGSS).' },
  { name: 'Jasmine', place: 'Oliville', type: 'Acier', badge: 'Badge Minéral', team: [81, 81, 208], note: 'Même équipe dans Or / Argent / Cristal et HeartGold / SoulSilver.' },
  { name: 'Pryce', place: 'Acajou', type: 'Glace', badge: 'Badge Glacier', team: [86, 87, 221], note: 'Même équipe dans Or / Argent / Cristal et HeartGold / SoulSilver (niveaux plus élevés dans HGSS).' },
  {
    name: 'Clair', place: 'Ébènelle', type: 'Dragon', badge: 'Badge Dragon', team: [148, 148, 148, 230], note: 'Or / Argent / Cristal.',
    alt: { name: 'Clair', place: 'Ébènelle', type: 'Dragon', badge: 'Badge Dragon', team: [130, 148, 148, 230], note: 'HeartGold / SoulSilver : un Léviator remplace le premier Draco.' },
  },

  // Arènes de Kanto : accessibles après la Ligue dans TOUS les jeux de la 2e génération (OA/Cristal et HGSS).
  { name: 'Pierre', place: 'Argenta (Kanto)', type: 'Roche', badge: 'Badge Roche', team: [75, 111, 139, 95, 141], note: 'Arène de Kanto, disponible après la Ligue. Mêmes espèces dans Or / Argent / Cristal et HeartGold / SoulSilver (niveaux bien plus élevés dans HGSS).' },
  { name: 'Ondine', place: 'Azuria (Kanto)', type: 'Eau', badge: 'Badge Cascade', team: [55, 195, 131, 121], note: 'Arène de Kanto, disponible après la Ligue. Mêmes espèces dans Or / Argent / Cristal et HeartGold / SoulSilver.' },
  { name: 'Major Bob', place: 'Carmin sur Mer (Kanto)', type: 'Électrik', badge: 'Badge Foudre', team: [26, 101, 82, 101, 125], note: 'Arène de Kanto, disponible après la Ligue. Mêmes espèces dans Or / Argent / Cristal et HeartGold / SoulSilver.' },
  {
    name: 'Érika', place: 'Céladopole (Kanto)', type: 'Plante', badge: 'Badge Prisme', team: [114, 189, 71, 182], note: 'Arène de Kanto, disponible après la Ligue. Or / Argent / Cristal.',
    alt: { name: 'Érika', place: 'Céladopole (Kanto)', type: 'Plante', badge: 'Badge Prisme', team: [189, 114, 71, 182], note: 'Arène de Kanto. HeartGold / SoulSilver : Floravol ouvre le combat.' },
  },
  {
    name: 'Jeannine', place: 'Parmanie (Kanto)', type: 'Poison', badge: 'Badge Âme', team: [169, 110, 110, 168, 49], note: 'Arène de Kanto, disponible après la Ligue. Or / Argent / Cristal.',
    alt: { name: 'Jeannine', place: 'Parmanie (Kanto)', type: 'Poison', badge: 'Badge Âme', team: [169, 110, 168, 168, 49], note: 'Arène de Kanto. HeartGold / SoulSilver : un seul Smogogo et deux Migalos.' },
  },
  { name: 'Morgane', place: 'Safrania (Kanto)', type: 'Psy', badge: 'Badge Marais', team: [196, 122, 65], note: 'Arène de Kanto, disponible après la Ligue. Mêmes espèces dans Or / Argent / Cristal et HeartGold / SoulSilver.' },
  { name: 'Auguste', place: 'Cramois’Île (Kanto)', type: 'Feu', badge: 'Badge Volcan', team: [219, 126, 78], note: 'Arène de Kanto, disponible après la Ligue. Mêmes espèces dans Or / Argent / Cristal et HeartGold / SoulSilver.' },
  {
    name: 'Blue', place: 'Jadielle (Kanto)', type: 'Normal', badge: 'Badge Terre', team: [18, 65, 112, 130, 103, 59], note: 'Arène de Kanto, disponible après la Ligue. Or / Argent / Cristal.',
    alt: { name: 'Blue', place: 'Jadielle (Kanto)', type: 'Normal', badge: 'Badge Terre', team: [103, 59, 112, 130, 68, 18], note: 'Arène de Kanto. HeartGold / SoulSilver : Alakazam est remplacé par Mackogneur et l’ordre change.' },
  },
],
    leagueName: 'Ligue Indigo (Plateau Indigo)',
    eliteFour: [
  { name: 'Will', type: 'Psy', team: [178, 124, 103, 80, 178], note: 'Même équipe dans Or / Argent / Cristal et HeartGold / SoulSilver.' },
  { name: 'Koga', type: 'Poison', team: [168, 49, 205, 89, 169], note: 'Même équipe dans Or / Argent / Cristal et HeartGold / SoulSilver.' },
  { name: 'Bruno', type: 'Combat', team: [237, 106, 107, 95, 68], note: 'Même équipe dans Or / Argent / Cristal et HeartGold / SoulSilver.' },
  { name: 'Karen', type: 'Ténèbres', team: [197, 45, 94, 198, 229], note: 'Même équipe dans Or / Argent / Cristal et HeartGold / SoulSilver.' },
],
    champion: { name: 'Lance', team: [130, 149, 149, 142, 6, 149], note: 'Même équipe dans Or / Argent / Cristal et HeartGold / SoulSilver (niveaux plus élevés dans HGSS).' },
    color: '#d7a53a',
    mechanic: 'Les Pokémon Ténèbres et Acier, les Œufs et la reproduction, ainsi que les Pokémon chromatiques.',
    dexFirst: 152,
    dexLast: 251,
    differences: [
  { games: 'Or / Argent / Cristal', text: 'Or et Argent ont des Pokémon exclusifs différents ; Cristal ajoute des animations de Pokémon et une histoire centrée sur Suicune. Les équipes des Champions d’Arène, du Conseil des 4 et de Lance sont identiques dans les trois versions.' },
  { games: 'HeartGold / SoulSilver', text: 'Remakes qui ajoutent le Pokéwalker et le Pokémon qui suit le joueur. Les niveaux des Champions d’Arène sont plus élevés ; Bugsy, Clair, Érika, Jeannine et Blue ont des équipes modifiées. Le Conseil des 4 et Lance gardent les mêmes Pokémon.' },
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
  {
    name: 'Roxanne', place: 'Mérouville', type: 'Roche', badge: 'Badge Pierre', team: [74, 299], note: 'Rubis / Saphir et Rubis Oméga / Saphir Alpha.',
    alt: { name: 'Roxanne', place: 'Mérouville', type: 'Roche', badge: 'Badge Pierre', team: [74, 74, 299], note: 'Émeraude.' },
  },
  {
    name: 'Bastien', place: 'Myokara', type: 'Combat', badge: 'Badge Poing', team: [66, 296], note: 'Rubis / Saphir et Rubis Oméga / Saphir Alpha.',
    alt: { name: 'Bastien', place: 'Myokara', type: 'Combat', badge: 'Badge Poing', team: [66, 307, 296], note: 'Émeraude.' },
  },
  {
    name: 'Voltère', place: 'Lavandia', type: 'Électrik', badge: 'Badge Dynamo', team: [81, 100, 82], note: 'Rubis / Saphir et Rubis Oméga / Saphir Alpha.',
    alt: { name: 'Voltère', place: 'Lavandia', type: 'Électrik', badge: 'Badge Dynamo', team: [100, 82, 309, 310], note: 'Émeraude.' },
  },
  {
    name: 'Adriane', place: 'Vermilava', type: 'Feu', badge: 'Badge Chaleur', team: [218, 218, 324], note: 'Rubis / Saphir.',
    alt: {
      name: 'Adriane', place: 'Vermilava', type: 'Feu', badge: 'Badge Chaleur', team: [322, 218, 323, 324], note: 'Émeraude.',
      alt: { name: 'Adriane', place: 'Vermilava', type: 'Feu', badge: 'Badge Chaleur', team: [218, 322, 324], note: 'Rubis Oméga / Saphir Alpha.' },
    },
  },
  {
    name: 'Norman', place: 'Clémenti-Ville', type: 'Normal', badge: 'Badge Équilibre', team: [289, 288, 289], note: 'Rubis / Saphir et Rubis Oméga / Saphir Alpha.',
    alt: { name: 'Norman', place: 'Clémenti-Ville', type: 'Normal', badge: 'Badge Équilibre', team: [327, 288, 264, 289], note: 'Émeraude.' },
  },
  {
    name: 'Alizée', place: 'Cimetronelle', type: 'Vol', badge: 'Badge Plume', team: [277, 279, 227, 334], note: 'Rubis / Saphir et Rubis Oméga / Saphir Alpha.',
    alt: { name: 'Alizée', place: 'Cimetronelle', type: 'Vol', badge: 'Badge Plume', team: [333, 357, 279, 227, 334], note: 'Émeraude.' },
  },
  {
    name: 'Tatia et Lévy', place: 'Algatia', type: 'Psy', badge: 'Badge Esprit', team: [337, 338], note: 'Rubis / Saphir et Rubis Oméga / Saphir Alpha.',
    alt: { name: 'Tatia et Lévy', place: 'Algatia', type: 'Psy', badge: 'Badge Esprit', team: [344, 178, 337, 338], note: 'Émeraude.' },
  },
  {
    name: 'Marc', place: 'Atalanopolis', type: 'Eau', badge: 'Badge Pluie', team: [370, 340, 364, 119, 350], note: 'Rubis / Saphir.',
    alt: {
      name: 'Juan', place: 'Atalanopolis', type: 'Eau', badge: 'Badge Pluie', team: [370, 340, 364, 342, 230], note: 'Émeraude : Juan remplace Marc, devenu champion de la Ligue.',
      alt: { name: 'Marc', place: 'Atalanopolis', type: 'Eau', badge: 'Badge Pluie', team: [370, 340, 364, 119, 350], note: 'Rubis Oméga / Saphir Alpha.' },
    },
  },
],
    leagueName: 'Ligue Pokémon d’Éternara',
    eliteFour: [
  {
    name: 'Damien', type: 'Ténèbres', team: [262, 332, 275, 319, 359], note: 'Rubis / Saphir et Rubis Oméga / Saphir Alpha.',
    alt: { name: 'Damien', type: 'Ténèbres', team: [262, 332, 275, 342, 359], note: 'Émeraude.' },
  },
  {
    name: 'Spectra', type: 'Spectre', team: [356, 354, 354, 302, 356], note: 'Rubis / Saphir et Émeraude.',
    alt: { name: 'Spectra', type: 'Spectre', team: [356, 354, 302, 354, 477], note: 'Rubis Oméga / Saphir Alpha.' },
  },
  {
    name: 'Glacia', type: 'Glace', team: [362, 364, 362, 364, 365], note: 'Rubis / Saphir et Émeraude.',
    alt: { name: 'Glacia', type: 'Glace', team: [362, 478, 362, 478, 365], note: 'Rubis Oméga / Saphir Alpha.' },
  },
  {
    name: 'Aragon', type: 'Dragon', team: [372, 334, 330, 330, 373], note: 'Rubis / Saphir.',
    alt: {
      name: 'Aragon', type: 'Dragon', team: [372, 334, 230, 330, 373], note: 'Émeraude.',
      alt: { name: 'Aragon', type: 'Dragon', team: [334, 330, 230, 330, 373], note: 'Rubis Oméga / Saphir Alpha.' },
    },
  },
],
    champion: {
  name: 'Pierre Rochard', type: 'Acier', team: [227, 346, 344, 348, 306, 376], note: 'Rubis / Saphir et Rubis Oméga / Saphir Alpha (mêmes Pokémon, niveaux plus élevés dans ORAS ; Métalosse peut y Méga-évoluer).',
  alt: { name: 'Marc', type: 'Eau', team: [321, 73, 340, 272, 130, 350], note: 'Émeraude : Marc remplace Pierre Rochard comme champion de la Ligue.' },
},
    color: '#3b9ad6',
    mechanic: 'Les Talents et les Natures, ainsi que les combats en double.',
    dexFirst: 252,
    dexLast: 386,
    differences: [
  { games: 'Rubis / Saphir', text: 'Équipe Magma (Rubis) contre Équipe Aqua (Saphir) ; Groudon est dans Rubis et Kyogre dans Saphir. Marc est champion d’arène à Atalanopolis et Pierre Rochard champion de la Ligue.' },
  { games: 'Émeraude', text: 'Rayquaza est la légendaire de couverture et la Zone de Combat est ajoutée. Juan tient l’arène d’Atalanopolis et Marc devient champion de la Ligue ; sept arènes sur huit changent d’équipe (Mérouville, Myokara, Lavandia, Vermilava, Clémenti-Ville, Cimetronelle, Algatia) et l’ordre des arènes reste le même ; Damien, Aragon et le champion changent aussi.' },
  { games: 'Rubis Oméga / Saphir Alpha', text: 'Remakes qui ajoutent la Méga-évolution et l’épisode Delta ; mêmes arènes et ordre que Rubis / Saphir (niveaux plus hauts), Marc reprend l’arène d’Atalanopolis et Pierre Rochard le titre de champion. Spectra et Glacia reçoivent un Pokémon de Génération IV (Noctunoir, Momartik) et Aragon perd son Draco ; les équipes d’arène sont celles de Rubis / Saphir (Flannery reçoit toutefois un Chamallot).' },
],
    notes: 'Version de référence : Rubis / Saphir ; Émeraude et Rubis Oméga / Saphir Alpha sont indiquées en comparaison.',
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
  { name: 'Roark', place: 'Charbourg', type: 'Roche', badge: 'Badge Charbon', team: [74, 95, 408], note: 'Arène n°1. Identique dans tous les jeux (niveaux 12-14).' },
  {
    name: 'Gardenia', place: 'Vestigion', type: 'Plante', badge: 'Badge Forêt', team: [420, 387, 407], note: 'Arène n°2. Diamant / Perle.',
    alt: { name: 'Gardenia', place: 'Vestigion', type: 'Plante', badge: 'Badge Forêt', team: [387, 421, 407], note: 'Arène n°2. Platine.' },
  },
  {
    name: 'Maylene', place: 'Voilaroc', type: 'Combat', badge: 'Badge Pavé', team: [307, 67, 448], note: 'Arène n°3 dans Diamant / Perle.',
    alt: { name: 'Fantina', place: 'Unionpolis', type: 'Spectre', badge: 'Badge Fantôme', team: [355, 93, 429], note: 'Arène n°3 dans Platine : l’ordre des arènes est différent (Fantina avant Maylene).' },
  },
  {
    name: 'Crasher Wake', place: 'Verchamps', type: 'Eau', badge: 'Badge Palustre', team: [130, 195, 419], note: 'Arène n°4 dans Diamant / Perle.',
    alt: { name: 'Maylene', place: 'Voilaroc', type: 'Combat', badge: 'Badge Pavé', team: [307, 67, 448], note: 'Arène n°4 dans Platine (niveaux 28-32).' },
  },
  {
    name: 'Fantina', place: 'Unionpolis', type: 'Spectre', badge: 'Badge Fantôme', team: [426, 94, 429], note: 'Arène n°5 dans Diamant / Perle.',
    alt: { name: 'Crasher Wake', place: 'Verchamps', type: 'Eau', badge: 'Badge Palustre', team: [130, 195, 419], note: 'Arène n°5 dans Platine (niveaux 33-37).' },
  },
  {
    name: 'Byron', place: 'Joliberges', type: 'Acier', badge: 'Badge Mine', team: [436, 208, 411], note: 'Arène n°6. Diamant / Perle.',
    alt: { name: 'Byron', place: 'Joliberges', type: 'Acier', badge: 'Badge Mine', team: [82, 208, 411], note: 'Arène n°6. Platine.' },
  },
  {
    name: 'Candice', place: 'Frimapic', type: 'Glace', badge: 'Badge Glaçon', team: [459, 215, 308, 460], note: 'Arène n°7. Diamant / Perle.',
    alt: { name: 'Candice', place: 'Frimapic', type: 'Glace', badge: 'Badge Glaçon', team: [215, 221, 460, 478], note: 'Arène n°7. Platine.' },
  },
  {
    name: 'Volkner', place: 'Rivamar', type: 'Électrik', badge: 'Badge Phare', team: [26, 424, 224, 405], note: 'Arène n°8. Diamant / Perle.',
    alt: { name: 'Volkner', place: 'Rivamar', type: 'Électrik', badge: 'Badge Phare', team: [135, 26, 405, 466], note: 'Arène n°8. Platine.' },
  },
],
    leagueName: 'Ligue Pokémon de Sinnoh',
    eliteFour: [
  {
    name: 'Aaron', type: 'Insecte', team: [269, 267, 416, 214, 452], note: 'Diamant / Perle.',
    alt: { name: 'Aaron', type: 'Insecte', team: [469, 212, 416, 214, 452], note: 'Platine (premier combat).' },
  },
  {
    name: 'Bertha', type: 'Sol', team: [195, 185, 76, 340, 450], note: 'Diamant / Perle.',
    alt: { name: 'Bertha', type: 'Sol', team: [340, 472, 450, 76, 464], note: 'Platine (premier combat).' },
  },
  {
    name: 'Flint', type: 'Feu', team: [78, 208, 426, 428, 392], note: 'Diamant / Perle.',
    alt: { name: 'Flint', type: 'Feu', team: [229, 136, 78, 392, 467], note: 'Platine (premier combat).' },
  },
  {
    name: 'Lucian', type: 'Psy', team: [122, 203, 308, 65, 437], note: 'Diamant / Perle.',
    alt: { name: 'Lucian', type: 'Psy', team: [122, 196, 437, 65, 475], note: 'Platine (premier combat).' },
  },
],
    champion: {
  name: 'Cynthia', team: [442, 407, 423, 448, 350, 445], note: 'Diamant / Perle.',
  alt: { name: 'Cynthia', team: [442, 407, 468, 448, 350, 445], note: 'Platine (premier combat).' },
},
    color: '#7c6fd1',
    mechanic: 'La séparation des attaques en physiques et spéciales, ainsi que les échanges et combats en ligne.',
    dexFirst: 387,
    dexLast: 493,
    differences: [
  { games: 'Diamant / Perle', text: 'Dialga est dans Diamant et Palkia dans Perle. Ordre des arènes : Charbourg, Vestigion, Voilaroc, Verchamps, Unionpolis, Joliberges, Frimapic, Rivamar.' },
  { games: 'Platine', text: 'Giratina (forme Alternative) et le Monde Distorsion. Les arènes n°3 à n°5 sont dans un autre ordre (Unionpolis, Voilaroc, Verchamps) ; les équipes de Gardenia, Fantina, Byron, Candice, Volkner, du Conseil des 4 et de Cynthia (Togekiss) changent, et les niveaux sont plus bas qu’en Diamant / Perle pour la Ligue mais plus élevés pour les arènes.' },
  { games: 'Diamant Étincelant / Perle Scintillante', text: 'Remakes : mêmes équipes et même ordre d’arènes que Diamant / Perle (vérifié arène par arène, Conseil des 4 et Cynthia). Ajoutent les Grands Souterrains.' },
],
    notes: 'Version de référence : Diamant / Perle ; Platine est indiquée en comparaison.',
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
      {
        name: 'Rachid', place: 'Ogoesse', type: 'Plante', badge: 'Badge Triple', team: [506, 511],
        note: 'Noir / Blanc uniquement. Trio de frères : on affronte celui dont le type a l’avantage sur le starter choisi. Rachid si Moustillon.',
        alt: {
          name: 'Armando', place: 'Ogoesse', type: 'Feu', badge: 'Badge Triple', team: [506, 513],
          note: 'Noir / Blanc uniquement. Armando si Vipélierre.',
          alt: { name: 'Noa', place: 'Ogoesse', type: 'Eau', badge: 'Badge Triple', team: [506, 515], note: 'Noir / Blanc uniquement. Noa si Gruikui.' },
        },
      },
      { name: 'Aloé', place: 'Maillard', type: 'Normal', badge: 'Badge Basique', team: [507, 505], note: 'Noir / Blanc uniquement.' },
      {
        name: 'Artie', place: 'Volucité', type: 'Insecte', badge: 'Badge Élytre', team: [544, 557, 542], note: 'Noir / Blanc.',
        alt: { name: 'Artie', place: 'Volucité', type: 'Insecte', badge: 'Badge Élytre', team: [541, 557, 542], note: 'Noir 2 / Blanc 2.' },
      },
      {
        name: 'Inezia', place: 'Méanville', type: 'Électrik', badge: 'Badge Volt', team: [587, 587, 523], note: 'Noir / Blanc.',
        alt: { name: 'Inezia', place: 'Méanville', type: 'Électrik', badge: 'Badge Volt', team: [587, 180, 523], note: 'Noir 2 / Blanc 2.' },
      },
      {
        name: 'Bardane', place: 'Port Yoneuve', type: 'Sol', badge: 'Badge Sismique', team: [552, 536, 530], note: 'Noir / Blanc.',
        alt: { name: 'Bardane', place: 'Port Yoneuve', type: 'Sol', badge: 'Badge Sismique', team: [552, 28, 530], note: 'Noir 2 / Blanc 2.' },
      },
      {
        name: 'Carolina', place: 'Parsemille', type: 'Vol', badge: 'Badge Jet', team: [528, 521, 581], note: 'Noir / Blanc.',
        alt: { name: 'Carolina', place: 'Parsemille', type: 'Vol', badge: 'Badge Jet', team: [528, 227, 581], note: 'Noir 2 / Blanc 2.' },
      },
      { name: 'Zhu', place: 'Flocombe', type: 'Glace', badge: 'Badge Stalactite', team: [583, 615, 614], note: 'Noir / Blanc uniquement.' },
      {
        name: 'Watson / Iris', place: 'Janusia', type: 'Dragon', badge: 'Badge Mythe', team: [611, 621, 612],
        note: 'Noir / Blanc, 8e arène. Watson dans Noir, Iris dans Blanc ; même équipe.',
        alt: { name: 'Watson', place: 'Janusia', type: 'Dragon', badge: 'Badge Mythe', team: [621, 330, 612], note: 'Noir 2 / Blanc 2, 7e arène (Iris est devenue Maître de la Ligue).' },
      },
      { name: 'Tcheren', place: 'Pavonnay', type: 'Normal', badge: 'Badge Basique', team: [504, 506], note: 'Noir 2 / Blanc 2 uniquement (1re arène).' },
      { name: 'Strykna', place: 'Ondes-sur-Mer', type: 'Poison', badge: 'Badge Toxique', team: [109, 544], note: 'Noir 2 / Blanc 2 uniquement (2e arène).' },
      { name: 'Amana', place: 'Papeloa', type: 'Eau', badge: 'Badge Vague', team: [565, 321, 593], note: 'Noir 2 / Blanc 2 uniquement (8e arène).' },
    ],
    leagueName: 'Ligue Pokémon d’Unys',
    eliteFour: [
      {
        name: 'Anis', type: 'Spectre', team: [563, 593, 623, 609], note: 'Noir / Blanc.',
        alt: { name: 'Anis', type: 'Spectre', team: [563, 426, 623, 609], note: 'Noir 2 / Blanc 2.' },
      },
      {
        name: 'Pieris', type: 'Ténèbres', team: [560, 510, 553, 625], note: 'Noir / Blanc.',
        alt: { name: 'Pieris', type: 'Ténèbres', team: [510, 560, 553, 625], note: 'Noir 2 / Blanc 2.' },
      },
      {
        name: 'Percila', type: 'Psy', team: [579, 518, 561, 576], note: 'Noir / Blanc.',
        alt: { name: 'Percila', type: 'Psy', team: [518, 579, 561, 576], note: 'Noir 2 / Blanc 2.' },
      },
      {
        name: 'Kunz', type: 'Combat', team: [538, 539, 534, 620], note: 'Noir / Blanc.',
        alt: { name: 'Kunz', type: 'Combat', team: [538, 539, 620, 534], note: 'Noir 2 / Blanc 2.' },
      },
    ],
    champion: {
      name: 'Goyah', team: [617, 626, 621, 584, 589, 637],
      note: 'Noir / Blanc. N’apparaît qu’après l’obtention du Pokédex National.',
      alt: { name: 'Iris', team: [635, 621, 567, 306, 131, 612], note: 'Noir 2 / Blanc 2. Maîtresse de la Ligue dès la première victoire sur le Conseil des 4.' },
    },
    color: '#54535c',
    mechanic: 'Les combats en triple et les Capacités cachées, avec des saisons qui changent l’environnement.',
    dexFirst: 494,
    dexLast: 649,
    differences: [
      { games: 'Noir / Blanc', text: 'Zekrom est dans Noir et Reshiram dans Blanc. À Janusia, la 8e arène est tenue par Watson dans Noir et par Iris dans Blanc (même équipe). À Ogoesse, le trio Rachid / Armando / Noa dépend du starter choisi.' },
      { games: 'Noir 2 / Blanc 2', text: 'Se passent deux ans plus tard : le trio d’Ogoesse, Aloé (Maillard) et Zhu (Flocombe) ne sont plus Champions ; Tcheren (Pavonnay), Strykna (Ondes-sur-Mer) et Amana (Papeloa) les remplacent. L’ordre des arènes change : Pavonnay, Ondes-sur-Mer, Volucité, Méanville, Port Yoneuve, Parsemille, Janusia, Papeloa.' },
      { games: 'Noir / Blanc · Noir 2 / Blanc 2', text: 'Artie, Inezia, Bardane, Carolina et Watson gardent leur arène mais ont des équipes différentes. Au Conseil des 4, Anis troque Moyade contre Grodrive ; les autres membres gardent les mêmes Pokémon dans un ordre différent. Le Maître est Goyah (après le Pokédex National) dans Noir / Blanc et Iris dans Noir 2 / Blanc 2, qui l’affronte dès la première Ligue.' },
    ],
    notes: 'Version de référence : Noir / Blanc ; Noir 2 / Blanc 2 est indiqué en comparaison.',
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
    challengeLabel: 'Épreuves et Grandes Épreuves',
    gyms: [
      { name: 'Althéo', place: 'Mele-Mele · Grotte Verdoyante', type: 'Normal', team: [735, 734], note: 'Capitaine. Pokémon Dominant : Argouste (Soleil / Ultra-Soleil) ou Rattatac d’Alola (Lune / Ultra-Lune). Identique dans les deux paires de jeux.' },
      {
        name: 'Pectorius', place: 'Mele-Mele · Lili’i', type: 'Combat', team: [296, 56, 739], note: 'Doyen (Grande Épreuve). Soleil / Lune.',
        alt: { name: 'Pectorius', place: 'Mele-Mele · Lili’i', type: 'Combat', team: [66, 296, 739], note: 'Ultra-Soleil / Ultra-Lune.' },
      },
      {
        name: 'Néphie', place: 'Akala · Colline Clapotis', type: 'Eau', team: [746, 594], note: 'Capitaine. Soleil / Lune.',
        alt: { name: 'Néphie', place: 'Akala · Colline Clapotis', type: 'Eau', team: [752, 284, 751], note: 'Ultra-Soleil / Ultra-Lune.' },
      },
      {
        name: 'Kiawe', place: 'Akala · Parc Volcanique', type: 'Feu', team: [758, 757], note: 'Capitaine. Soleil / Lune.',
        alt: { name: 'Kiawe', place: 'Akala · Parc Volcanique', type: 'Feu', team: [105, 758], note: 'Ultra-Soleil / Ultra-Lune.' },
      },
      {
        name: 'Barbara', place: 'Akala · Jungle Sombrefeuille', type: 'Plante', team: [754, 732, 351], note: 'Capitaine. Soleil / Lune.',
        alt: { name: 'Barbara', place: 'Akala · Jungle Sombrefeuille', type: 'Plante', team: [754, 352, 764], note: 'Ultra-Soleil / Ultra-Lune.' },
      },
      {
        name: 'Alyxia', place: 'Akala · Ruines de l’Éveil', type: 'Roche', team: [299, 525, 749], note: 'Doyenne (Grande Épreuve). Soleil / Lune.',
        alt: { name: 'Alyxia', place: 'Akala · Ruines de l’Éveil', type: 'Roche', team: [347, 345, 749], note: 'Ultra-Soleil / Ultra-Lune.' },
      },
      {
        name: 'Chrys', place: 'Ula-Ula · Observatoire du Mont Hokulani', type: 'Électrik', team: [738, 737], note: 'Capitaine. Soleil / Lune.',
        alt: { name: 'Chrys', place: 'Ula-Ula · Observatoire du Mont Hokulani', type: 'Électrik', team: [777, 227, 702], note: 'Ultra-Soleil / Ultra-Lune.' },
      },
      {
        name: 'Margie', place: 'Ula-Ula · ancien site Bradley Prix', type: 'Spectre', team: [778, 93, 94], note: 'Capitaine. Soleil / Lune.',
        alt: { name: 'Margie', place: 'Ula-Ula · ancien site Bradley Prix', type: 'Spectre', team: [778, 354, 593], note: 'Ultra-Soleil / Ultra-Lune.' },
      },
      { name: 'Danh', place: 'Ula-Ula · Malié', type: 'Ténèbres', team: [302, 552, 53], note: 'Doyen (Grande Épreuve). Identique dans les deux paires de jeux.' },
      {
        name: 'Épreuve du Grand Canyon de Poni', place: 'Poni', type: 'Dragon', team: [784, 212, 783], note: 'Pas de capitaine : il faut battre les Pokémon Dragon. Soleil / Lune.',
        alt: { name: 'Épreuve du Grand Canyon de Poni', place: 'Poni', type: 'Dragon', team: [784, 212, 715], note: 'Ultra-Soleil / Ultra-Lune.' },
      },
      { name: 'Oléa', place: 'Poni · Village Flottant', type: 'Fée', team: [743, 242, 279], note: 'Capitaine. Ultra-Soleil / Ultra-Lune uniquement.' },
      {
        name: 'Paulie', place: 'Poni · Île Noadkoko', type: 'Sol', team: [51, 423, 330, 750], note: 'Doyenne (Grande Épreuve). Soleil / Lune.',
        alt: { name: 'Paulie', place: 'Poni · Île Noadkoko', type: 'Sol', team: [623, 423, 330, 750], note: 'Ultra-Soleil / Ultra-Lune.' },
      },
    ],
    leagueName: 'Ligue Pokémon d’Alola',
    eliteFour: [
      {
        name: 'Pectorius', type: 'Combat', team: [297, 57, 760, 62, 740], note: 'Soleil / Lune.',
        alt: { name: 'Molène', type: 'Acier', team: [707, 625, 462, 376, 51], note: 'Ultra-Soleil / Ultra-Lune : remplace Pectorius.' },
      },
      {
        name: 'Alyxia', type: 'Roche', team: [369, 703, 76, 476, 745], note: 'Soleil / Lune.',
        alt: { name: 'Alyxia', type: 'Roche', team: [348, 346, 526, 476, 745], note: 'Ultra-Soleil / Ultra-Lune.' },
      },
      {
        name: 'Margie', type: 'Spectre', team: [302, 426, 781, 478, 770], note: 'Soleil / Lune.',
        alt: { name: 'Margie', type: 'Spectre', team: [354, 426, 781, 478, 770], note: 'Ultra-Soleil / Ultra-Lune.' },
      },
      {
        name: 'Kahili', type: 'Vol', team: [227, 169, 741, 630, 733], note: 'Soleil / Lune.',
        alt: { name: 'Kahili', type: 'Vol', team: [628, 701, 741, 630, 733], note: 'Ultra-Soleil / Ultra-Lune.' },
      },
    ],
    champion: {
      name: 'Professeur Euphorbe', team: [745, 38, 628, 462, 143], note: 'Soleil / Lune. Un sixième Pokémon dépend du starter (Félinferno, Oratoria ou Archéduc).',
      alt: { name: 'Tili', team: [26, 128, 715, 740], note: 'Ultra-Soleil / Ultra-Lune. Deux Pokémon de plus dépendent du starter.' },
    },
    color: '#2fb59b',
    mechanic: 'Les Capacités Z et les formes d’Alola.',
    dexFirst: 722,
    dexLast: 809,
    differences: [
      { games: 'Soleil / Lune', text: 'Solgaleo est dans Soleil et Lunala dans Lune ; version de référence : Pectorius siège à la Ligue et le Professeur Euphorbe est champion.' },
      { games: 'Ultra-Soleil / Ultra-Lune', text: 'Molène remplace Pectorius à la Ligue et Tili devient champion ; l’histoire change, avec Necrozma et de nouvelles Capacités Z.' },
    ],
    notes: 'Pas d’Arènes : chaque Épreuve se conclut par un duel contre un Pokémon Dominant, et chaque île finit par une Grande Épreuve contre un Doyen. Équipes d’après Pokébip : Soleil / Lune en référence, Ultra-Soleil / Ultra-Lune en comparaison.',
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
