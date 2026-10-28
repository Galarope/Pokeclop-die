import { useEffect, useState } from 'react';

const KEY = 'pokeclopedie:cursor';

export const CURSORS = [
  { id: 'mustebouee', label: 'Mustébouée' },
  { id: 'axoloto', label: 'Axoloto' },
  { id: 'pikachu', label: 'Pikachu' },
] as const;

type CursorId = (typeof CURSORS)[number]['id'];

function readStored(): CursorId | null {
  try {
    const v = localStorage.getItem(KEY);
    return CURSORS.some((c) => c.id === v) ? (v as CursorId) : null;
  } catch {
    return null;
  }
}

export function CursorPicker() {
  const [cursor, setCursor] = useState<CursorId | null>(readStored);

  useEffect(() => {
    const root = document.documentElement;
    if (cursor) root.dataset.cursor = cursor;
    else delete root.dataset.cursor;
    try {
      if (cursor) localStorage.setItem(KEY, cursor);
      else localStorage.removeItem(KEY);
    } catch {
      /* stockage indisponible */
    }
  }, [cursor]);

  return (
    <div className="cursor-picker" role="group" aria-label="Choix du curseur">
      {CURSORS.map((c) => (
        <button
          key={c.id}
          type="button"
          className={cursor === c.id ? 'active' : undefined}
          aria-pressed={cursor === c.id}
          title={c.label}
          aria-label={c.label}
          onClick={() => setCursor(cursor === c.id ? null : c.id)}
        >
          <img src={`/cursors/${c.id}.png`} alt="" width={40} height={30} />
        </button>
      ))}
    </div>
  );
}
