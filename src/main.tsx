import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes, Link, useParams } from 'react-router-dom';
import { Layout } from './components/Layout';
import { PokemonProvider } from './hooks/usePokemonList';
import { CardsPage } from './pages/CardsPage';
import { PokedexPage } from './pages/PokedexPage';
import { RegionsPage } from './pages/RegionsPage';
import { TeamPage } from './pages/TeamPage';
import { SetPage } from './pages/SetPage';
import { ComparePage } from './pages/ComparePage';
import './styles/global.css';

function LegacyPokemonRedirect() {
  return <Navigate to={`/?p=${useParams().id}`} replace />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <PokemonProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<PokedexPage />} />
            <Route path="pokedex" element={<Navigate to="/" replace />} />
            <Route path="pokedex/:id" element={<LegacyPokemonRedirect />} />
            <Route path="sets" element={<Navigate to="/" replace />} />
            <Route path="sets/:lang/:id" element={<SetPage />} />
            <Route path="cards" element={<CardsPage />} />
            <Route path="comparer" element={<ComparePage />} />
            <Route path="regions" element={<RegionsPage />} />
            <Route path="equipe" element={<TeamPage />} />
            <Route
              path="*"
              element={
                <p className="status">
                  Page introuvable. <Link to="/">Retour à l'accueil</Link>
                </p>
              }
            />
          </Route>
        </Routes>
      </PokemonProvider>
    </BrowserRouter>
  </StrictMode>,
);
