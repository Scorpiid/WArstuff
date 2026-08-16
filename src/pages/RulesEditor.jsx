import { useState } from 'react'
import useStore from '../store/useStore'
import { DEFAULT_RULES } from '../store/initialRules'
import PageHeader from '../components/PageHeader'
import ConfirmDialog from '../components/ConfirmDialog'

// Generic slider field
function RuleSlider({ label, value, min = 0, max = 1, step = 0.01, onChange, hint }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-baseline">
        <label className="label mb-0">{label}</label>
        <span className="font-mono text-xs text-signal">{typeof value === 'number' ? value.toFixed(step < 0.1 ? 2 : 0) : value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full accent-signal" />
      {hint && <p className="text-text-muted text-xs">{hint}</p>}
    </div>
  )
}

function RuleNumber({ label, value, min = 0, max = 100, step = 1, onChange, hint }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-baseline">
        <label className="label mb-0">{label}</label>
        <input type="number" min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="input w-20 text-right py-0.5 text-xs" />
      </div>
      {hint && <p className="text-text-muted text-xs">{hint}</p>}
    </div>
  )
}

function Section({ title, children, icon = '◈' }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="card">
      <button
        onClick={() => setOpen(o => !o)}
        className="card-header w-full text-left hover:bg-surface-2 transition-colors"
      >
        <span className="text-signal">{icon}</span>
        <h3 className="font-display font-semibold tracking-wide flex-1">{title}</h3>
        <span className="text-text-muted">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="p-4 space-y-4">{children}</div>}
    </div>
  )
}

export default function RulesEditor() {
  const rules      = useStore(s => s.rules)
  const updateRules = useStore(s => s.updateRules)
  const updateRulesSection = useStore(s => s.updateRulesSection)
  const resetRules = useStore(s => s.resetRules)
  const [confirmReset, setConfirmReset] = useState(false)

  const set = (path, value) => {
    // path like 'randomFactorMin' or 'morale.retreatThreshold'
    const parts = path.split('.')
    if (parts.length === 1) {
      updateRules({ [parts[0]]: value })
    } else {
      updateRulesSection(parts[0], { [parts[1]]: value })
    }
  }

  const terrainKeys = Object.keys(DEFAULT_RULES.terrainModifiers)
  const modKeys     = Object.keys(DEFAULT_RULES.battleModifiers)
  const vehicleKeys = Object.keys(DEFAULT_RULES.vehicleBonuses)

  return (
    <div>
      <PageHeader
        title="Editor de reglas"
        subtitle="Todos los valores del motor de combate son editables"
        actions={
          <button className="btn-danger" onClick={() => setConfirmReset(true)}>
            Restablecer valores por defecto
          </button>
        }
      />

      <div className="space-y-4">

        {/* Random factor */}
        <Section title="Factor aleatorio" icon="◌">
          <p className="text-text-muted text-xs mb-2">Rango de multiplicador aleatorio aplicado al poder de combate. Más estrecho = resultados más predecibles.</p>
          <div className="grid grid-cols-2 gap-4">
            <RuleSlider label="Mínimo" value={rules.randomFactorMin} min={0.5} max={1.0} step={0.01} onChange={v => set('randomFactorMin', v)} />
            <RuleSlider label="Máximo" value={rules.randomFactorMax} min={1.0} max={1.5} step={0.01} onChange={v => set('randomFactorMax', v)} />
          </div>
          <RuleNumber label="Rondas máximas por batalla" value={rules.maxRounds} min={1} max={30} onChange={v => set('maxRounds', v)} />
        </Section>

        {/* Weights */}
        <Section title="Pesos de la fórmula de combate" icon="◆">
          <p className="text-text-muted text-xs mb-2">Qué tanto influye cada atributo en el poder final de combate (0–1).</p>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(rules.weights).map(([key, val]) => (
              <RuleSlider key={key} label={key.charAt(0).toUpperCase() + key.slice(1)} value={val} min={0} max={0.5} step={0.01}
                onChange={v => updateRulesSection('weights', { [key]: v })} />
            ))}
          </div>
        </Section>

        {/* Morale */}
        <Section title="Sistema de moral" icon="◉">
          <div className="grid grid-cols-2 gap-4">
            <RuleNumber label="Umbral de retirada" value={rules.morale.retreatThreshold} onChange={v => set('morale.retreatThreshold', v)}
              hint="Moral por debajo → posible retirada" />
            <RuleNumber label="Umbral de rendición" value={rules.morale.surrenderThreshold} onChange={v => set('morale.surrenderThreshold', v)} />
            <RuleNumber label="Umbral de colapso" value={rules.morale.collapseThreshold} onChange={v => set('morale.collapseThreshold', v)}
              hint="Moral por debajo → rendición inmediata" />
            <RuleNumber label="Pérdida por ronda perdida" value={rules.morale.roundLossHit} onChange={v => set('morale.roundLossHit', v)} />
            <RuleNumber label="Pérdida por baja" value={rules.morale.casualtyHit} onChange={v => set('morale.casualtyHit', v)} />
            <RuleNumber label="Pérdida por pérdida del comandante" value={rules.morale.commanderLossHit} onChange={v => set('morale.commanderLossHit', v)} />
            <RuleNumber label="Ganancia por victoria" value={rules.morale.victoryGain} onChange={v => set('morale.victoryGain', v)} />
          </div>
        </Section>

        {/* Fatigue */}
        <Section title="Sistema de fatiga" icon="◧">
          <div className="grid grid-cols-2 gap-4">
            <RuleNumber label="Fatiga por ronda" value={rules.fatigue.perRound} onChange={v => set('fatigue.perRound', v)} />
            <RuleNumber label="Umbral de alta fatiga" value={rules.fatigue.highFatigueThreshold} onChange={v => set('fatigue.highFatigueThreshold', v)} />
            <RuleSlider label="Penalidad por alta fatiga" value={rules.fatigue.highFatiguePenalty} min={0.3} max={1} step={0.01}
              onChange={v => set('fatigue.highFatiguePenalty', v)}
              hint="Multiplicador al superar el umbral" />
            <RuleNumber label="Recuperación por descanso" value={rules.fatigue.restRecovery} onChange={v => set('fatigue.restRecovery', v)} />
          </div>
        </Section>

        {/* Casualties */}
        <Section title="Tasas de bajas" icon="☠">
          <div className="grid grid-cols-2 gap-4">
            <RuleSlider label="Tasa base de muertes" value={rules.casualties.baseKillRate} min={0} max={0.5} step={0.01}
              onChange={v => set('casualties.baseKillRate', v)} />
            <RuleSlider label="Tasa base de heridos" value={rules.casualties.baseWoundRate} min={0} max={0.5} step={0.01}
              onChange={v => set('casualties.baseWoundRate', v)} />
            <RuleSlider label="Tasa base de capturas" value={rules.casualties.baseCaptureRate} min={0} max={0.3} step={0.01}
              onChange={v => set('casualties.baseCaptureRate', v)} />
            <RuleSlider label="Probabilidad de salvación médica" value={rules.casualties.medicalSaveChance} min={0} max={0.8} step={0.01}
              onChange={v => set('casualties.medicalSaveChance', v)} />
            <RuleSlider label="Prob. destrucción de vehículo" value={rules.casualties.vehicleDestroyChance} min={0} max={0.5} step={0.01}
              onChange={v => set('casualties.vehicleDestroyChance', v)} />
          </div>
        </Section>

        {/* Suppression */}
        <Section title="Sistema de supresión" icon="⚡">
          <div className="grid grid-cols-2 gap-4">
            <RuleNumber label="Supresión aplicada por ronda" value={rules.suppression.perRound} onChange={v => set('suppression.perRound', v)} />
            <RuleNumber label="Decaimiento por ronda" value={rules.suppression.decayPerRound} onChange={v => set('suppression.decayPerRound', v)} />
            <RuleNumber label="Umbral de alta supresión (%)" value={rules.suppression.highThreshold} onChange={v => set('suppression.highThreshold', v)} />
            <RuleSlider label="Penalidad de combate" value={rules.suppression.combatPenalty} min={0} max={0.6} step={0.01}
              onChange={v => set('suppression.combatPenalty', v)} />
            <RuleSlider label="Penalidad de precisión" value={rules.suppression.accuracyPenalty} min={0} max={0.6} step={0.01}
              onChange={v => set('suppression.accuracyPenalty', v)} />
          </div>
        </Section>

        {/* Terrain modifiers */}
        <Section title="Modificadores de terreno" icon="◈">
          <p className="text-text-muted text-xs mb-2">Multiplicador aplicado al poder del atacante según terreno seleccionado.</p>
          <div className="grid grid-cols-2 gap-4">
            {terrainKeys.map(key => (
              <RuleSlider key={key} label={key.charAt(0).toUpperCase() + key.slice(1)}
                value={rules.terrainModifiers[key]} min={0.3} max={1.5} step={0.01}
                onChange={v => updateRulesSection('terrainModifiers', { [key]: v })} />
            ))}
          </div>
        </Section>

        {/* Battle modifiers */}
        <Section title="Modificadores de batalla" icon="⚡">
          <div className="grid grid-cols-2 gap-4">
            {modKeys.map(key => (
              <RuleSlider key={key} label={key.replace(/([A-Z])/g, ' $1')}
                value={rules.battleModifiers[key]} min={0.3} max={1.5} step={0.01}
                onChange={v => updateRulesSection('battleModifiers', { [key]: v })} />
            ))}
          </div>
        </Section>

        {/* Vehicle bonuses */}
        <Section title="Bonificaciones de vehículos" icon="◧">
          <p className="text-text-muted text-xs mb-2">Poder adicional aportado por cada tipo de vehículo operativo.</p>
          <div className="grid grid-cols-2 gap-4">
            {vehicleKeys.map(key => (
              <RuleNumber key={key} label={key.toUpperCase()}
                value={rules.vehicleBonuses[key]} min={0} max={50}
                onChange={v => updateRulesSection('vehicleBonuses', { [key]: v })} />
            ))}
          </div>
        </Section>

        {/* Supply system toggle */}
        <div className="card p-4 flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold tracking-wide">Sistema de suministros</h3>
            <p className="text-text-muted text-xs mt-0.5">Activa/desactiva el impacto de munición, combustible y suministros médicos en el combate.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only"
              checked={rules.supplySystemEnabled}
              onChange={e => set('supplySystemEnabled', e.target.checked)} />
            <div className={`w-10 h-5 rounded-full transition-colors ${rules.supplySystemEnabled ? 'bg-signal' : 'bg-border-col'}`}>
              <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${rules.supplySystemEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
          </label>
        </div>

      </div>

      {confirmReset && (
        <ConfirmDialog
          title="Restablecer reglas"
          message="Se restaurarán todos los valores del motor de combate a los valores por defecto. ¿Continuar?"
          danger
          onConfirm={() => { resetRules(); setConfirmReset(false) }}
          onCancel={() => setConfirmReset(false)}
        />
      )}
    </div>
  )
}
