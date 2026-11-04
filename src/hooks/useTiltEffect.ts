import { useEffect } from 'react';

const POSITION_VARS = ['--px', '--py', '--mx', '--my'] as const;

function reset(el: HTMLElement) {
  el.classList.remove('is-tilting');
  POSITION_VARS.forEach((v) => el.style.removeProperty(v));
}

/**
 * Inclinaison 3D et reflet qui suivent la souris sur tout élément `.tilt` de la page.
 * Un seul écouteur délégué (au plus une mise à jour par image) plutôt qu'un par tuile : le Pokédex en affiche 1025.
 * Seule la souris déclenche l'effet ; il est désactivé si l'utilisateur préfère réduire les animations.
 */
export function useTiltEffect() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let current: HTMLElement | null = null;
    let last: PointerEvent | null = null;
    let frame = 0;

    const apply = () => {
      frame = 0;
      if (!last) return;
      const target = last.target instanceof Element ? last.target : null;
      const el = target?.closest<HTMLElement>('.tilt') ?? null;
      if (el !== current) {
        if (current) reset(current);
        current = el;
      }
      if (!el) return;
      // Le rectangle d'un élément incliné est déformé ; son centre et sa taille d'origine (offsetWidth) restent fiables.
      const r = el.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, 0.5 + (last.clientX - (r.left + r.width / 2)) / (el.offsetWidth || 1)));
      const y = Math.min(1, Math.max(0, 0.5 + (last.clientY - (r.top + r.height / 2)) / (el.offsetHeight || 1)));
      el.style.setProperty('--px', x.toFixed(3));
      el.style.setProperty('--py', y.toFixed(3));
      el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
      el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
      el.classList.add('is-tilting');
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      last = e;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      if (current) reset(current);
      current = null;
      last = null;
    };

    document.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      if (current) reset(current);
    };
  }, []);
}
