import { NavLink, useLocation } from 'react-router-dom'
import useStore from '../store/useStore'
import { useT } from '../i18n/LanguageContext'

export default function Sidebar() {
  const { t, lang, toggle } = useT()
  const campaignName = useStore(s => s.campaignName)
  const currentTurn  = useStore(s => s.currentTurn)
  const battles      = useStore(s => s.battles)
  const nations      = useStore(s => s.nations)

  const ongoingBattles = battles.filter(b => b.status === 'IN_PROGRESS').length

  const NAV_ITEMS = [
    { to: '/',          icon: '▣', label: t.nav.dashboard },
    { to: '/nations',   icon: '◈', label: t.nav.nations },
    { to: '/squads',    icon: '◆', label: t.nav.squads },
    { to: '/vehicles',  icon: '⬡', label: t.nav.vehicles },
    { to: '/vessels',   icon: '⚓', label: t.nav.vessels },
    { to: '/battle',    icon: '⚔', label: t.nav.simulator },
    { to: '/battles',   icon: '◎', label: t.nav.battles },
    { to: '/log',       icon: '≡', label: t.nav.log },
    { to: '/rules',     icon: '⚙', label: t.nav.rules },
    { to: '/stats',     icon: '◈', label: t.nav.statistics },
    { to: '/settings',  icon: '↓', label: t.nav.saveLoad },
  ]

  return (
    <aside className="w-56 shrink-0 bg-surface border-r border-border-col flex flex-col h-screen sticky top-0">
      {/* Logo / Campaign */}
      <div className="px-4 py-5 border-b border-border-col">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-signal text-lg">✦</span>
          <span className="font-display font-bold text-base tracking-widest text-text-primary uppercase">{t.appTitle}</span>
        </div>
        <p className="text-text-muted text-xs truncate">{campaignName}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-stat text-text-muted uppercase tracking-widest">{t.sidebar.turn}</span>
          <span className="font-mono text-signal text-xs font-medium">{currentTurn}</span>
          {ongoingBattles > 0 && (
            <span className="ml-auto badge bg-danger/20 text-danger border border-danger/30 text-stat">
              {ongoingBattles} {ongoingBattles > 1 ? t.sidebar.battles2 : t.sidebar.battle}
            </span>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors relative
               ${isActive
                 ? 'text-signal bg-signal/5 border-r-2 border-signal'
                 : 'text-text-muted hover:text-text-primary hover:bg-surface-2'
               }`
            }
          >
            <span className="w-4 text-center text-base leading-none">{item.icon}</span>
            <span className="font-display font-medium tracking-wide">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer: stats + language toggle */}
      <div className="border-t border-border-col px-4 py-3 space-y-2">
        <div className="flex justify-between">
          <span className="text-stat text-text-muted uppercase tracking-widest">{t.sidebar.nations}</span>
          <span className="font-mono text-xs text-signal">{nations.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-stat text-text-muted uppercase tracking-widest">{t.sidebar.battles}</span>
          <span className="font-mono text-xs text-signal">{battles.length}</span>
        </div>

        {/* Language toggle button */}
        <button
          onClick={toggle}
          className="w-full mt-1 flex items-center justify-between px-3 py-2 rounded border border-border-col bg-deep-night hover:border-signal/40 hover:text-signal transition-colors group"
          title={lang === 'es' ? 'Switch to English' : 'Cambiar a Español'}
        >
          <div className="flex items-center gap-2">
            <span className="text-base leading-none">{lang === 'es' ? '🇪🇸' : '🇬🇧'}</span>
            <span className="font-mono text-xs text-text-muted group-hover:text-signal transition-colors">
              {lang === 'es' ? 'Español' : 'English'}
            </span>
          </div>
          <span className="font-mono text-stat text-text-muted group-hover:text-signal transition-colors">
            {lang === 'es' ? '→ EN' : '→ ES'}
          </span>
        </button>
      </div>
    </aside>
  )
}
