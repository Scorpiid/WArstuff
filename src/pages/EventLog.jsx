import { useState, useMemo } from 'react'
import useStore from '../store/useStore'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import ConfirmDialog from '../components/ConfirmDialog'
import { useT } from '../i18n/LanguageContext'

const EVENT_TYPE_KEYS = ['BATTLE_END','BATTLE_START','BATTLE_OVERRIDE','NATION_CREATED','NATION_DELETED','SQUAD_CREATED','SQUAD_DELETED','INFO']

const TYPE_COLORS = {
  BATTLE_END:'text-safe', BATTLE_START:'text-signal', BATTLE_OVERRIDE:'text-warn',
  NATION_CREATED:'text-safe', NATION_DELETED:'text-danger',
  SQUAD_CREATED:'text-safe', SQUAD_DELETED:'text-danger', INFO:'text-text-muted',
}

function EventRow({ event }) {
  const { t } = useT()
  const color = TYPE_COLORS[event.type] || 'text-text-muted'
  const label = t.eventLog.types[event.type] || event.type.replace(/_/g, ' ')
  const dateStr = new Date(event.at).toLocaleString([], {
    day:'2-digit', month:'2-digit', year:'2-digit',
    hour:'2-digit', minute:'2-digit', second:'2-digit',
  })
  return (
    <div className="flex items-start gap-4 py-2.5 border-b border-border-col/40 last:border-0 hover:bg-surface-2 px-3 transition-colors">
      <span className="font-mono text-xs text-text-muted w-32 shrink-0 mt-0.5">{dateStr}</span>
      <span className={`font-mono text-stat uppercase tracking-widest w-32 shrink-0 mt-0.5 ${color}`}>{label}</span>
      <span className="text-text-primary text-xs flex-1">{event.message}</span>
      <span className="font-mono text-text-muted text-stat shrink-0">T{event.turn}</span>
    </div>
  )
}

export default function EventLog() {
  const { t } = useT()
  const el = t.eventLog
  const events      = useStore(s => s.events)
  const clearEvents = useStore(s => s.clearEvents)

  const [filterType,   setFilterType]   = useState('')
  const [search,       setSearch]       = useState('')
  const [filterTurn,   setFilterTurn]   = useState('')
  const [confirmClear, setConfirmClear] = useState(false)
  const [page,         setPage]         = useState(0)
  const PAGE_SIZE = 50

  const filtered = useMemo(() => events.filter(e => {
    const matchType  = !filterType || e.type === filterType
    const matchTurn  = !filterTurn || String(e.turn) === filterTurn
    const matchSearch = !search || e.message.toLowerCase().includes(search.toLowerCase())
    return matchType && matchTurn && matchSearch
  }), [events, filterType, filterTurn, search])

  const paginated  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  const typeCounts = EVENT_TYPE_KEYS.reduce((acc, tp) => ({ ...acc, [tp]: events.filter(e => e.type === tp).length }), {})

  const subtitle = events.length === 1 ? el.subtitle.replace('{n}', 1) : el.subtitlePlural.replace('{n}', events.length)

  return (
    <div>
      <PageHeader title={el.title} subtitle={subtitle}
        actions={events.length > 0 && <button className="btn-danger" onClick={() => setConfirmClear(true)}>{el.btnClear}</button>} />

      {events.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => setFilterType('')}
            className={`px-3 py-1 rounded text-xs font-mono border transition-colors ${!filterType ? 'bg-signal/15 border-signal/40 text-signal' : 'bg-surface border-border-col text-text-muted hover:border-signal/20'}`}>
            {el.filterAll.replace('{n}', events.length)}
          </button>
          {EVENT_TYPE_KEYS.filter(tp => typeCounts[tp] > 0).map(tp => (
            <button key={tp} onClick={() => setFilterType(filterType === tp ? '' : tp)}
              className={`px-3 py-1 rounded text-xs font-mono border transition-colors ${filterType === tp ? 'bg-signal/15 border-signal/40 text-signal' : 'bg-surface border-border-col text-text-muted hover:border-signal/20'}`}>
              <span className={TYPE_COLORS[tp]}>{el.types[tp]}</span>
              <span className="ml-1">({typeCounts[tp]})</span>
            </button>
          ))}
        </div>
      )}

      {events.length > 0 && (
        <div className="flex gap-3 mb-4">
          <input className="input w-56" placeholder={el.filterMsg} value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} />
          <input className="input w-24" placeholder={el.filterTurn} type="number" min="1" value={filterTurn} onChange={e => { setFilterTurn(e.target.value); setPage(0) }} />
        </div>
      )}

      {events.length === 0
        ? <EmptyState icon="≡" title={el.emptyTitle} message={el.emptyMsg} />
        : <>
            <div className="card overflow-hidden">
              <div className="flex items-center gap-4 px-3 py-2 border-b border-border-col bg-surface-2">
                <span className="font-mono text-stat text-text-muted w-32">{el.colDate}</span>
                <span className="font-mono text-stat text-text-muted w-32">{el.colType}</span>
                <span className="font-mono text-stat text-text-muted flex-1">{el.colMessage}</span>
                <span className="font-mono text-stat text-text-muted">{el.colTurn}</span>
              </div>
              <div>
                {paginated.length === 0
                  ? <div className="text-text-muted text-sm text-center py-8">{el.emptyFilter}</div>
                  : paginated.map(e => <EventRow key={e.id} event={e} />)
                }
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-3">
                <span className="text-text-muted text-xs font-mono">
                  {el.pagination
                    .replace('{total}', filtered.length)
                    .replace('{s}', filtered.length !== 1 ? 's' : '')
                    .replace('{page}', page + 1)
                    .replace('{pages}', totalPages)}
                </span>
                <div className="flex gap-2">
                  <button className="btn-secondary px-3 py-1 text-xs" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>{el.prev}</button>
                  <button className="btn-secondary px-3 py-1 text-xs" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>{el.next}</button>
                </div>
              </div>
            )}
          </>
      }

      {confirmClear && (
        <ConfirmDialog title={el.clearTitle} message={el.clearMsg} danger
          onConfirm={() => { clearEvents(); setConfirmClear(false) }}
          onCancel={() => setConfirmClear(false)} />
      )}
    </div>
  )
}
