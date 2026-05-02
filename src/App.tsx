import React, { Suspense } from 'react';
import GameComponent from './components/Game';
import './App.css';

// Lazy-load studio so it never enters the game bundle
const StudioApp = React.lazy(() => import('./studio/StudioApp'));

function isStudioRoute(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname || '';
  const hash = window.location.hash || '';
  return path.startsWith('/studio') || hash === '#studio' || hash.startsWith('#/studio');
}

function App() {
  const studio = isStudioRoute();
  if (studio) {
    return (
      <Suspense fallback={<div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>Loading studio…</div>}>
        <StudioApp />
      </Suspense>
    );
  }
  return (
    <div className="App">
      <GameComponent />
    </div>
  );
}

export default App;
