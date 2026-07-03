import { useState, useEffect, useRef } from 'react'
import { Send, Pencil, SkipForward, X, FileText, Globe, Loader, Sparkles, CheckCircle } from 'lucide-react'
import { C, FONT, R } from '../lib/tokens.js'
import { generateEmail } from '../lib/api.js'
import { Eyebrow, MatchScore, Kbd, Skeleton, PrimaryBtn, GhostBtn, Tag } from './Primitives.jsx'

// Review Deck — full-viewport, one role per screen
// Signature element: LEFT panel uses warm #141413 vs cool #0c0c0d canvas — temperature split
// creates perceived depth without color. Keyboard-driven flow.

function DeckComplete({ sentCount, skippedCount, onExit }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: C.canvas,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.4s ease',
    }}>
      <div style={{ textAlign: 'center' }}>
        {/* Big number — the one moment of expressive size */}
        <div style={{
          fontFamily: FONT.sans,
          fontSize: 96,
          fontWeight: 700,
          color: C.green,
          lineHeight: 1,
          letterSpacing: '-0.04em',
        }}>
          {sentCount}
        </div>
        <div style={{ fontFamily: FONT.sans, fontSize: 16, fontWeight: 600, color: C.t1, marginTop: 16 }}>
          {sentCount === 1 ? 'application sent' : 'applications sent'}
        </div>
        <div style={{ fontFamily: FONT.mono, fontSize: 11, color: C.t3, letterSpacing: '0.08em', marginTop: 8 }}>
          {skippedCount > 0 && `${skippedCount} SKIPPED · `}MOVED TO PIPELINE
        </div>
        <PrimaryBtn onClick={onExit} style={{ margin: '32px auto 0' }}>
          View pipeline
        </PrimaryBtn>
      </div>
    </div>
  )
}

export default function ReviewDeck({ queue, onSend, onExit }) {
  const [idx, setIdx] = useState(0)
  const [emails, setEmails] = useState({})
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [sending, setSending] = useState(false)
  const [results, setResults] = useState({})
  const [done, setDone] = useState(false)
  const textRef = useRef(null)

  const job = queue[idx]

  // Load current email, prefetch next
  useEffect(() => {
    if (!job) return
    let alive = true

    const load = async (j) => {
      if (emails[j.id]) return
      const body = await generateEmail(j)
      if (alive) setEmails(p => ({ ...p, [j.id]: body }))
    }

    setLoading(!emails[job.id])
    setEditing(false)
    load(job).then(() => { if (alive) setLoading(false) })
    if (queue[idx + 1]) load(queue[idx + 1]) // prefetch

    return () => { alive = false }
  }, [idx])

  const advance = (result) => {
    setResults(p => ({ ...p, [job.id]: result }))
    if (result === 'sent') onSend(job)
    if (idx + 1 < queue.length) {
      setIdx(i => i + 1)
    } else {
      setDone(true)
    }
  }

  const handleSend = async () => {
    if (loading || sending) return
    setSending(true)
    await new Promise(r => setTimeout(r, 700))
    setSending(false)
    advance('sent')
  }

  // Keyboard bindings
  useEffect(() => {
    const h = (e) => {
      if (done) return
      if (editing) {
        if (e.key === 'Escape') setEditing(false)
        return
      }
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 's') advance('skipped')
      if (e.key.toLowerCase() === 'e') { setEditing(true); setTimeout(() => textRef.current?.focus(), 40) }
      if (e.key === 'Escape') onExit()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [idx, editing, done, loading, sending])

  const sentCount = Object.values(results).filter(r => r === 'sent').length
  const skippedCount = Object.values(results).filter(r => r === 'skipped').length

  if (done) return <DeckComplete sentCount={sentCount} skippedCount={skippedCount} onExit={onExit} />

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: C.canvas,
      display: 'flex', flexDirection: 'column',
      animation: 'fadeIn 0.25s ease',
    }}>
      {/* Top rail — segmented progress + controls */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 20,
        padding: '16px 32px',
        borderBottom: `1px solid ${C.border}`,
        flexShrink: 0,
      }}>
        <Eyebrow color={C.t3}>Review Deck</Eyebrow>

        {/* Segmented progress — each segment = one role */}
        <div style={{ display: 'flex', gap: 3, flex: 1, maxWidth: 240 }}>
          {queue.map((q, i) => {
            const r = results[q.id]
            return (
              <div key={q.id} style={{
                flex: 1, height: 2, borderRadius: 1,
                background: r === 'sent' ? C.green
                  : r === 'skipped' ? C.borderHi
                  : i === idx ? C.t1
                  : C.elevated,
                transition: 'background 0.25s ease',
              }} />
            )
          })}
        </div>

        <Eyebrow color={C.t3}>{idx + 1} / {queue.length}</Eyebrow>

        <button onClick={onExit} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: C.t3, display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: FONT.sans, fontSize: 12, marginLeft: 'auto',
        }}>
          Exit <Kbd k="ESC" />
        </button>
      </div>

      {/* Main stage */}
      <div key={job.id} style={{
        flex: 1, display: 'flex', overflow: 'hidden',
        animation: 'deckSlide 0.3s cubic-bezier(0.16,1,0.3,1)',
      }}>
        {/* LEFT: role context — warm-tinted panel (temperature split from cool canvas) */}
        <div style={{
          width: 320,
          flexShrink: 0,
          background: C.deckPanel,  // #141413 — warm tint vs cool #0c0c0d
          borderRight: `1px solid ${C.border}`,
          padding: '48px 36px',
          display: 'flex', flexDirection: 'column',
          overflow: 'auto',
        }}>
          <Eyebrow color={C.green} style={{ marginBottom: 16 }}>
            {String(idx + 1).padStart(2, '0')} of {String(queue.length).padStart(2, '0')}
          </Eyebrow>

          <div style={{
            fontFamily: FONT.sans, fontSize: 26, fontWeight: 700,
            color: C.t1, lineHeight: 1.15, letterSpacing: '-0.015em',
            marginBottom: 8,
          }}>
            {job.title}
          </div>

          <div style={{ fontFamily: FONT.sans, fontSize: 14, color: C.t2, marginBottom: 4 }}>
            {job.company}
          </div>
          <div style={{ fontFamily: FONT.mono, fontSize: 11, color: C.t3, letterSpacing: '0.04em', marginBottom: 24 }}>
            {job.location} · {job.salary}
          </div>

          <MatchScore score={job.match} />

          {/* Tags */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 20 }}>
            {job.tags.map(t => <Tag key={t} label={t} />)}
          </div>

          {/* Why this match */}
          <div style={{
            marginTop: 24,
            padding: '14px 16px',
            background: C.elevated,
            border: `1px solid ${C.border}`,
            borderRadius: R.md,
          }}>
            <Eyebrow style={{ display: 'block', marginBottom: 8 }}>Why this match</Eyebrow>
            <div style={{ fontFamily: FONT.sans, fontSize: 12, color: C.t2, lineHeight: 1.65 }}>
              {job.why}
            </div>
          </div>

          {/* Keyboard hints — pushed to bottom */}
          <div style={{ marginTop: 'auto', paddingTop: 32, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { k: '↵', label: 'Send email' },
              { k: 'E', label: 'Edit first' },
              { k: '→', label: 'Skip role' },
            ].map(h => (
              <div key={h.k} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Kbd k={h.k} />
                <span style={{ fontFamily: FONT.sans, fontSize: 12, color: C.t3 }}>{h.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: email — cool canvas, breathes */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          padding: '48px 56px',
          maxWidth: 680,
          overflow: 'hidden',
        }}>
          {/* Email meta row */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingBottom: 16,
            borderBottom: `1px solid ${C.border}`,
            marginBottom: 28,
          }}>
            <div style={{ display: 'flex', align: 'center', gap: 6 }}>
              <span style={{ fontFamily: FONT.sans, fontSize: 12, color: C.t3 }}>To:</span>
              <span style={{ fontFamily: FONT.mono, fontSize: 12, color: C.t2, letterSpacing: '0.02em' }}>{job.email}</span>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: FONT.mono, fontSize: 10, color: C.t3, letterSpacing: '0.06em' }}>
                <FileText size={10} strokeWidth={1.5} /> RESUME.PDF
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: FONT.mono, fontSize: 10, color: C.t3, letterSpacing: '0.06em' }}>
                <Globe size={10} strokeWidth={1.5} /> PORTFOLIO
              </span>
            </div>
          </div>

          {/* Email body */}
          <div style={{ flex: 1, overflow: 'auto', marginBottom: 24 }}>
            {loading ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                  <Sparkles size={13} strokeWidth={1.5} color={C.green} />
                  <span style={{ fontFamily: FONT.sans, fontSize: 12, color: C.green }}>
                    Writing for {job.company}…
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[92, 68, 80, 55, 40, 72].map((w, i) => (
                    <Skeleton key={i} width={`${w}%`} height={14} />
                  ))}
                </div>
              </div>
            ) : editing ? (
              <textarea
                ref={textRef}
                value={emails[job.id] || ''}
                onChange={e => setEmails(p => ({ ...p, [job.id]: e.target.value }))}
                style={{
                  width: '100%', height: '100%', minHeight: 240,
                  background: C.surface,
                  border: `1px solid ${C.borderHi}`,
                  borderRadius: R.md,
                  padding: '16px 18px',
                  color: C.t1,
                  fontFamily: FONT.sans,
                  fontSize: 14,
                  lineHeight: 1.75,
                  resize: 'none',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            ) : (
              <div style={{
                fontFamily: FONT.sans,
                fontSize: 14,
                lineHeight: 1.8,
                color: C.t1,
                whiteSpace: 'pre-wrap',
              }}>
                {emails[job.id]}
              </div>
            )}
          </div>

          {/* Action row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            paddingTop: 20,
            borderTop: `1px solid ${C.border}`,
          }}>
            <PrimaryBtn onClick={handleSend} disabled={loading || sending}>
              {sending
                ? <><Loader size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> Sending…</>
                : <><Send size={13} strokeWidth={2} /> Send email</>
              }
            </PrimaryBtn>

            <GhostBtn
              onClick={() => {
                setEditing(!editing)
                if (!editing) setTimeout(() => textRef.current?.focus(), 40)
              }}
            >
              <Pencil size={12} strokeWidth={1.5} />
              {editing ? 'Done' : 'Edit'}
            </GhostBtn>

            <button
              onClick={() => advance('skipped')}
              style={{
                background: 'none', border: 'none',
                color: C.t3, cursor: 'pointer',
                fontFamily: FONT.sans, fontSize: 12,
                display: 'flex', alignItems: 'center', gap: 5,
                marginLeft: 'auto', padding: '8px 4px',
              }}
              onMouseEnter={e => e.currentTarget.style.color = C.t2}
              onMouseLeave={e => e.currentTarget.style.color = C.t3}
            >
              Skip <SkipForward size={12} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
