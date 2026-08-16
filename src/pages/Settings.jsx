import { useRef, useState } from 'react'
import useStore from '../store/useStore'
import PageHeader from '../components/PageHeader'
import ConfirmDialog from '../components/ConfirmDialog'

export default function Settings() {
  const exportCampaign = useStore(s => s.exportCampaign)
  const importCampaign = useStore(s => s.importCampaign)
  const resetCampaign  = useStore(s => s.resetCampaign)
  const campaignName   = useStore(s => s.campaignName)

  const fileInputRef   = useRef(null)
  const [importError,  setImportError]  = useState('')
  const [importOk,     setImportOk]     = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  const handleExport = () => {
    const json = exportCampaign()
    const blob = new Blob([json], { type: 'application/json' })
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
      if (result.ok) {
        setImportOk(true)
        setTimeout(() => setImportOk(false), 3000)
      } else {
        setImportError(result.error || 'Error al importar el archivo.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div>
      <PageHeader title="Guardar / Cargar campaña" subtitle="Exporta e importa el estado completo de la campaña en formato JSON" />

      <div className="max-w-xl space-y-4">
        {/* Export */}
        <div className="card p-5">
          <h2 className="font-display font-semibold text-lg tracking-wide mb-1">Exportar campaña</h2>
          <p className="text-text-muted text-sm mb-4">
            Descarga un archivo JSON con naciones, escuadras, personal, vehículos, batallas, eventos y configuración de reglas.
          </p>
          <button className="btn-primary" onClick={handleExport}>
            ↓ Descargar campaña
          </button>
        </div>

        {/* Import */}
        <div className="card p-5">
          <h2 className="font-display font-semibold text-lg tracking-wide mb-1">Cargar campaña</h2>
          <p className="text-text-muted text-sm mb-4">
            Importa un archivo JSON exportado previamente. Reemplaza el estado actual de la campaña.
          </p>
          <div className="bg-warn/10 border border-warn/20 rounded p-2 text-warn text-xs mb-4">
            Cargar una campaña reemplaza todos los datos actuales. Exporta primero si quieres conservarlos.
          </div>
          <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
            ↑ Seleccionar archivo...
          </button>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          {importOk    && <p className="text-safe text-xs mt-2">✓ Campaña importada correctamente.</p>}
          {importError && <p className="text-danger text-xs mt-2">✕ Error: {importError}</p>}
        </div>

        {/* Reset */}
        <div className="card p-5 border-danger/20">
          <h2 className="font-display font-semibold text-lg tracking-wide text-danger mb-1">Reiniciar campaña</h2>
          <p className="text-text-muted text-sm mb-4">
            Elimina todos los datos de la campaña (naciones, escuadras, batallas, eventos) y restaura las reglas por defecto.
            Esta acción no se puede deshacer.
          </p>
          <button className="btn-danger" onClick={() => setConfirmReset(true)}>
            ✕ Reiniciar todo
          </button>
        </div>
      </div>

      {confirmReset && (
        <ConfirmDialog
          title="Reiniciar campaña"
          message="Se eliminarán TODOS los datos: naciones, escuadras, personal, vehículos, batallas y eventos. Las reglas volverán a los valores por defecto. Esta acción no se puede deshacer."
          danger
          onConfirm={() => { resetCampaign(); setConfirmReset(false) }}
          onCancel={() => setConfirmReset(false)}
        />
      )}
    </div>
  )
}
