import React, { Suspense, useState } from 'react';
import GameComponent from './components/Game';
import HomeHub from './components/HomeHub';
import './App.css';

// Lazy-load studio so it never enters the game bundle
const StudioApp = React.lazy(() => import('./studio/StudioApp'));

function isStudioRoute(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname || '';
  const hash = window.location.hash || '';
  return path.startsWith('/studio') || hash === '#studio' || hash.startsWith('#/studio');
}

type View = 'menu' | 'game';

function App() {
  const studio = isStudioRoute();
  const [view, setView] = useState<View>('menu');

  if (studio) {
    return (
      <Suspense fallback={<div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>Loading studio…</div>}>
        <StudioApp />
      </Suspense>
    );
  }

  if (view === 'menu') {
    return <HomeHub onStartBattle={() => setView('game')} />;
  }

  return (
    <div className="App">
      <GameComponent />
    </div>
  );
}

export default App;
