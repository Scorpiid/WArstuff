import { useState } from 'react'
import useStore from '../store/useStore'
import { DEFAULT_RULES } from '../store/initialRules'
import { DEFAULT_TURN_EFFECTS } from '../engine/turnEngine'
import PageHeader from '../components/PageHeader'
import ConfirmDialog from '../components/ConfirmDialog'
import { useT } from '../i18n/LanguageContext'

function RuleSlider({ label, value, min=0, max=1, step=0.01, onChange, hint }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-baseline">
        <label className="label mb-0">{label}</label>
        <span className="font-mono text-xs text-signal">{typeof value === 'number' ? value.toFixed(step < 0.1 ? 2 : 0) : value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))} className="w-full accent-signal" />
      {hint && <p className="text-text-muted text-xs">{hint}</p>}
    </div>
  )
}

function RuleNumber({ label, value, min=0, max=100, step=1, onChange, hint }) {
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

function Section({ title, children, desc }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="card">
      <button onClick={() => setOpen(o => !o)}
        className="card-header w-full text-left hover:bg-surface-2 transition-colors">
        <span className="text-signal">◈</span>
        <h3 className="font-display font-semibold tracking-wide flex-1">{title}</h3>
        <span className="text-text-muted">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="p-4 space-y-4">
          {desc && <p className="text-text-muted text-xs">{desc}</p>}
          {children}
        </div>
      )}
    </div>
  )
}

export default function RulesEditor() {
  const { t, lang } = useT()
  const r = t.rules
  const rules              = useStore(s => s.rules)
  const turnEffects        = useStore(s => s.turnEffects)
  const updateRules        = useStore(s => s.updateRules)
  const updateRulesSection = useStore(s => s.updateRulesSection)
  const resetRules         = useStore(s => s.resetRules)
  const updateTurnEffects  = useStore(s => s.updateTurnEffects)
  const resetTurnEffects   = useStore(s => s.resetTurnEffects)
  const [confirmReset, setConfirmReset] = useState(false)

  const set = (path, value) => {
    const parts = path.split('.')
    if (parts.length === 1) updateRules({ [parts[0]]: value })
    else updateRulesSection(parts[0], { [parts[1]]: value })
  }

  const terrainKeys = Object.keys(DEFAULT_RULES.terrainModifiers)
  const modKeys     = Object.keys(DEFAULT_RULES.battleModifiers)
  const vehicleKeys = Object.keys(DEFAULT_RULES.vehicleBonuses)

  return (
    <div>
      <PageHeader title={r.title} subtitle={r.subtitle}
        actions={<button className="btn-danger" onClick={() => setConfirmReset(true)}>{r.btnReset}</button>} />

      <div className="space-y-4">
        <Section title={r.sectionRandom} desc={r.descRandom}>
          <div className="grid grid-cols-2 gap-4">
            <RuleSlider label={r.randomMin} value={rules.randomFactorMin} min={0.5} max={1.0} step={0.01} onChange={v => set('randomFactorMin', v)} />
            <RuleSlider label={r.randomMax} value={rules.randomFactorMax} min={1.0} max={1.5} step={0.01} onChange={v => set('randomFactorMax', v)} />
          </div>
          <RuleNumber label={r.maxRounds} value={rules.maxRounds} min={1} max={30} onChange={v => set('maxRounds', v)} />
        </Section>

        <Section title={r.sectionWeights} desc={r.descWeights}>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(rules.weights).map(([key, val]) => (
              <RuleSlider key={key} label={key.charAt(0).toUpperCase() + key.slice(1)}
                value={val} min={0} max={0.5} step={0.01}
                onChange={v => updateRulesSection('weights', { [key]: v })} />
            ))}
          </div>
        </Section>

        <Section title={r.sectionMorale}>
          <div className="grid grid-cols-2 gap-4">
            <RuleNumber label={r.moraleRetreat}     value={rules.morale.retreatThreshold}   hint={r.moraleRetreatHint}   onChange={v => set('morale.retreatThreshold', v)} />
            <RuleNumber label={r.moraleSurrender}   value={rules.morale.surrenderThreshold}                              onChange={v => set('morale.surrenderThreshold', v)} />
            <RuleNumber label={r.moraleCollapse}    value={rules.morale.collapseThreshold}   hint={r.moraleCollapseHint}  onChange={v => set('morale.collapseThreshold', v)} />
            <RuleNumber label={r.moraleRoundLoss}   value={rules.morale.roundLossHit}                                    onChange={v => set('morale.roundLossHit', v)} />
            <RuleNumber label={r.moraleCasualtyHit} value={rules.morale.casualtyHit}                                     onChange={v => set('morale.casualtyHit', v)} />
            <RuleNumber label={r.moraleCommanderLoss} value={rules.morale.commanderLossHit}                              onChange={v => set('morale.commanderLossHit', v)} />
            <RuleNumber label={r.moraleVictoryGain} value={rules.morale.victoryGain}                                     onChange={v => set('morale.victoryGain', v)} />
          </div>
        </Section>

        <Section title={r.sectionFatigue}>
          <div className="grid grid-cols-2 gap-4">
            <RuleNumber label={r.fatiguePerRound}  value={rules.fatigue.perRound}              onChange={v => set('fatigue.perRound', v)} />
            <RuleNumber label={r.fatigueThreshold} value={rules.fatigue.highFatigueThreshold}  onChange={v => set('fatigue.highFatigueThreshold', v)} />
            <RuleSlider label={r.fatiguePenalty}   value={rules.fatigue.highFatiguePenalty} min={0.3} max={1} step={0.01} hint={r.fatiguePenaltyHint} onChange={v => set('fatigue.highFatiguePenalty', v)} />
            <RuleNumber label={r.fatigueRest}      value={rules.fatigue.restRecovery}           onChange={v => set('fatigue.restRecovery', v)} />
          </div>
        </Section>

        <Section title={r.sectionCasualties}>
          <div className="grid grid-cols-2 gap-4">
            <RuleSlider label={r.casKillRate}   value={rules.casualties.baseKillRate}        min={0} max={0.5} step={0.01} onChange={v => set('casualties.baseKillRate', v)} />
            <RuleSlider label={r.casWoundRate}  value={rules.casualties.baseWoundRate}       min={0} max={0.5} step={0.01} onChange={v => set('casualties.baseWoundRate', v)} />
            <RuleSlider label={r.casCaptureRate}value={rules.casualties.baseCaptureRate}     min={0} max={0.3} step={0.01} onChange={v => set('casualties.baseCaptureRate', v)} />
            <RuleSlider label={r.casMedSave}    value={rules.casualties.medicalSaveChance}  min={0} max={0.8} step={0.01} onChange={v => set('casualties.medicalSaveChance', v)} />
            <RuleSlider label={r.casVehicle}    value={rules.casualties.vehicleDestroyChance} min={0} max={0.5} step={0.01} onChange={v => set('casualties.vehicleDestroyChance', v)} />
          </div>
        </Section>

        <Section title={r.sectionSuppression}>
          <div className="grid grid-cols-2 gap-4">
            <RuleNumber label={r.suppPerRound}   value={rules.suppression.perRound}          onChange={v => set('suppression.perRound', v)} />
            <RuleNumber label={r.suppDecay}      value={rules.suppression.decayPerRound}     onChange={v => set('suppression.decayPerRound', v)} />
            <RuleNumber label={r.suppThreshold}  value={rules.suppression.highThreshold}     onChange={v => set('suppression.highThreshold', v)} />
            <RuleSlider label={r.suppCombat}     value={rules.suppression.combatPenalty}  min={0} max={0.6} step={0.01} onChange={v => set('suppression.combatPenalty', v)} />
            <RuleSlider label={r.suppAccuracy}   value={rules.suppression.accuracyPenalty} min={0} max={0.6} step={0.01} onChange={v => set('suppression.accuracyPenalty', v)} />
          </div>
        </Section>

        <Section title={r.sectionTerrain} desc={r.descTerrain}>
          <div className="grid grid-cols-2 gap-4">
            {terrainKeys.map(key => (
              <RuleSlider key={key} label={key.charAt(0).toUpperCase() + key.slice(1)}
                value={rules.terrainModifiers[key]} min={0.3} max={1.5} step={0.01}
                onChange={v => updateRulesSection('terrainModifiers', { [key]: v })} />
            ))}
          </div>
        </Section>

        <Section title={r.sectionBattleMods}>
          <div className="grid grid-cols-2 gap-4">
            {modKeys.map(key => (
              <RuleSlider key={key} label={key.replace(/([A-Z])/g, ' $1')}
                value={rules.battleModifiers[key]} min={0.3} max={1.5} step={0.01}
                onChange={v => updateRulesSection('battleModifiers', { [key]: v })} />
            ))}
          </div>
        </Section>

        <Section title={r.sectionVehicles} desc={r.descVehicles}>
          <div className="grid grid-cols-2 gap-4">
            {vehicleKeys.map(key => (
              <RuleNumber key={key} label={key.toUpperCase()}
                value={rules.vehicleBonuses[key]} min={0} max={50}
                onChange={v => updateRulesSection('vehicleBonuses', { [key]: v })} />
            ))}
          </div>
        </Section>

        <div className="card p-4 flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold tracking-wide">{r.sectionSupply}</h3>
            <p className="text-text-muted text-xs mt-0.5">{r.descSupply}</p>
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

        {/* Turn effects section */}
        <div className="card">
          <div className="flex items-center justify-between card-header">
            <div className="flex items-center gap-2">
              <span className="text-signal">⏭</span>
              <h3 className="font-display font-semibold tracking-wide">
                {lang === 'en' ? 'Turn effects' : 'Efectos por turno'}
              </h3>
            </div>
            <button
              type="button"
              className="btn-ghost text-xs px-2 py-1"
              onClick={resetTurnEffects}
            >
              {lang === 'en' ? 'Reset' : 'Restablecer'}
            </button>
          </div>
          <div className="p-4 space-y-4">
            <p className="text-text-muted text-xs">
              {lang === 'en'
                ? 'Values applied to each squad when advancing a turn. "Engaged" squads receive reduced recovery.'
                : 'Valores aplicados a cada escuadra al avanzar turno. Las escuadras "En combate" reciben recuperación reducida.'}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <RuleNumber
                label={lang === 'en' ? 'Fatigue recovery (active)' : 'Recuperación de fatiga (activa)'}
                value={turnEffects?.fatigueRecovery ?? 12}
                min={0} max={50}
                onChange={v => updateTurnEffects({ fatigueRecovery: v })}
              />
              <RuleNumber
                label={lang === 'en' ? 'Fatigue recovery (engaged)' : 'Recuperación de fatiga (en combate)'}
                value={turnEffects?.engagedFatigueRecovery ?? 4}
                min={0} max={20}
                onChange={v => updateTurnEffects({ engagedFatigueRecovery: v })}
              />
              <RuleNumber
                label={lang === 'en' ? 'Morale drift rate' : 'Tasa de deriva de moral'}
                value={turnEffects?.moraleDriftRate ?? 3}
                min={0} max={20}
                onChange={v => updateTurnEffects({ moraleDriftRate: v })}
                hint={lang === 'en' ? 'Per turn toward baseline' : 'Por turno hacia la base'}
              />
              <RuleNumber
                label={lang === 'en' ? 'Morale baseline' : 'Moral base'}
                value={turnEffects?.moraleBaseline ?? 75}
                min={0} max={100}
                onChange={v => updateTurnEffects({ moraleBaseline: v })}
                hint={lang === 'en' ? 'Morale drifts toward this value' : 'La moral deriva hacia este valor'}
              />
              <RuleNumber
                label={lang === 'en' ? 'Supply regen % (active)' : 'Regeneración suministros (activa)'}
                value={turnEffects?.supplyRegen ?? 15}
                min={0} max={100}
                onChange={v => updateTurnEffects({ supplyRegen: v })}
              />
              <RuleNumber
                label={lang === 'en' ? 'Supply regen % (engaged)' : 'Regeneración suministros (en combate)'}
                value={turnEffects?.engagedSupplyRegen ?? 5}
                min={0} max={50}
                onChange={v => updateTurnEffects({ engagedSupplyRegen: v })}
              />
            </div>
          </div>
        </div>

      {confirmReset && (
        <ConfirmDialog title={r.resetTitle} message={r.resetMsg} danger
          onConfirm={() => { resetRules(); setConfirmReset(false) }}
          onCancel={() => setConfirmReset(false)} />
      )}
    </div>
  )
}