import { useEffect, useRef, type CSSProperties } from 'react';
import { getPokemonDetail } from '../api/pokeapi';
import { PokemonCards } from './PokemonCards';
import { generationLabel } from '../lib/utils';
import { pad, TypeBadge, typeVars } from './Pokemon';
import { ErrorBox, Loading, Val } from './Status';
import type { EvolutionNode, PokemonSummary, StatKey } from '../domain/types';
import { STAT_KEYS } from '../domain/types';
import { useAsync } from '../hooks/useAsync';
import { usePokemonList } from '../hooks/usePokemonList';

const STAT_LABELS: Record<StatKey, string> = {
  hp: 'PV',
  attack: 'Attaque',
  defense: 'Défense',
  'special-attack': 'Att. Spé.',
  'special-defense': 'Déf. Spé.',
  speed: 'Vitesse',
};

const meters = (dm?: number) => (dm === undefined ? undefined : `${(dm / 10).toLocaleString('fr-FR')} m`);
const kilos = (hg?: number) => (hg === undefined ? undefined : `${(hg / 10).toLocaleString('fr-FR')} kg`);

/** Valeur maximale possible d'une statistique de base : la barre est à l'échelle réelle, jamais étirée. */
const STAT_MAX = 255;

function Stats({ stats }: { stats: Partial<Record<StatKey, number>> }) {
  const values = STAT_KEYS.map((k) => stats[k]);
  const total = values.every((v) => v !== undefined) ? values.reduce<number>((a, v) => a + (v ?? 0), 0) : undefined;
  return (
    <table className="stats">
      <caption className="sr-only">Statistiques de base</caption>
      <tbody>
        {STAT_KEYS.map((k, i) => (
          <tr key={k}>
            <th scope="row">{STAT_LABELS[k]}</th>
            <td>
              <Val v={stats[k]} />
            </td>
            <td>
              {stats[k] !== undefined && (
                <span className="stat-bar" aria-hidden="true">
                  <span style={{ '--v': Math.min(1, stats[k]! / STAT_MAX), '--n': i } as CSSProperties} />
                </span>
              )}
            </td>
          </tr>
        ))}
        {total !== undefined && (
          <tr className="stat-total">
            <th scope="row">Total</th>
            <td>{total}</td>
            <td />
          </tr>
        )}
      </tbody>
    </table>
  );
}

function Evolution({
  node,
  byId,
  currentId,
  onSelect,
}: {
  node: EvolutionNode;
  byId: Map<number, PokemonSummary>;
  currentId: number;
  onSelect: (id: number) => void;
}) {
  const p = byId.get(node.speciesId);
  return (
    <li>
      {node.conditions.length > 0 && <span className="muted small">↳ {node.conditions.join(' / ')}</span>}
      <button
        type="button"
        className="evo linklike"
        aria-current={node.speciesId === currentId ? 'true' : undefined}
        onClick={() => onSelect(node.speciesId)}
      >
        {p && <img src={p.imageUrl} alt="" width={64} height={64} loading="lazy" />}
        {p?.nameFr ?? p?.nameEn ?? node.slug}
      </button>
      {node.children.length > 0 && (
        <ul>
          {node.children.map((c) => (
            <Evolution key={c.speciesId} node={c} byId={byId} currentId={currentId} onSelect={onSelect} />
          ))}
        </ul>
      )}
    </li>
  );
}

interface Props {
  id: number;
  onClose: () => void;
  onSelect: (id: number) => void;
}

/** Fiche Pokémon affichée dans une pop-up (<dialog> natif : focus piégé, Échap, backdrop). */
export function PokemonModal({ id, onClose, onSelect }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const list = usePokemonList();
  const summary = list.data?.find((p) => p.id === id);
  const detail = useAsync(() => (summary && list.data ? getPokemonDetail(summary, list.data) : Promise.resolve(undefined)), [summary?.id]);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  useEffect(() => {
    ref.current?.scrollTo({ top: 0 });
  }, [id]);

  const byId = new Map((list.data ?? []).map((p) => [p.id, p]));
  const d = detail.data;
  const abilities = (d?.forms.find((f) => f.isDefault) ?? d?.forms[0])?.abilities ?? [];
  const prev = byId.get(id - 1);
  const next = byId.get(id + 1);

  return (
    <dialog
      ref={ref}
      className="modal pokemon-modal"
      aria-label={summary?.nameFr ?? summary?.nameEn ?? `Pokémon ${id}`}
      onClose={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        }
      }}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      <div className="pokemon-modal-body" style={summary ? typeVars(summary.types) : undefined}>
        <div className="modal-bar">
          <span />
          <div className="modal-nav">
          {prev ? (
            <button type="button" className="btn" onClick={() => onSelect(prev.id)}>
              <img src={prev.imageUrl} alt="" width={34} height={34} /> ← {prev.nameFr ?? prev.nameEn}
            </button>
          ) : (
            <span />
          )}
          {next ? (
            <button type="button" className="btn" onClick={() => onSelect(next.id)}>
              {next.nameFr ?? next.nameEn} → <img src={next.imageUrl} alt="" width={34} height={34} />
            </button>
          ) : (
            <span />
          )}
          </div>
          <button type="button" className="btn modal-close" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>

        {!summary ? (
          list.loading ? <Loading /> : list.error ? <ErrorBox error={list.error} onRetry={list.reload} /> : <p className="status error">Pokémon introuvable (n° {id}).</p>
        ) : (
          <>
            {/* Clé = id : les animations d'entrée rejouent quand on passe au Pokémon précédent/suivant. */}
            <header className="poke-hero" key={summary.id}>
              <span className="poke-hero-num" aria-hidden="true">
                {pad(summary.id)}
              </span>
              <div className="poke-hero-art">
                <img src={summary.imageUrl} alt={summary.nameFr ?? summary.nameEn} width={280} height={280} />
              </div>
              <div>
                <p className="muted num">{pad(summary.id)}</p>
                <h2>{summary.nameFr ?? summary.nameEn ?? summary.slug}</h2>
                <p className="muted hero-lines">
                  <span>
                    Anglais : <Val v={summary.nameEn} />
                  </span>
                  <span>{generationLabel(summary.generation)}</span>
                  {(d?.genusFr || d?.genusEn) && <span>{d.genusFr ?? d.genusEn}</span>}
                </p>
                <p className="badges left">
                  {summary.types.map((t) => (
                    <TypeBadge key={t.slug} type={t} />
                  ))}
                </p>
                <dl className="facts">
                  <dt>Taille</dt>
                  <dd>
                    <Val v={meters(summary.height)} />
                  </dd>
                  <dt>Poids</dt>
                  <dd>
                    <Val v={kilos(summary.weight)} />
                  </dd>
                  {abilities.length > 0 && (
                    <>
                      <dt>Talents</dt>
                      <dd>
                        {abilities.map((a, i) => (
                          <span key={a.slug}>
                            {i > 0 && ', '}
                            {a.nameFr ?? a.slug}
                            {a.hidden && ' (caché)'}
                          </span>
                        ))}
                      </dd>
                    </>
                  )}
                </dl>
                {(d?.flavorFr || d?.flavorEn) && <p className="flavor">{d.flavorFr ?? d.flavorEn}</p>}
              </div>
            </header>

            <section className="panel" aria-labelledby="stats-title">
              <h3 id="stats-title">Statistiques de base</h3>
              <Stats key={summary.id} stats={summary.stats} />
            </section>

            {detail.loading && <Loading label="Formes et évolutions…" />}
            {detail.error && <ErrorBox error={detail.error} onRetry={detail.reload} />}
            {d && (
              <>
                <section className="panel" aria-labelledby="forms-title">
                  <h3 id="forms-title">Formes ({d.forms.length})</h3>
                  <ul className="grid forms-grid">
                    {d.forms.map((f) => (
                      <li key={f.slug} className="tile static typed form-tile" style={typeVars(f.types)}>
                        <span className="form-images">
                          {f.imageUrl ? (
                            <figure>
                              <img src={f.imageUrl} alt={`${f.slug}, normal`} width={96} height={96} loading="lazy" />
                              <figcaption className="muted small">Normal</figcaption>
                            </figure>
                          ) : (
                            <span className="no-image">Pas d'image</span>
                          )}
                          {f.shinyImageUrl && (
                            <figure>
                              <img src={f.shinyImageUrl} alt={`${f.slug}, shiny`} width={96} height={96} loading="lazy" />
                              <figcaption className="muted small">✨ Shiny</figcaption>
                            </figure>
                          )}
                        </span>
                        <strong>{f.slug}</strong>
                        <span className="badges">
                          {f.types.map((t) => (
                            <TypeBadge key={t.slug} type={t} />
                          ))}
                        </span>
                        <span className="muted small">
                          {meters(f.height) ?? '—'} · {kilos(f.weight) ?? '—'}
                        </span>
                        {f.isDefault && <span className="muted small">Forme par défaut</span>}
                      </li>
                    ))}
                  </ul>
                </section>
                <section className="panel" aria-labelledby="evo-title">
                  <h3 id="evo-title">Évolutions</h3>
                  {d.evolution && d.evolution.children.length > 0 ? (
                    <ul className="evo-tree">
                      <Evolution node={d.evolution} byId={byId} currentId={id} onSelect={onSelect} />
                    </ul>
                  ) : (
                    <p className="muted">Ce Pokémon n'a pas d'évolution.</p>
                  )}
                </section>
              </>
            )}

            <PokemonCards dexId={summary.id} />
          </>
        )}
      </div>
    </dialog>
  );
}
