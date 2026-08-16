export default function EmptyState({ icon = '◈', title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl text-border-col mb-4">{icon}</div>
      <h3 className="font-display font-semibold text-lg text-text-muted mb-1">{title}</h3>
      {message && <p className="text-text-muted text-sm mb-4 max-w-xs">{message}</p>}
      {action && (
        <button className="btn-primary" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  )
}
