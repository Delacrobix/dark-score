import { useState } from 'react'
import { LandingHero } from './components/LandingHero'
import { AppShell } from './components/AppShell'

type View = 'landing' | 'app'

export default function App() {
  const [view, setView] = useState<View>('landing')

  return view === 'landing' ? (
    <LandingHero onGetStarted={() => setView('app')} />
  ) : (
    <AppShell onGoHome={() => setView('landing')} />
  )
}
