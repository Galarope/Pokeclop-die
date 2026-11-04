import { useEffect, useRef, useState } from 'react';

const COUNT_KEY = 'pokeclopedie:clicks';
const STATE_KEY = 'pokeclopedie:mustebouee';
const THRESHOLD = 10;
const IMAGE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/418.png';

const read = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const write = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* stockage indisponible */
  }
};

export function Mustebouee() {
  const [open, setOpen] = useState(() => read(STATE_KEY) === 'pending');
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (read(STATE_KEY) !== null) return;
    const onClick = () => {
      const n = Number(read(COUNT_KEY) ?? 0) + 1;
      write(COUNT_KEY, String(n));
      if (n >= THRESHOLD) {
        write(STATE_KEY, 'pending');
        setOpen(true);
        document.removeEventListener('click', onClick, true);
      }
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  useEffect(() => {
    const d = ref.current;
    if (open && d && !d.open) d.showModal();
  }, [open]);

  if (!open) return null;

  const admit = () => {
    write(STATE_KEY, 'done');
    ref.current?.close();
    setOpen(false);
  };

  return (
    <dialog
      ref={ref}
      className="modal mustebouee"
      aria-label="Mustébouée"
      onCancel={(e) => e.preventDefault()}
    >
      <div className="mustebouee-body">
        <img src={IMAGE} alt="Mustébouée" width={260} height={260} />
        <button type="button" className="btn primary" onClick={admit}>
          J'admets que mustébouée est le meilleur pokémon, que c'est le plus mignon et qu'il est supérieur en tout point à pikachu ou axoloto
        </button>
      </div>
    </dialog>
  );
}
