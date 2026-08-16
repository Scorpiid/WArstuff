import Modal from './Modal'

export default function ConfirmDialog({ title = '¿Confirmar acción?', message, onConfirm, onCancel, danger = false }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-text-muted mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button className="btn-secondary" onClick={onCancel}>Cancelar</button>
        <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm}>
          Confirmar
        </button>
      </div>
    </Modal>
  )
}
