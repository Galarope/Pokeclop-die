import { NavLink, Outlet, Link } from 'react-router-dom';
import { Mustebouee } from './Mustebouee';

export function Layout() {
  return (
    <>
      <a href="#main" className="skip">
        Aller au contenu
      </a>
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="brand">
            <span className="ball" aria-hidden="true" /> Pokéclopédie
          </Link>
          <nav aria-label="Navigation principale">
            <NavLink to="/" end>Pokédex</NavLink>
            <NavLink to="/cards">Cartes</NavLink>
            <NavLink to="/regions">Régions</NavLink>
            <NavLink to="/equipe">Équipe & types</NavLink>
          </nav>
        </div>
      </header>
      <main id="main" className="container" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="site-footer container">
        <p>
          Données : <a href="https://pokeapi.co">PokéAPI</a> et <a href="https://tcgdex.dev">TCGdex</a>. Projet non officiel ; Pokémon et le JCC Pokémon sont des marques de
          leurs propriétaires. Les données absentes des sources sont signalées par « — », jamais inventées.
        </p>
      </footer>
      <Mustebouee />
    </>
  );
}
