import { useState, useMemo } from 'react'
import { Search, Globe, ChevronRight, Zap, X, RefreshCw, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react'
import { C, FONT, R } from '../lib/tokens.js'
import { JOBS } from '../lib/data.js'
import { Eyebrow, MatchScore, Tag, Check, PrimaryBtn } from './Primitives.jsx'

// Sort button — same font/size as column headers, clickable
function SortBtn({ label, field, sort, setSort }) {
  const active = sort.field === field
  const asc = sort.dir === 'asc'

  const cycle = () => {
    if (!active) { setSort({ field, dir: 'desc' }); return }
    if (asc) { setSort({ field: null, dir: null }); return } // reset
    setSort({ field, dir: 'asc' })
  }

  return (
    <button onClick={cycle} style={{
      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
      display: 'flex', alignItems: 'center', gap: 5,
      fontFamily: FONT.mono, fontSize: 11, fontWeight: 500,
      letterSpacing: '0.1em', textTransform: 'uppercase',
      color: active ? C.t1 : C.t3,
      transition: 'color 0.12s ease',
    }}>
      {label}
      {active ? (
        asc ? <ArrowUp size={11} strokeWidth={2} /> : <ArrowDown size={11} strokeWidth={2} />
      ) : (
        <ArrowDown size={11} strokeWidth={1.5} color={C.t3} />
      )}
    </button>
  )
}

function ResetSort({ sort, setSort }) {
  if (!sort.field) return null
  return (
    <button onClick={() => setSort({ field: null, dir: null })} style={{
      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
      display: 'flex', alignItems: 'center', gap: 5,
      fontFamily: FONT.mono, fontSize: 11, fontWeight: 500,
      letterSpacing: '0.1em', textTransform: 'uppercase',
      color: C.t2,
    }}>
      <RotateCcw size={11} strokeWidth={2} /> Reset
    </button>
  )
}

function JobRow({ job, selected, onToggle, expanded, onExpand, onDismiss }) {
  const [hovered, setHovered] = useState(false)
  const isExp = expanded === job.id

  return (
    <div style={{ borderBottom: `1px solid ${C.border}`, position: 'relative' }}>
      <div
        onClick={() => onToggle(job.id)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'grid',
          gridTemplateColumns: '20px 1fr 130px 90px 110px 120px 36px',
          gap: 16, alignItems: 'center',
          padding: '17px 24px',
          margin: '0 -24px',
          cursor: 'pointer',
          background: selected ? 'rgba(184,245,160,0.025)' : hovered ? C.surface : 'transparent',
          transition: 'background 0.1s ease',
        }}
      >
        <Check checked={selected} />

        {/* Role */}
        <div>
          <div style={{
            fontFamily: FONT.sans, fontSize: 16, fontWeight: 600,
            color: hovered || selected ? C.t1 : '#ccc8c0',
            transition: 'color 0.1s ease', lineHeight: 1.2,
          }}>
            {job.title}
          </div>
          <div style={{ fontFamily: FONT.sans, fontSize: 13, color: C.t2, marginTop: 3 }}>{job.company}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {job.tags.map(t => <Tag key={t} label={t} />)}
          </div>
        </div>

        {/* Location */}
        <div>
          <div style={{ fontFamily: FONT.sans, fontSize: 14, color: C.t1 }}>{job.location}</div>
        </div>

        {/* Work type */}
        <div>
          <span style={{
            fontFamily: FONT.mono, fontSize: 11, letterSpacing: '0.06em',
            color: job.workType === 'Remote' ? C.green : job.workType === 'Hybrid' ? C.warning : C.t2,
            background: job.workType === 'Remote' ? C.greenDim : job.workType === 'Hybrid' ? 'rgba(242,153,74,0.08)' : C.elevated,
            border: `1px solid ${job.workType === 'Remote' ? C.greenBorder : job.workType === 'Hybrid' ? 'rgba(242,153,74,0.2)' : C.border}`,
            borderRadius: R.xs, padding: '4px 8px',
          }}>
            {job.workType.toUpperCase()}
          </span>
        </div>

        {/* Salary */}
        <div style={{
          fontFamily: FONT.mono, fontSize: 14, color: C.t1,
          letterSpacing: '0.02em', fontVariantNumeric: 'tabular-nums',
        }}>
          {job.salary}
        </div>

        {/* Match */}
        <MatchScore score={job.match} />

        {/* Expand + dismiss */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={e => { e.stopPropagation(); onExpand(isExp ? null : job.id) }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', color: C.t3, padding: 4,
              transform: isExp ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s ease, color 0.1s ease',
              display: 'flex',
            }}
            onMouseEnter={e => e.currentTarget.style.color = C.t2}
            onMouseLeave={e => e.currentTarget.style.color = C.t3}
          >
            <ChevronRight size={15} strokeWidth={1.5} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDismiss(job.id) }}
            title="Dismiss — won't show again"
            style={{
              background: 'none', border: 'none', cursor: 'pointer', color: C.t3, padding: 4,
              display: 'flex', transition: 'color 0.1s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.color = C.error}
            onMouseLeave={e => e.currentTarget.style.color = C.t3}
          >
            <X size={13} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Expanded match reasoning */}
      {isExp && (
        <div style={{ padding: '0 24px 16px 60px', animation: 'fadeIn 0.15s ease' }}>
          <span style={{ fontFamily: FONT.sans, fontSize: 13, color: C.green, fontWeight: 600 }}>Why this match — </span>
          <span style={{ fontFamily: FONT.sans, fontSize: 13, color: C.t2, lineHeight: 1.6 }}>{job.why}</span>
          <span style={{ fontFamily: FONT.mono, fontSize: 11, color: C.t3, letterSpacing: '0.04em' }}> · {job.email}</span>
        </div>
      )}
    </div>
  )
}

export default function Discover({ appliedIds, dismissedIds, onDismiss, onEnterDeck }) {
  const [selected, setSelected] = useState([])
  const [workTypeFilter, setWorkTypeFilter] = useState('All') // All | Remote | Hybrid | On-site
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(null)
  const [inputFocused, setInputFocused] = useState(false)
  const [sort, setSort] = useState({ field: null, dir: null })

  const WORK_TYPES = ['All', 'Remote', 'Hybrid', 'On-site']

  const filtered = useMemo(() => {
    let jobs = JOBS.filter(j =>
      !appliedIds.includes(j.id) &&
      !dismissedIds.includes(j.id) &&
      (workTypeFilter === 'All' || j.workType === workTypeFilter) &&
      (!query || (j.title + j.company + j.location).toLowerCase().includes(query.toLowerCase()))
    )

    if (sort.field) {
      jobs = [...jobs].sort((a, b) => {
        let va = sort.field === 'salary' ? a.salaryNum : a.match
        let vb = sort.field === 'salary' ? b.salaryNum : b.match
        return sort.dir === 'asc' ? va - vb : vb - va
      })
    }

    return jobs
  }, [appliedIds, dismissedIds, workTypeFilter, query, sort])

  const toggle = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  const allSelected = filtered.length > 0 && filtered.every(j => selected.includes(j.id))

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '44px 52px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <Eyebrow style={{ display: 'block', marginBottom: 12 }}>Discover</Eyebrow>
            <div style={{
              fontFamily: FONT.sans, fontSize: 44, fontWeight: 700,
              color: C.t1, letterSpacing: '-0.025em', lineHeight: 1,
            }}>
              {filtered.length} roles matched<span style={{ color: C.green }}>.</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingBottom: 4 }}>
            {/* Search */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: C.surface,
              border: `1px solid ${inputFocused ? C.borderHi : C.border}`,
              borderRadius: R.sm, padding: '0 14px',
              transition: 'border-color 0.12s ease',
            }}>
              <Search size={15} strokeWidth={1.5} color={C.t3} />
              <input
                value={query} onChange={e => setQuery(e.target.value)}
                onFocus={() => setInputFocused(true)} onBlur={() => setInputFocused(false)}
                placeholder="Search roles, companies…"
                style={{
                  background: 'none', border: 'none', outline: 'none',
                  color: C.t1, fontFamily: FONT.sans, fontSize: 14,
                  padding: '10px 0', width: 180,
                }}
              />
            </div>

            {/* Work type pills */}
            {WORK_TYPES.map(wt => (
              <button key={wt} onClick={() => setWorkTypeFilter(wt)} style={{
                background: workTypeFilter === wt ? C.greenDim : C.surface,
                border: `1px solid ${workTypeFilter === wt ? C.greenBorder : C.border}`,
                color: workTypeFilter === wt ? C.green : C.t2,
                fontFamily: FONT.sans, fontSize: 13, fontWeight: 500,
                padding: '0 14px', height: 40, borderRadius: R.sm, cursor: 'pointer',
                transition: 'all 0.12s ease',
              }}>
                {wt}
              </button>
            ))}
          </div>
        </div>

        {/* Ledger header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '20px 1fr 130px 90px 110px 120px 36px',
          gap: 16, padding: '0 24px 12px', margin: '0 -24px',
          alignItems: 'center',
        }}>
          <button onClick={() => setSelected(allSelected ? [] : filtered.map(j => j.id))}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
            <Check checked={allSelected} />
          </button>
          <Eyebrow>Role</Eyebrow>
          <Eyebrow>Location</Eyebrow>
          <Eyebrow>Type</Eyebrow>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SortBtn label="Salary" field="salary" sort={sort} setSort={setSort} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SortBtn label="Match" field="match" sort={sort} setSort={setSort} />
            <ResetSort sort={sort} setSort={setSort} />
          </div>
          <div />
        </div>
        <div style={{ height: 1, background: C.border, margin: '0 -52px' }} />
      </div>

      {/* Rows */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 52px 120px' }}>
        {filtered.length === 0 ? (
          <div style={{ paddingTop: 80, textAlign: 'center' }}>
            <div style={{ fontFamily: FONT.sans, fontSize: 16, color: C.t2, fontWeight: 600 }}>No roles match</div>
            <div style={{ fontFamily: FONT.sans, fontSize: 14, color: C.t3, marginTop: 8 }}>
              Adjust filters or dismiss fewer roles.
            </div>
          </div>
        ) : filtered.map(job => (
          <JobRow key={job.id} job={job}
            selected={selected.includes(job.id)}
            onToggle={toggle}
            expanded={expanded}
            onExpand={setExpanded}
            onDismiss={onDismiss}
          />
        ))}

        {/* Load more — placeholder for real API integration */}
        <div style={{ paddingTop: 32, display: 'flex', justifyContent: 'center' }}>
          <button style={{
            background: C.surface, border: `1px solid ${C.border}`,
            color: C.t2, fontFamily: FONT.sans, fontSize: 14, fontWeight: 500,
            padding: '12px 24px', borderRadius: R.sm, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
            transition: 'border-color 0.12s ease, color 0.12s ease',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderHi; e.currentTarget.style.color = C.t1 }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.t2 }}
          >
            <RefreshCw size={15} strokeWidth={1.5} /> Load more opportunities
          </button>
        </div>
      </div>

      {/* Floating action bar */}
      {selected.length > 0 && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%',
          transform: 'translateX(calc(-50% + 96px))',
          zIndex: 50, animation: 'slideUp 0.22s cubic-bezier(0.16,1,0.3,1)',
        }}>
          <div style={{
            background: C.elevated, border: `1px solid ${C.borderHi}`,
            borderRadius: R.md, padding: '12px 12px 12px 24px',
            display: 'flex', alignItems: 'center', gap: 20,
            boxShadow: '0 20px 48px rgba(0,0,0,0.7)',
          }}>
            <span style={{ fontFamily: FONT.sans, fontSize: 15, color: C.t1, fontWeight: 600 }}>
              {selected.length} selected
            </span>
            <button onClick={() => setSelected([])} style={{
              background: 'none', border: 'none', color: C.t3, fontSize: 14,
              cursor: 'pointer', fontFamily: FONT.sans,
            }}>
              Clear
            </button>
            <PrimaryBtn onClick={() => { onEnterDeck(JOBS.filter(j => selected.includes(j.id))); setSelected([]) }}>
              <Zap size={15} strokeWidth={2} /> Review & send {selected.length}
            </PrimaryBtn>
          </div>
        </div>
      )}
    </div>
  )
}
