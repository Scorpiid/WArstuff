import { useRef, useState } from 'react'
import useStore from '../store/useStore'
import PageHeader from '../components/PageHeader'
import ConfirmDialog from '../components/ConfirmDialog'
import { useT } from '../i18n/LanguageContext'

export default function Settings() {
  const { t } = useT()
  const s = t.settings
  const exportCampaign = useStore(st => st.exportCampaign)
  const importCampaign = useStore(st => st.importCampaign)
  const resetCampaign  = useStore(st => st.resetCampaign)
  const campaignName   = useStore(st => st.campaignName)

  const fileInputRef   = useRef(null)
  const [importError,  setImportError]  = useState('')
  const [importOk,     setImportOk]     = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  const handleExport = () => {
    const json = exportCampaign()
    const blob = new Blob([json], { type:'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    a.href     = url
    a.download = `warsim-${campaignName.replace(/\s+/g, '-').toLowerCase()}-${date}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError('')
    setImportOk(false)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = importCampaign(ev.target.result)
      if (result.ok) { setImportOk(true); setTimeout(() => setImportOk(false), 3000) }
      else setImportError(result.error || s.importErrorFallback)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div>
      <PageHeader title={s.title} subtitle={s.subtitle} />
      <div className="max-w-xl space-y-4">
        <div className="card p-5">
          <h2 className="font-display font-semibold text-lg tracking-wide mb-1">{s.exportTitle}</h2>
          <p className="text-text-muted text-sm mb-4">{s.exportDesc}</p>
          <button className="btn-primary" onClick={handleExport}>{s.exportBtn}</button>
        </div>

        <div className="card p-5">
          <h2 className="font-display font-semibold text-lg tracking-wide mb-1">{s.importTitle}</h2>
          <p className="text-text-muted text-sm mb-4">{s.importDesc}</p>
          <div className="bg-warn/10 border border-warn/20 rounded p-2 text-warn text-xs mb-4">{s.importWarning}</div>
          <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>{s.importBtn}</button>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          {importOk    && <p className="text-safe text-xs mt-2">{s.importOk}</p>}
          {importError && <p className="text-danger text-xs mt-2">{s.importError.replace('{msg}', importError)}</p>}
        </div>

        <div className="card p-5 border-danger/20">
          <h2 className="font-display font-semibold text-lg tracking-wide text-danger mb-1">{s.resetTitle}</h2>
          <p className="text-text-muted text-sm mb-4">{s.resetDesc}</p>
          <button className="btn-danger" onClick={() => setConfirmReset(true)}>{s.resetBtn}</button>
        </div>
      </div>

      {confirmReset && (
        <ConfirmDialog title={s.resetConfirmTitle} message={s.resetConfirmMsg} danger
          onConfirm={() => { resetCampaign(); setConfirmReset(false) }}
          onCancel={() => setConfirmReset(false)} />
      )}
    </div>
  )
}
