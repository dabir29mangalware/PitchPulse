import type { PropsWithChildren } from 'react'
import type { Screen } from '../types'

interface AppShellProps extends PropsWithChildren {
  screen: Screen
  onLogoClick: () => void
  onNavigateHistory: () => void
  historyCount?: number
}

export function AppShell({
  children,
  screen,
  onLogoClick,
  onNavigateHistory,
  historyCount = 0,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="site-header">
        <button className="brand" onClick={onLogoClick} aria-label="Go to Pitchpulse home">
          <span className="brand-mark">P</span>
          <span>pitchpulse</span>
        </button>

        <nav className="header-nav" aria-label="Main navigation">
          <button
            className={`nav-link-btn ${screen === 'setup' ? 'is-active' : ''}`}
            onClick={onLogoClick}
          >
            Practice Room
          </button>
          <button
            className={`nav-link-btn ${screen === 'history' ? 'is-active' : ''}`}
            onClick={onNavigateHistory}
          >
            History {historyCount > 0 ? `(${historyCount})` : ''}
          </button>
        </nav>

        <div className="header-status">
          <span className="status-dot" />
          {screen === 'rehearsal' ? 'Practice in progress' : 'Private practice room'}
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
