import { createContext, useContext, type ReactNode } from 'react';
import { getPokemonList } from '../api/pokeapi';
import type { PokemonSummary } from '../domain/types';
import { useAsync, type AsyncState } from './useAsync';

const Ctx = createContext<AsyncState<PokemonSummary[]> | null>(null);

export function PokemonProvider({ children }: { children: ReactNode }) {
  const state = useAsync(() => getPokemonList(), []);
  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

export function usePokemonList(): AsyncState<PokemonSummary[]> {
  const v = useContext(Ctx);
  if (!v) throw new Error('PokemonProvider manquant');
  return v;
}
