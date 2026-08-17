import Modal from './Modal'
import { useT } from '../i18n/LanguageContext'

export default function ConfirmDialog({ title, message, onConfirm, onCancel, danger = false }) {
  const { t } = useT()
  return (
    <Modal title={title || t.common.confirmAction} onClose={onCancel}>
      <p className="text-text-muted mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button className="btn-secondary" onClick={onCancel}>{t.common.cancel}</button>
        <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm}>
          {t.common.confirm}
        </button>
      </div>
    </Modal>
  )
}
