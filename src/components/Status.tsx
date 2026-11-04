import { ApiError } from '../lib/http';

export function Loading({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div className="status" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" /> {label}
    </div>
  );
}

export function ErrorBox({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  const detail =
    error instanceof ApiError && error.status === 404
      ? 'Ressource introuvable.'
      : error instanceof ApiError && error.status === undefined
        ? 'Impossible de joindre le service (réseau).'
        : 'Le service a renvoyé une erreur.';
  return (
    <div className="status error" role="alert">
      <strong>{detail}</strong>
      <span className="muted"> {error.message}</span>
      {onRetry && (
        <button type="button" className="btn" onClick={onRetry}>
          Réessayer
        </button>
      )}
    </div>
  );
}

/** Tuiles fantômes pendant le premier chargement de la liste. */
export function SkeletonGrid({ count = 18 }: { count?: number }) {
  return (
    <ul className="grid skeleton-grid" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="skeleton" />
      ))}
    </ul>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="status muted">{children}</p>;
}

/** Affiche une valeur, ou un libellé explicite si la source ne la fournit pas. */
export function Val({ v, unit }: { v?: string | number | null; unit?: string }) {
  if (v === undefined || v === null || v === '') return <span className="missing" title="Non fourni par la source">—</span>;
  return <>{unit ? `${v} ${unit}` : v}</>;
}
