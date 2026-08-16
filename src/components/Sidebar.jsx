import { NavLink, useLocation } from 'react-router-dom'
import useStore from '../store/useStore'

const NAV_ITEMS = [
  { to: '/',           icon: '▣', label: 'Dashboard' },
  { to: '/nations',    icon: '◈', label: 'Naciones' },
  { to: '/squads',     icon: '◆', label: 'Escuadras' },
  { to: '/personnel',  icon: '◉', label: 'Personal' },
  { to: '/vehicles',   icon: '◧', label: 'Vehículos' },
  { to: '/battle',     icon: '⚔', label: 'Simulador' },
  { to: '/battles',    icon: '◎', label: 'Batallas' },
  { to: '/log',        icon: '≡', label: 'Registro' },
  { to: '/rules',      icon: '⚙', label: 'Reglas' },
  { to: '/stats',      icon: '◈', label: 'Estadísticas' },
  { to: '/settings',   icon: '↓', label: 'Guardar/Cargar' },
]

export default function Sidebar() {
  const campaignName = useStore(s => s.campaignName)
  const currentTurn  = useStore(s => s.currentTurn)
  const battles      = useStore(s => s.battles)
  const nations      = useStore(s => s.nations)

  const ongoingBattles = battles.filter(b => b.status === 'IN_PROGRESS').length

  return (
    <aside className="w-56 shrink-0 bg-surface border-r border-border-col flex flex-col h-screen sticky top-0">
      {/* Logo / Campaign */}
      <div className="px-4 py-5 border-b border-border-col">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-signal text-lg">✦</span>
          <span className="font-display font-bold text-base tracking-widest text-text-primary uppercase">WarSim</span>
        </div>
        <p className="text-text-muted text-xs truncate">{campaignName}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-stat text-text-muted uppercase tracking-widest">Turno</span>
          <span className="font-mono text-signal text-xs font-medium">{currentTurn}</span>
          {ongoingBattles > 0 && (
            <span className="ml-auto badge bg-danger/20 text-danger border border-danger/30 text-stat">
              {ongoingBattles} batalla{ongoingBattles > 1 ? 's' : ''}
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

      {/* Footer stats */}
      <div className="border-t border-border-col px-4 py-3 space-y-1.5">
        <div className="flex justify-between">
          <span className="text-stat text-text-muted uppercase tracking-widest">Naciones</span>
          <span className="font-mono text-xs text-signal">{nations.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-stat text-text-muted uppercase tracking-widest">Batallas</span>
          <span className="font-mono text-xs text-signal">{battles.length}</span>
        </div>
      </div>
    </aside>
  )
}
