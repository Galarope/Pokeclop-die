import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { CardBrief } from '../domain/types';
import { getSource } from '../sources';
import { imageUrl } from '../sources/tcgdex';
import { useAsync } from '../hooks/useAsync';
import { useInView } from '../hooks/useInView';
import { ErrorBox, Loading, Val } from './Status';
import { LANGUAGE_LABELS } from '../sources/types';

const FALLBACK_LANG = 'en';

/**
 * TCGdex n'a pas toujours l'image d'une carte dans une langue donnée. Si la même carte (même id)
 * existe en anglais avec une image, on l'utilise, en le signalant à l'utilisateur.
 */
function useCardImage(card: CardBrief, enabled: boolean) {
  const missing = !card.image;
  const { data } = useAsync(async () => {
    if (!enabled || !missing) return undefined;
    const src = getSource(card.source);
    const own = await src.resolveImage?.(card).catch(() => null);
    if (own) return { image: own, fallback: false };
    if (card.lang === FALLBACK_LANG) return undefined;
    const en = await src.getCard(FALLBACK_LANG, card.id).catch(() => undefined);
    if (en?.image) return { image: en.image, fallback: true };
    const enResolved = en ? await src.resolveImage?.(en).catch(() => null) : null;
    return enResolved ? { image: enResolved, fallback: true } : undefined;
  }, [card.uid, enabled, missing]);
  if (card.image) return { image: card.image, fallback: false };
  return data ?? { image: undefined, fallback: false };
}

export function CardTile({ card, onOpen }: { card: CardBrief; onOpen: (c: CardBrief) => void }) {
  // Rareté/illustrateur ne sont que dans le détail de la carte : chargés quand la tuile devient visible (puis cache).
  const [ref, seen] = useInView<HTMLLIElement>();
  const { image, fallback } = useCardImage(card, seen);
  const { data: detail } = useAsync(
    () => (seen ? getSource(card.source).getCard(card.lang, card.id).catch(() => undefined) : Promise.resolve(undefined)),
    [card.uid, seen],
  );
  return (
    <li ref={ref}>
      <button type="button" className="tile card-tile tilt" onClick={() => onOpen(card)} aria-label={`${card.name}, n° ${card.localId}`}>
        {image ? (
          <span className="card-art">
            <img src={`${image}/low.webp`} alt="" loading="lazy" width={245} height={342} />
          </span>
        ) : (
          <span className="no-image">Image non disponible</span>
        )}
        {fallback && <span className="muted small">Image de la version anglaise</span>}
        <strong>{card.name}</strong>
        <span className="muted small">
          n° {card.localId}
          {detail?.rarity ? ` · ${detail.rarity}` : ''}
        </span>
        {detail?.illustrator && <span className="muted small">✎ {detail.illustrator}</span>}
      </button>
    </li>
  );
}

export function CardModal({ card, onClose }: { card: CardBrief; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const { data, error, loading, reload } = useAsync(() => getSource(card.source).getCard(card.lang, card.id), [card.uid]);

  const openerRef = useRef<HTMLElement | null>(document.activeElement as HTMLElement | null);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    // Le démontage ne restaure pas le focus : on le rend à la tuile qui a ouvert la pop-up.
    return () => void setTimeout(() => openerRef.current?.focus?.(), 0);
  }, []);

  const { image, fallback } = useCardImage(card, true);

  const close = onClose;

  return (
    <dialog
      ref={ref}
      className="modal card-modal"
      aria-label={card.name}
      onClose={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          close();
        }
      }}
      onClick={(e) => e.target === ref.current && close()}
    >
      <div className="modal-body">
        <button type="button" className="btn close" onClick={close} aria-label="Fermer">
          ✕
        </button>
        {image ? (
          <figure className="card-figure">
            <span className="card-art tilt">
              <img src={imageUrl(image, 'high')} alt={`Carte ${card.name}`} width={420} height={586} />
            </span>
            {fallback && <figcaption className="muted small">Image de la version anglaise (aucune image disponible pour cette langue)</figcaption>}
          </figure>
        ) : (
          <span className="no-image card-figure">Image non disponible</span>
        )}
        <div>
          <h2>{card.name}</h2>
          {loading && <Loading />}
          {error && <ErrorBox error={error} onRetry={reload} />}
          <dl className="facts">
            <dt>Langue</dt>
            <dd>{LANGUAGE_LABELS[card.lang] ?? card.lang}</dd>
            <dt>Extension</dt>
            <dd>{data?.setName ?? card.setId}</dd>
            <dt>Numéro</dt>
            <dd>
              {card.localId}
              {data?.setOfficial ? ` / ${data.setOfficial}` : ''}
            </dd>
            <dt>Rareté</dt>
            <dd>
              <Val v={data?.rarity} />
            </dd>
            <dt>Illustrateur</dt>
            <dd>
              <Val v={data?.illustrator} />
            </dd>
            <dt>Catégorie</dt>
            <dd>
              <Val v={data?.category} />
            </dd>
            <dt>Source</dt>
            <dd>{card.source}</dd>
          </dl>
          {data?.description && <p className="muted">{data.description}</p>}
          {data?.dexIds?.[0] && (
            <Link className="btn" to={`/?p=${data.dexIds[0]}`}>
              Voir la fiche Pokédex
            </Link>
          )}
        </div>
      </div>
    </dialog>
  );
}
