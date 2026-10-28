import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { REGIONS, type Region, type Trainer } from '../data/regions';
import type { PokemonSummary } from '../domain/types';
import { usePokemonList } from '../hooks/usePokemonList';

type Lookup = (id: number) => PokemonSummary | undefined;

function Team({ ids, lookup, plain }: { ids: number[]; lookup: Lookup; plain?: boolean }) {
  return (
    <ul className="team">
      {ids.map((id, i) => {
        const p = lookup(id);
        const inner = (
          <>
            {p ? <img src={p.imageUrl} alt="" loading="lazy" width={56} height={56} /> : <span className="team-ph" />}
            <span className="small">{p?.nameFr ?? p?.nameEn ?? `#${id}`}</span>
          </>
        );
        return (
          <li key={`${id}-${i}`}>
            {plain ? (
              <span className="team-link">{inner}</span>
            ) : (
              <Link to={`/?p=${id}`} title={p?.nameFr ?? `n° ${id}`}>
                {inner}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function TrainerCard({ t, lookup }: { t: Trainer; lookup: Lookup }) {
  return (
    <>
      <TrainerItem t={t} lookup={lookup} />
      {t.alt && <TrainerCard t={t.alt} lookup={lookup} />}
    </>
  );
}

function TrainerItem({ t, lookup }: { t: Trainer; lookup: Lookup }) {
  return (
    <li className="trainer">
      <div className="trainer-head">
        <strong>{t.name}</strong>
        <span className="muted small">{[t.place, t.type, t.badge].filter(Boolean).join(' · ')}</span>
      </div>
      {t.team.length > 0 && <Team ids={t.team} lookup={lookup} />}
      {t.note && <p className="muted small">{t.note}</p>}
    </li>
  );
}

function RegionModal({ region, lookup, onClose }: { region: Region; lookup: Lookup; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(document.activeElement as HTMLElement | null);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    return () => void setTimeout(() => opener.current?.focus?.(), 0);
  }, []);

  return (
    <dialog
      ref={ref}
      className="modal region-modal"
      aria-label={`Région ${region.name}`}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      <div className="region-body" style={{ ['--region' as string]: region.color }}>
        <header className="region-head">
          <div>
            <h2>{region.name}</h2>
            <p className="muted small">
              Génération {region.generation} · {region.games}
            </p>
          </div>
          <button type="button" className="btn" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </header>

        <dl className="facts">
          <dt>Inspiration</dt>
          <dd>{region.inspiration}</dd>
          <dt>Professeur</dt>
          <dd>{region.professor}</dd>
          <dt>Équipe méchante</dt>
          <dd>{region.villains}</dd>
          <dt>Pokédex national</dt>
          <dd>
            Génération {region.generation} : n° {region.dexFirst} à {region.dexLast}
          </dd>
          <dt>Mécanique importante</dt>
          <dd>{region.mechanic}</dd>
        </dl>

        <section>
          <h3>Starters</h3>
          <Team ids={region.starters} lookup={lookup} />
        </section>

        <section>
          <h3>Pokémon légendaires</h3>
          <Team ids={region.legendaries} lookup={lookup} />
        </section>

        <section>
          <h3>Villes et lieux</h3>
          <ul className="chips">
            {region.cities.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </section>

        <section>
          <h3>{region.challengeLabel}</h3>
          <ol className="trainers">
            {region.gyms.map((g) => (
              <TrainerCard key={g.name} t={g} lookup={lookup} />
            ))}
          </ol>
        </section>

        <section>
          <h3>{region.leagueName}</h3>
          {region.eliteFour.length > 0 && (
            <>
              <h4>Conseil des 4</h4>
              <ol className="trainers">
                {region.eliteFour.map((t) => (
                  <TrainerCard key={t.name} t={t} lookup={lookup} />
                ))}
              </ol>
            </>
          )}
          <h4>Champion</h4>
          <ul className="trainers">
            <TrainerCard t={region.champion} lookup={lookup} />
          </ul>
        </section>

        {region.differences.length > 0 && (
          <section>
            <h3>Différences entre les jeux</h3>
            <ul className="game-diffs">
              {region.differences.map((d) => (
                <li key={d.games}>
                  <strong>{d.games}</strong>
                  <span className="small"> : {d.text}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {region.notes && <p className="muted small">{region.notes}</p>}
      </div>
    </dialog>
  );
}

export function RegionsPage() {
  const { data: pokemon } = usePokemonList();
  const [selected, setSelected] = useState<Region | null>(null);
  const byId = useMemo(() => new Map((pokemon ?? []).map((p) => [p.id, p])), [pokemon]);
  const lookup: Lookup = (id) => byId.get(id);

  return (
    <>
      <h1>Régions</h1>
      <p className="muted">Choisissez une région pour voir ses starters, ses villes, ses arènes et sa Ligue.</p>
      <ul className="grid regions-grid">
        {REGIONS.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              className="tile region-tile"
              style={{ ['--region' as string]: r.color }}
              onClick={() => setSelected(r)}
            >
              <strong>{r.name}</strong>
              <span className="muted small">Génération {r.generation}</span>
              <Team ids={r.starters} lookup={lookup} plain />
            </button>
          </li>
        ))}
      </ul>
      {selected && <RegionModal region={selected} lookup={lookup} onClose={() => setSelected(null)} />}
    </>
  );
}
