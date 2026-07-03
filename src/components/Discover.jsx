import { useState } from 'react'
import { Search, Globe, ChevronRight, Zap } from 'lucide-react'
import { C, FONT, R } from '../lib/tokens.js'
import { JOBS } from '../lib/data.js'
import { Eyebrow, MatchScore, Tag, Check, PrimaryBtn } from './Primitives.jsx'

function JobRow({ job, selected, onToggle, expanded, onExpand }) {
  const [hovered, setHovered] = useState(false)
  const isExp = expanded === job.id

  return (
    <div style={{ borderBottom: `1px solid ${C.border}` }}>
      <div
        onClick={() => onToggle(job.id)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'grid',
          gridTemplateColumns: '20px 1fr 190px 110px 110px 32px',
          gap: 16,
          alignItems: 'center',
          padding: '15px 0',
          cursor: 'pointer',
          background: selected ? 'rgba(184,245,160,0.02)' : hovered ? C.surface : 'transparent',
          margin: '0 -24px',
          padding: '15px 24px',
          transition: 'background 0.1s ease',
        }}
      >
        <Check checked={selected} size={15} />

        {/* Role */}
        <div>
          <div style={{
            fontFamily: FONT.sans,
            fontSize: 14,
            fontWeight: selected ? 600 : 500,
            color: selected ? C.t1 : hovered ? C.t1 : '#d0ccc4',
            transition: 'color 0.1s ease',
          }}>
            {job.title}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
            {job.tags.map(t => <Tag key={t} label={t} />)}
          </div>
        </div>

        {/* Company */}
        <div>
          <div style={{ fontFamily: FONT.sans, fontSize: 13, color: C.t1 }}>{job.company}</div>
          <div style={{ fontFamily: FONT.mono, fontSize: 10, color: C.t3, letterSpacing: '0.04em', marginTop: 3 }}>{job.location}</div>
        </div>

        {/* Salary */}
        <div style={{ fontFamily: FONT.mono, fontSize: 12, color: C.t2, letterSpacing: '0.02em', fontVariantNumeric: 'tabular-nums' }}>
          {job.salary}
        </div>

        {/* Match */}
        <MatchScore score={job.match} />

        {/* Expand toggle */}
        <button
          onClick={e => { e.stopPropagation(); onExpand(isExp ? null : job.id) }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: C.t3, padding: 4, borderRadius: R.xs,
            transform: isExp ? 'rotate(90deg)' : 'none',
            transition: 'transform 0.2s ease, color 0.1s ease',
            display: 'flex',
          }}
          onMouseEnter={e => e.currentTarget.style.color = C.t2}
          onMouseLeave={e => e.currentTarget.style.color = C.t3}
        >
          <ChevronRight size={14} strokeWidth={1.5} />
        </button>
      </div>

      {/* Expanded match reasoning */}
      {isExp && (
        <div style={{
          padding: '0 0 16px 36px',
          animation: 'fadeIn 0.15s ease',
        }}>
          <span style={{ fontFamily: FONT.sans, fontSize: 12, color: C.green, fontWeight: 600 }}>Why this match — </span>
          <span style={{ fontFamily: FONT.sans, fontSize: 12, color: C.t2, lineHeight: 1.6 }}>{job.why}</span>
          <span style={{ fontFamily: FONT.mono, fontSize: 10, color: C.t3, letterSpacing: '0.04em' }}> · {job.email}</span>
        </div>
      )}
    </div>
  )
}

export default function Discover({ appliedIds, onEnterDeck }) {
  const [selected, setSelected] = useState([])
  const [remote, setRemote] = useState(true)
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(null)
  const [inputFocused, setInputFocused] = useState(false)

  const filtered = JOBS.filter(j =>
    !appliedIds.includes(j.id) &&
    (!remote || j.location.toLowerCase().includes('remote')) &&
    (!query || (j.title + j.company).toLowerCase().includes(query.toLowerCase()))
  )

  const toggle = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  const allSelected = filtered.length > 0 && filtered.every(j => selected.includes(j.id))

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header — editorial scale, one idea */}
      <div style={{ padding: '40px 48px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <Eyebrow style={{ display: 'block', marginBottom: 10 }}>Discover</Eyebrow>
            <div style={{
              fontFamily: FONT.sans,
              fontSize: 40,
              fontWeight: 700,
              color: C.t1,
              letterSpacing: '-0.025em',
              lineHeight: 1,
            }}>
              {filtered.length} roles matched<span style={{ color: C.green }}>.</span>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingBottom: 4 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: C.surface,
              border: `1px solid ${inputFocused ? C.borderHi : C.border}`,
              borderRadius: R.sm,
              padding: '0 12px',
              transition: 'border-color 0.12s ease',
            }}>
              <Search size={13} strokeWidth={1.5} color={C.t3} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder="Search roles…"
                style={{
                  background: 'none', border: 'none', outline: 'none',
                  color: C.t1, fontFamily: FONT.sans,
                  fontSize: 13, padding: '9px 0', width: 140,
                }}
              />
            </div>

            <button
              onClick={() => setRemote(p => !p)}
              style={{
                background: remote ? C.greenDim : C.surface,
                border: `1px solid ${remote ? C.greenBorder : C.border}`,
                color: remote ? C.green : C.t2,
                fontFamily: FONT.sans, fontSize: 12, fontWeight: 500,
                padding: '0 12px', height: 36,
                borderRadius: R.sm, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'all 0.12s ease',
              }}
            >
              <Globe size={12} strokeWidth={1.5} /> Remote
            </button>
          </div>
        </div>

        {/* Ledger header row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '20px 1fr 190px 110px 110px 32px',
          gap: 16,
          padding: '0 24px 10px',
          margin: '0 -24px',
        }}>
          {/* Select-all */}
          <button
            onClick={() => setSelected(allSelected ? [] : filtered.map(j => j.id))}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
          >
            <Check checked={allSelected} size={15} />
          </button>
          {['ROLE', 'COMPANY', 'SALARY', 'MATCH', ''].map((h, i) => (
            <Eyebrow key={i}>{h}</Eyebrow>
          ))}
        </div>
        <div style={{ height: 1, background: C.border, margin: '0 -24px 0' }} />
      </div>

      {/* Rows */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 48px 100px' }}>
        {filtered.length === 0 ? (
          <div style={{ paddingTop: 64, textAlign: 'center' }}>
            <div style={{ fontFamily: FONT.sans, fontSize: 14, color: C.t2, fontWeight: 600 }}>No roles match</div>
            <div style={{ fontFamily: FONT.sans, fontSize: 12, color: C.t3, marginTop: 6 }}>
              Widen your search or turn off remote filter.
            </div>
          </div>
        ) : (
          filtered.map(job => (
            <JobRow
              key={job.id}
              job={job}
              selected={selected.includes(job.id)}
              onToggle={toggle}
              expanded={expanded}
              onExpand={setExpanded}
            />
          ))
        )}
      </div>

      {/* Floating action bar — appears when roles are selected */}
      {selected.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: 28,
          left: '50%',
          transform: 'translateX(calc(-50% + 100px))',
          zIndex: 50,
          animation: 'slideUp 0.22s cubic-bezier(0.16,1,0.3,1)',
        }}>
          <div style={{
            background: C.elevated,
            border: `1px solid ${C.borderHi}`,
            borderRadius: R.md,
            padding: '10px 10px 10px 20px',
            display: 'flex', alignItems: 'center', gap: 16,
            boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
          }}>
            <span style={{ fontFamily: FONT.sans, fontSize: 13, color: C.t1, fontWeight: 600 }}>
              {selected.length} selected
            </span>
            <button
              onClick={() => setSelected([])}
              style={{ background: 'none', border: 'none', color: C.t3, fontSize: 12, cursor: 'pointer', fontFamily: FONT.sans }}
            >
              Clear
            </button>
            <PrimaryBtn onClick={() => { onEnterDeck(JOBS.filter(j => selected.includes(j.id))); setSelected([]) }}>
              <Zap size={13} strokeWidth={2} />
              Review & send {selected.length}
            </PrimaryBtn>
          </div>
        </div>
      )}
    </div>
  )
}
