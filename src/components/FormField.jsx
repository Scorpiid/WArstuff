export default function FormField({ label, error, children, hint }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="label">{label}</label>}
      {children}
      {hint && !error && <span className="text-text-muted text-xs">{hint}</span>}
      {error && <span className="text-danger text-xs">{error}</span>}
    </div>
  )
}
