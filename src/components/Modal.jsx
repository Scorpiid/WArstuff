import { useEffect } from 'react'
import { useT } from '../i18n/LanguageContext'

export default function Modal({ title, onClose, children, wide = false }) {
  const { t } = useT()

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-deep-night/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`bg-surface border border-border-col rounded shadow-2xl flex flex-col max-h-[90vh] ${wide ? 'w-[780px]' : 'w-[480px]'} mx-4`}>
        <div className="flex items-center justify-between border-b border-border-col px-5 py-3 shrink-0">
          <h3 className="font-display font-semibold text-lg text-text-primary tracking-wide">{title}</h3>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-signal transition-colors text-xl leading-none"
            aria-label={t.common.close}
          >×</button>
        </div>
        <div className="overflow-y-auto p-5 flex-1">{children}</div>
      </div>
    </div>
  )
}
