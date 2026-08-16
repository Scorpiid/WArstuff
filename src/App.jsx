import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'

import Dashboard    from './pages/Dashboard'
import Nations      from './pages/Nations'
import Squads       from './pages/Squads'
import Personnel    from './pages/Personnel'
import Vehicles     from './pages/Vehicles'
import BattleSim    from './pages/BattleSim'
import Battles      from './pages/Battles'
import EventLog     from './pages/EventLog'
import RulesEditor  from './pages/RulesEditor'
import Statistics   from './pages/Statistics'
import Settings     from './pages/Settings'

export default function App() {
  return (
    <div className="flex min-h-screen bg-deep-night text-text-primary">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <Routes>
            <Route path="/"          element={<Dashboard />} />
            <Route path="/nations"   element={<Nations />} />
            <Route path="/squads"    element={<Squads />} />
            <Route path="/personnel" element={<Personnel />} />
            <Route path="/vehicles"  element={<Vehicles />} />
            <Route path="/battle"    element={<BattleSim />} />
            <Route path="/battles"   element={<Battles />} />
            <Route path="/log"       element={<EventLog />} />
            <Route path="/rules"     element={<RulesEditor />} />
            <Route path="/stats"     element={<Statistics />} />
            <Route path="/settings"  element={<Settings />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
