import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { Mustebouee } from './Mustebouee';
import { MusteboueeCounter, MusteboueeSwarm } from './MusteboueeSwarm';
import { CursorPicker } from './CursorPicker';
import { useTiltEffect } from '../hooks/useTiltEffect';

export function Layout() {
  const { pathname } = useLocation();
  useTiltEffect();
  return (
    <>
      <div className="backdrop" aria-hidden="true">
        <span className="blob blob-1" />
        <span className="blob blob-2" />
        <span className="blob blob-3" />
      </div>
      <a href="#main" className="skip">
        Aller au contenu
      </a>
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="brand">
            <span className="ball" aria-hidden="true" /> <span className="brand-name">Pokéclopédie</span>
          </Link>
          <nav aria-label="Navigation principale">
            <NavLink to="/" end>Pokédex</NavLink>
            <NavLink to="/cards">Cartes</NavLink>
            <NavLink to="/regions">Régions</NavLink>
            <NavLink to="/equipe">Équipe & types</NavLink>
          </nav>
          <MusteboueeCounter />
          <CursorPicker />
        </div>
      </header>
      <main id="main" className="container" tabIndex={-1}>
        {/* Clé = chemin : l'animation d'entrée rejoue à chaque changement de page (pas pour les paramètres d'URL). */}
        <div className="page" key={pathname}>
          <Outlet />
        </div>
      </main>
      <footer className="site-footer container">
        <p>
          Données : <a href="https://pokeapi.co">PokéAPI</a> et <a href="https://tcgdex.dev">TCGdex</a>. Projet non officiel ; Pokémon et le JCC Pokémon sont des marques de
          leurs propriétaires. Les données absentes des sources sont signalées par « — », jamais inventées.
        </p>
      </footer>
      <Mustebouee />
      <MusteboueeSwarm />
    </>
  );
}
