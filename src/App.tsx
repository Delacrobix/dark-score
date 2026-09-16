import { lazy, Suspense } from 'react'
import { Route, Switch, Redirect, useRouter } from 'wouter'
import { ErrorBoundary } from './components/ErrorBoundary'
import { LandingPage } from './components/LandingPage'
import { AboutPage } from './components/AboutPage'
import { RouteEffects } from './components/RouteEffects'
import { ROUTES } from './lib/routes'

// The editor is code-split so the landing stays light. Landing and About are
// static imports: they are small and must render on the server (prerender).
const AppShell = lazy(() => import('./components/AppShell').then((m) => ({ default: m.AppShell })))

/** Unknown path → home of the current language, without a trailing slash. */
function HomeRedirect() {
  const { base } = useRouter()
  return <Redirect to={`~${base || '/'}`} replace />
}

/** Pages, relative to the language prefix ('/' or '/es'). */
function Pages() {
  return (
    <Switch>
      <Route path={ROUTES.home} component={LandingPage} />
      <Route path={ROUTES.app} component={AppShell} />
      <Route path={ROUTES.about} component={AboutPage} />
      <Route>
        <HomeRedirect />
      </Route>
    </Switch>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <RouteEffects />
      <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
        <Switch>
          <Route path="/es" nest>
            <Pages />
          </Route>
          <Route>
            <Pages />
          </Route>
        </Switch>
      </Suspense>
    </ErrorBoundary>
  )
}
