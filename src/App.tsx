import { lazy, Suspense, useState } from 'react'
import { ErrorBoundary } from './components/ErrorBoundary'
import { LandingHero } from './components/LandingHero'

// The editor and the About page are code-split so the landing stays light.
const AppShell = lazy(() => import('./components/AppShell').then((m) => ({ default: m.AppShell })))
const AboutPage = lazy(() => import('./components/AboutPage').then((m) => ({ default: m.AboutPage })))

type View = 'landing' | 'app' | 'about'

export default function App() {
  const [view, setView] = useState<View>('landing')

  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
        {view === 'landing' && (
          <LandingHero onGetStarted={() => setView('app')} onAbout={() => setView('about')} />
        )}
        {view === 'app' && (
          <AppShell onGoHome={() => setView('landing')} onAbout={() => setView('about')} />
        )}
        {view === 'about' && (
          <AboutPage onBack={() => setView('landing')} />
        )}
      </Suspense>
    </ErrorBoundary>
  )
}
