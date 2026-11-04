import { useEffect, useMemo, useRef, useState } from 'react';
import { resolveTeamName, useSavedTeams } from '../lib/savedTeams';
import { Link } from 'react-router-dom';
import { TYPES, TYPE_FR, effectiveness, type TypeSlug } from '../data/typeChart';
import type { PokemonSummary } from '../domain/types';
import { usePokemonList } from '../hooks/usePokemonList';
import { Loading, ErrorBox } from '../components/Status';
import { TypeBadge, pad, typeVars } from '../components/Pokemon';

const GENERATIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const shuffle = <T,>(a: T[]): T[] => {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};

interface Options {
  gens: number[];
  size: number;
  requiredTypes: string[];
  distinctTypes: boolean;
}

const typesOf = (p: PokemonSummary) => p.types.map((t) => t.slug);

/** Formes finales (aucune espèce n'évolue à partir d'elles) et accès aux évolutions directes. */
function evolutionIndex(all: PokemonSummary[]) {
  const children = new Map<number, PokemonSummary[]>();
  for (const p of all) {
    if (p.evolvesFromId) children.set(p.evolvesFromId, [...(children.get(p.evolvesFromId) ?? []), p]);
  }
  const finals = (p: PokemonSummary): PokemonSummary[] => {
    const next = children.get(p.id);
    return next?.length ? next.flatMap(finals) : [p];
  };
  return { isFinal: (p: PokemonSummary) => !children.has(p.id), finals };
}

/** Complète `fixed` (Pokémon verrouillés / obligatoires) avec des Pokémon du pool ; renvoie une erreur lisible si impossible. */
function generate(all: PokemonSummary[], o: Options, fixedIn: PokemonSummary[]): { team?: PokemonSummary[]; error?: string } {
  const evo = evolutionIndex(all);
  const fixed = fixedIn.map((p) => {
    const options = evo.finals(p);
    return options[Math.floor(Math.random() * options.length)];
  });
  const pool = all.filter((p) => evo.isFinal(p) && o.gens.includes(p.generation) && !fixed.some((f) => f.id === p.id));
  if (fixed.length > o.size) return { error: `Trop de Pokémon obligatoires/verrouillés pour une équipe de ${o.size}.` };
  if (o.distinctTypes && fixed.some((p, i) => typesOf(p).some((t) => fixed.slice(0, i).some((q) => typesOf(q).includes(t))))) {
    return { error: 'Les Pokémon obligatoires partagent déjà un type : décochez « types tous différents ».' };
  }

  for (let attempt = 0; attempt < 50; attempt++) {
    const team = [...fixed];
    const used = new Set(team.flatMap(typesOf));
    const candidates = shuffle(pool);
    const fits = (p: PokemonSummary) => !o.distinctTypes || typesOf(p).every((t) => !used.has(t));
    const add = (p: PokemonSummary) => {
      team.push(p);
      typesOf(p).forEach((t) => used.add(t));
    };

    // Chaque type exigé doit être couvert par au moins un membre.
    for (const t of shuffle(o.requiredTypes)) {
      if (team.some((p) => typesOf(p).includes(t)) || team.length >= o.size) continue;
      const pick = candidates.find((p) => !team.includes(p) && typesOf(p).includes(t) && fits(p));
      if (pick) add(pick);
    }
    for (const p of candidates) {
      if (team.length >= o.size) break;
      if (!team.includes(p) && fits(p)) add(p);
    }
    const okTypes = o.requiredTypes.every((t) => team.some((p) => typesOf(p).includes(t)));
    if (team.length === o.size && okTypes) return { team: shuffle(team) };
  }
  return { error: 'Impossible de générer une équipe avec ces conditions. Élargissez les générations ou retirez une contrainte.' };
}

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

function TeamGenerator({ pokemon, onSave }: { pokemon: PokemonSummary[]; onSave: (name: string, ids: number[]) => void }) {
  const [saveName, setSaveName] = useState('');
  const [saved, setSaved] = useState(false);
  const [gens, setGens] = useState<number[]>(GENERATIONS);
  const [size, setSize] = useState(6);
  const [requiredTypes, setRequiredTypes] = useState<string[]>([]);
  const [distinctTypes, setDistinctTypes] = useState(false);
  const [requiredText, setRequiredText] = useState('');
  const [requiredPokemon, setRequiredPokemon] = useState<PokemonSummary[]>([]);
  const [team, setTeam] = useState<PokemonSummary[]>([]);
  const [locked, setLocked] = useState<number[]>([]);
  const [error, setError] = useState<string>();

  const addRequired = (text: string) => {
    setRequiredText(text);
    const t = text.trim().toLowerCase();
    const match = t ? pokemon.find((p) => p.nameFr?.toLowerCase() === t || p.nameEn?.toLowerCase() === t) : undefined;
    if (match) {
      setRequiredPokemon((l) => (l.some((p) => p.id === match.id) ? l : [...l, match]));
      setRequiredText('');
    }
  };

  const run = (keepLocked: boolean) => {
    if (!gens.length) return setError('Choisissez au moins une génération.');
    const keep = keepLocked ? team.filter((p) => locked.includes(p.id)) : [];
    const fixed = [...keep, ...requiredPokemon.filter((r) => !keep.some((k) => k.id === r.id))];
    const res = generate(pokemon, { gens, size, requiredTypes, distinctTypes }, fixed);
    setError(res.error);
    if (res.team) {
      setSaved(false);
      setTeam(res.team);
      if (!keepLocked) setLocked([]);
    }
  };

  return (
    <div>
      <form className="team-form" onSubmit={(e) => e.preventDefault()}>
        <fieldset>
          <legend>Générations</legend>
          <div className="check-row">
            {GENERATIONS.map((g) => (
              <label key={g} className="check">
                <input type="checkbox" checked={gens.includes(g)} onChange={() => setGens((l) => toggle(l, g))} /> {g}
              </label>
            ))}
            <button type="button" className="btn small-btn" onClick={() => setGens(gens.length === GENERATIONS.length ? [] : GENERATIONS)}>
              {gens.length === GENERATIONS.length ? 'Aucune' : 'Toutes'}
            </button>
          </div>
        </fieldset>

        <fieldset>
          <legend>Types obligatoires dans l’équipe</legend>
          <div className="check-row">
            {TYPES.map((t) => (
              <label key={t} className={`type type-${t} type-check${requiredTypes.includes(t) ? ' on' : ''}`}>
                <input type="checkbox" checked={requiredTypes.includes(t)} onChange={() => setRequiredTypes((l) => toggle(l, t))} />
                {TYPE_FR[t]}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="team-form-row">
          <label className="field">
            <span>Taille de l’équipe</span>
            <input type="number" min={1} max={6} value={size} onChange={(e) => setSize(Math.min(6, Math.max(1, Number(e.target.value) || 1)))} />
          </label>
          <label className="field">
            <span>Pokémon obligatoire (nom FR ou EN)</span>
            <input type="search" list="req-names" value={requiredText} placeholder="Pikachu" onChange={(e) => addRequired(e.target.value)} />
            <datalist id="req-names">
              {pokemon.map((p) => (
                <option key={p.id} value={p.nameFr ?? p.nameEn ?? p.slug} label={p.nameEn} />
              ))}
            </datalist>
          </label>
          <label className="check">
            <input type="checkbox" checked={distinctTypes} onChange={(e) => setDistinctTypes(e.target.checked)} /> Types tous différents
          </label>
        </div>

        {requiredPokemon.length > 0 && (
          <ul className="chips">
            {requiredPokemon.map((p) => (
              <li key={p.id}>
                {p.nameFr ?? p.nameEn}{' '}
                <button type="button" className="chip-x" aria-label={`Retirer ${p.nameFr ?? p.nameEn}`} onClick={() => setRequiredPokemon((l) => l.filter((x) => x.id !== p.id))}>
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="team-actions">
          <button type="button" className="btn primary" onClick={() => run(false)}>
            🎲 Générer
          </button>
          {team.length > 0 && locked.length > 0 && (
            <button type="button" className="btn" onClick={() => run(true)}>
              Relancer (garder les 🔒)
            </button>
          )}
        </div>
      </form>

      {error && (
        <p className="status" role="alert">
          {error}
        </p>
      )}

      {team.length > 0 && (
        <ul className="grid team-grid" aria-label="Équipe générée">
          {team.map((p) => (
            <li key={p.id} className="tile team-card typed" style={typeVars(p.types)}>
              <span className="muted num">{pad(p.id)}</span>
              <img src={p.imageUrl} alt="" width={120} height={120} />
              <strong>
                <Link to={`/?p=${p.id}`}>{p.nameFr ?? p.nameEn ?? p.slug}</Link>
              </strong>
              <span className="badges">
                {p.types.map((t) => (
                  <TypeBadge key={t.slug} type={t} />
                ))}
              </span>
              <span className="muted small">Génération {p.generation}</span>
              <button type="button" className="btn small-btn" aria-pressed={locked.includes(p.id)} onClick={() => setLocked((l) => toggle(l, p.id))}>
                {locked.includes(p.id) ? '🔒 Verrouillé' : '🔓 Verrouiller'}
              </button>
            </li>
          ))}
        </ul>
      )}
      {team.length > 0 && <TeamWeaknesses team={team} />}
      {team.length > 0 && (
        <form
          className="team-actions"
          onSubmit={(e) => {
            e.preventDefault();
            onSave(saveName, team.map((p) => p.id));
            setSaveName('');
            setSaved(true);
          }}
        >
          <input
            type="text"
            aria-label="Nom de l’équipe"
            placeholder="Nom de l’équipe (facultatif)"
            maxLength={80}
            value={saveName}
            onChange={(e) => {
              setSaveName(e.target.value);
              setSaved(false);
            }}
          />
          <button type="submit" className="btn">
            💾 Sauvegarder l’équipe
          </button>
          {saved && <span role="status">Équipe sauvegardée ✔</span>}
        </form>
      )}
    </div>
  );
}

function GeneratorDialog({ pokemon, onSave, onClose }: { pokemon: PokemonSummary[]; onSave: (name: string, ids: number[]) => void; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(document.activeElement as HTMLElement | null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    return () => void setTimeout(() => opener.current?.focus?.(), 0);
  }, []);
  return (
    <dialog ref={ref} className="modal region-modal" aria-label="Générer une équipe" onClose={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      <div className="region-body" style={{ ['--region' as string]: 'var(--accent)' }}>
        <header className="region-head">
          <h2>Générer une équipe</h2>
          <button type="button" className="btn" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </header>
        <TeamGenerator pokemon={pokemon} onSave={onSave} />
      </div>
    </dialog>
  );
}

function SavedTeams({ pokemon, api }: { pokemon: PokemonSummary[]; api: ReturnType<typeof useSavedTeams> }) {
  const byId = useMemo(() => new Map(pokemon.map((p) => [p.id, p])), [pokemon]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string }>();

  const doExport = () => {
    const url = URL.createObjectURL(new Blob([api.exportJson()], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `pokeclopedie-equipes-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const doImport = async (file: File) => {
    try {
      const n = api.importJson(await file.text());
      setMessage({ ok: true, text: n ? `${n} équipe${n > 1 ? 's' : ''} importée${n > 1 ? 's' : ''}.` : 'Aucune nouvelle équipe dans ce fichier.' });
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : 'Fichier illisible.' });
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <section aria-labelledby="saved-title">
      <div className="saved-head">
        <h2 id="saved-title">Mes équipes ({api.teams.length})</h2>
        <div className="team-actions">
          <button type="button" className="btn" onClick={doExport} disabled={!api.teams.length}>
            ⬇ Exporter les données
          </button>
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
            ⬆ Importer les données
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])} />
        </div>
      </div>
      {message && (
        <p className="status" role={message.ok ? 'status' : 'alert'}>
          {message.text}
        </p>
      )}
      {!api.teams.length && <p className="muted">Aucune équipe sauvegardée pour l’instant.</p>}
      <ul className="saved-list">
        {api.teams.map((t) => (
          <li key={t.id} className="trainer">
            <div className="saved-row">
              <input
                type="text"
                className="saved-name"
                aria-label="Nom de l’équipe"
                maxLength={80}
                defaultValue={t.name}
                onBlur={(e) => {
                  // Le champ n'est pas contrôlé : un nom vide est refusé par `rename`, donc on restaure l'affichage nous-mêmes.
                  const name = resolveTeamName(e.target.value, t.name);
                  e.target.value = name;
                  if (name !== t.name) api.rename(t.id, name);
                }}
              />
              <span className="muted small">{new Date(t.createdAt).toLocaleDateString('fr-FR')}</span>
              <button type="button" className="btn small-btn btn-danger"               onClick={() => window.confirm(`Supprimer « ${t.name} » ?`) && api.remove(t.id)}>
                              🗑 
              </button>
            </div>
            <ul className="team">
              {t.members.map((id, i) => {
                const p = byId.get(id);
                return (
                  <li key={`${id}-${i}`}>
                    <Link to={`/?p=${id}`} title={p?.nameFr ?? `n° ${id}`}>
                      {p ? <img src={p.imageUrl} alt="" loading="lazy" width={56} height={56} /> : <span className="team-ph" />}
                      <span className="small">{p?.nameFr ?? p?.nameEn ?? `#${id}`}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}

function TeamsSection({ pokemon }: { pokemon: PokemonSummary[] }) {
  const api = useSavedTeams();
  const [open, setOpen] = useState(false);
  return (
    <>
      <p>
        <button type="button" className="btn primary" onClick={() => setOpen(true)}>
          🎲 Générer une équipe aléatoire
        </button>
      </p>
      <SavedTeams pokemon={pokemon} api={api} />
      {open && <GeneratorDialog pokemon={pokemon} onSave={api.save} onClose={() => setOpen(false)} />}
    </>
  );
}

/** Pour chaque type d'attaque : combien de membres le craignent (×2 ou plus) et combien y résistent (×0,5 ou moins). */
function TeamWeaknesses({ team }: { team: PokemonSummary[] }) {
  const rows = TYPES.map((atk) => {
    let weak = 0;
    let resist = 0;
    for (const p of team) {
      const m = typesOf(p).reduce((acc, d) => acc * (TYPES.includes(d as TypeSlug) ? effectiveness(atk, d as TypeSlug) : 1), 1);
      if (m > 1) weak++;
      else if (m < 1) resist++;
    }
    return { atk, weak, resist };
  });
  return (
    <div className="team-weak">
      <h3>Faiblesses de l’équipe</h3>
      <ul className="chips">
        {rows.map((r) => (
          <li key={r.atk} className={r.weak > r.resist ? 'danger' : undefined} title={`${r.weak} faible(s), ${r.resist} résistant(s)`}>
            <span className={`type type-${r.atk}`}>{TYPE_FR[r.atk]}</span> ⚠ {r.weak} · 🛡 {r.resist}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Cell({ v }: { v: 0 | 0.5 | 1 | 2 }) {
  if (v === 0) return <td className="eff eff-0" title="N’affecte pas">✕<span className="sr-only"> aucun effet</span></td>;
  if (v === 0.5) return <td className="eff eff-half" title="Peu efficace">½<span className="sr-only"> peu efficace</span></td>;
  if (v === 2) return <td className="eff eff-2" title="Super efficace">2<span className="sr-only"> super efficace</span></td>;
  return <td className="eff eff-1" title="Efficacité normale">1</td>;
}

function TypeChart() {
  return (
    <section aria-labelledby="chart-title">
      <h2 id="chart-title">Tableau des types</h2>
      <ul className="legend">
        <li>
          <span className="eff eff-0">✕</span> Aucun effet
        </li>
        <li>
          <span className="eff eff-half">½</span> Peu efficace
        </li>
        <li>
          <span className="eff eff-1">1</span> Efficacité normale
        </li>
        <li>
          <span className="eff eff-2">2</span> Super efficace
        </li>
      </ul>
      <p className="muted small">Lignes : type de l’attaque. Colonnes : type du défenseur.</p>
      <div className="chart-scroll">
        <table className="type-chart">
          <caption className="sr-only">Efficacité de chaque type d’attaque contre chaque type de défenseur</caption>
          <thead>
            <tr>
              <th className="corner" scope="col">
                Att. ↓ / Déf. →
              </th>
              {TYPES.map((d) => (
                <th key={d} scope="col" className="col-head">
                  <span className={`type type-${d}`}>{TYPE_FR[d]}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TYPES.map((a) => (
              <tr key={a}>
                <th scope="row" className="row-head">
                  <span className={`type type-${a}`}>{TYPE_FR[a]}</span>
                </th>
                {TYPES.map((d) => (
                  <Cell key={d} v={effectiveness(a, d)} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function TeamPage() {
  const { data, error, loading, reload } = usePokemonList();
  return (
    <>
      <header className="page-hero">
        <p className="eyebrow">Stratégie</p>
        <h1>Équipe et types</h1>
        <p className="lede">Générez une équipe aléatoire selon vos règles, gardez vos préférées et vérifiez ses faiblesses.</p>
      </header>
      {loading && <Loading label="Chargement du Pokédex…" />}
      {error && <ErrorBox error={error} onRetry={reload} />}
      {data && <TeamsSection pokemon={data} />}
      <TypeChart />
    </>
  );
}
