import { memo, type CSSProperties } from 'react';
import type { PokemonSummary, PokemonType } from '../domain/types';

export function TypeBadge({ type }: { type: PokemonType }) {
  return (
    <span className={`type type-${type.slug}`} title={type.slug}>
      {type.labelFr ?? type.slug}
    </span>
  );
}

export const pad = (id: number) => `#${String(id).padStart(4, '0')}`;

/** Couleurs des types (--c : principal, --c2 : second ou le même) pour teinter une tuile ou une fiche. */
export function typeVars(types: PokemonType[]): CSSProperties {
  const a = types[0]?.slug ?? 'normal';
  const b = types[1]?.slug ?? a;
  return { '--c': `var(--t-${a}, var(--t-normal))`, '--c2': `var(--t-${b}, var(--t-normal))` } as CSSProperties;
}

/** Mémoïsée : le clic est géré par délégation dans la liste, donc les 1025 tuiles ne se re-rendent pas à chaque changement d'URL. */
export const PokemonTile = memo(function PokemonTile({ p }: { p: PokemonSummary }) {
  return (
    <li>
      <button type="button" className="tile pokemon-tile typed tilt" data-id={p.id} style={typeVars(p.types)}>
        <span className="muted num">{pad(p.id)}</span>
        <img src={p.imageUrl} alt="" loading="lazy" decoding="async" width={120} height={120} />
        <strong>{p.nameFr ?? p.nameEn ?? p.slug}</strong>
        <span className="muted small">{p.nameEn && p.nameEn !== p.nameFr ? p.nameEn : ' '}</span>
        <span className="badges">
          {p.types.map((t) => (
            <TypeBadge key={t.slug} type={t} />
          ))}
        </span>
      </button>
    </li>
  );
});
