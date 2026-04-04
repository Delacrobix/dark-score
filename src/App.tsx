import { useState } from 'react'
import { ErrorBoundary } from './components/ErrorBoundary'
import { LandingHero } from './components/LandingHero'
import { AppShell } from './components/AppShell'
import { AboutPage } from './components/AboutPage'

type View = 'landing' | 'app' | 'about'

export default function App() {
  const [view, setView] = useState<View>('landing')

  return (
    <ErrorBoundary>
      {view === 'landing' && (
        <LandingHero onGetStarted={() => setView('app')} onAbout={() => setView('about')} />
      )}
      {view === 'app' && (
        <AppShell onGoHome={() => setView('landing')} onAbout={() => setView('about')} />
      )}
      {view === 'about' && (
        <AboutPage onBack={() => setView('landing')} />
      )}
    </ErrorBoundary>
  )
}
