import { useState, useEffect, useRef } from 'react'
import { Send, Pencil, SkipForward, FileText, Globe, Loader, Sparkles, ExternalLink } from 'lucide-react'
import { C, FONT, R } from '../lib/tokens.js'
import { generateEmail, buildGmailUrl } from '../lib/api.js'
import { Eyebrow, MatchScore, Kbd, Skeleton, PrimaryBtn, GhostBtn, Tag } from './Primitives.jsx'

function DeckComplete({ sentCount, skippedCount, onExit }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: C.canvas, display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.4s ease',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontFamily: FONT.sans, fontSize: 104, fontWeight: 700,
          color: C.green, lineHeight: 1, letterSpacing: '-0.04em',
        }}>
          {sentCount}
        </div>
        <div style={{ fontFamily: FONT.sans, fontSize: 18, fontWeight: 600, color: C.t1, marginTop: 18 }}>
          {sentCount === 1 ? 'application opened in Gmail' : 'applications opened in Gmail'}
        </div>
        <div style={{ fontFamily: FONT.mono, fontSize: 12, color: C.t3, letterSpacing: '0.08em', marginTop: 10 }}>
          {skippedCount > 0 && `${skippedCount} SKIPPED · `}CHECK YOUR DRAFTS AND HIT SEND
        </div>
        <PrimaryBtn onClick={onExit} style={{ margin: '36px auto 0' }}>
          View pipeline
        </PrimaryBtn>
      </div>
    </div>
  )
}

export default function ReviewDeck({ queue, profile, onSend, onExit }) {
  const [idx, setIdx] = useState(0)
  const [emails, setEmails] = useState({})
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [sending, setSending] = useState(false)
  const [results, setResults] = useState({})
  const [done, setDone] = useState(false)
  const textRef = useRef(null)

  const job = queue[idx]

  useEffect(() => {
    if (!job) return
    let alive = true
    const load = async (j) => {
      if (emails[j.id]) return
      const body = await generateEmail(j, profile)
      if (alive) setEmails(p => ({ ...p, [j.id]: body }))
    }
    setLoading(!emails[job.id])
    setEditing(false)
    load(job).then(() => { if (alive) setLoading(false) })
    if (queue[idx + 1]) load(queue[idx + 1])
    return () => { alive = false }
  }, [idx])

  const advance = (result) => {
    setResults(p => ({ ...p, [job.id]: result }))
    if (result === 'sent') onSend(job)
    if (idx + 1 < queue.length) setIdx(i => i + 1)
    else setDone(true)
  }

  // Open mailto — this IS the send action until Gmail OAuth is wired
  const handleOpenMailto = () => {
    if (loading) return
    setSending(true)
    const subject = `${job.title} — ${profile.name || 'Application'}`
    const gmailUrl = buildGmailUrl(job.email, subject, emails[job.id] || '')
    window.open(gmailUrl, '_blank')
    setTimeout(() => {
      setSending(false)
      advance('sent')
    }, 600)
  }

  useEffect(() => {
    const h = (e) => {
      if (done) return
      if (editing) { if (e.key === 'Escape') setEditing(false); return }
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleOpenMailto() }
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 's') advance('skipped')
      if (e.key.toLowerCase() === 'e') { setEditing(true); setTimeout(() => textRef.current?.focus(), 40) }
      if (e.key === 'Escape') onExit()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [idx, editing, done, loading, sending, emails])

  const sentCount = Object.values(results).filter(r => r === 'sent').length
  const skippedCount = Object.values(results).filter(r => r === 'skipped').length

  if (done) return <DeckComplete sentCount={sentCount} skippedCount={skippedCount} onExit={onExit} />

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: C.canvas, display: 'flex', flexDirection: 'column',
      animation: 'fadeIn 0.25s ease',
    }}>
      {/* Top rail */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 20,
        padding: '18px 36px', borderBottom: `1px solid ${C.border}`, flexShrink: 0,
      }}>
        <Eyebrow color={C.t3}>Review Deck</Eyebrow>
        <div style={{ display: 'flex', gap: 4, flex: 1, maxWidth: 280 }}>
          {queue.map((q, i) => {
            const r = results[q.id]
            return (
              <div key={q.id} style={{
                flex: 1, height: 2, borderRadius: 1,
                background: r === 'sent' ? C.green : r === 'skipped' ? C.borderHi : i === idx ? C.t1 : C.elevated,
                transition: 'background 0.25s ease',
              }} />
            )
          })}
        </div>
        <Eyebrow color={C.t3}>{idx + 1} / {queue.length}</Eyebrow>
        <button onClick={onExit} style={{
          background: 'none', border: 'none', cursor: 'pointer', color: C.t3,
          display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: FONT.sans, fontSize: 14, marginLeft: 'auto',
        }}>
          Exit <Kbd k="ESC" />
        </button>
      </div>

      {/* Main split */}
      <div key={job.id} style={{
        flex: 1, display: 'flex', overflow: 'hidden',
        animation: 'deckSlide 0.3s cubic-bezier(0.16,1,0.3,1)',
      }}>
        {/* LEFT — warm panel */}
        <div style={{
          width: 340, flexShrink: 0,
          background: C.deckPanel,
          borderRight: `1px solid ${C.border}`,
          padding: '52px 40px',
          display: 'flex', flexDirection: 'column', overflow: 'auto',
        }}>
          <Eyebrow color={C.green} style={{ marginBottom: 18 }}>
            {String(idx + 1).padStart(2, '0')} of {String(queue.length).padStart(2, '0')}
          </Eyebrow>
          <div style={{
            fontFamily: FONT.sans, fontSize: 28, fontWeight: 700,
            color: C.t1, lineHeight: 1.15, letterSpacing: '-0.015em', marginBottom: 10,
          }}>
            {job.title}
          </div>
          <div style={{ fontFamily: FONT.sans, fontSize: 16, color: C.t2, marginBottom: 4 }}>{job.company}</div>
          <div style={{ fontFamily: FONT.mono, fontSize: 12, color: C.t3, letterSpacing: '0.04em', marginBottom: 26 }}>
            {job.location} · {job.salary}
          </div>
          <MatchScore score={job.match} />
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 22 }}>
            {job.tags.map(t => <Tag key={t} label={t} />)}
          </div>
          <div style={{
            marginTop: 26, padding: '16px 18px',
            background: C.elevated, border: `1px solid ${C.border}`, borderRadius: R.md,
          }}>
            <Eyebrow style={{ display: 'block', marginBottom: 10 }}>Why this match</Eyebrow>
            <div style={{ fontFamily: FONT.sans, fontSize: 13, color: C.t2, lineHeight: 1.65 }}>{job.why}</div>
          </div>
          <div style={{ marginTop: 'auto', paddingTop: 36, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[{ k: '↵', label: 'Open in Gmail' }, { k: 'E', label: 'Edit first' }, { k: '→', label: 'Skip role' }].map(h => (
              <div key={h.k} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Kbd k={h.k} />
                <span style={{ fontFamily: FONT.sans, fontSize: 13, color: C.t3 }}>{h.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — email */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          padding: '52px 60px', maxWidth: 720, overflow: 'hidden',
        }}>
          {/* Meta row */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingBottom: 18, borderBottom: `1px solid ${C.border}`, marginBottom: 30,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: FONT.sans, fontSize: 14, color: C.t3 }}>To:</span>
              <span style={{ fontFamily: FONT.mono, fontSize: 14, color: C.t2, letterSpacing: '0.02em' }}>{job.email}</span>
            </div>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              {profile.resumeName && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: FONT.mono, fontSize: 11, color: C.t3, letterSpacing: '0.06em' }}>
                  <FileText size={11} strokeWidth={1.5} /> {profile.resumeName.toUpperCase()}
                </span>
              )}
              {profile.portfolio && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: FONT.mono, fontSize: 11, color: C.t3, letterSpacing: '0.06em' }}>
                  <Globe size={11} strokeWidth={1.5} /> {profile.portfolio.toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflow: 'auto', marginBottom: 28 }}>
            {loading ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
                  <Sparkles size={14} strokeWidth={1.5} color={C.green} />
                  <span style={{ fontFamily: FONT.sans, fontSize: 14, color: C.green }}>Writing for {job.company}…</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[92, 68, 80, 55, 42, 72].map((w, i) => <Skeleton key={i} width={`${w}%`} height={16} />)}
                </div>
              </div>
            ) : editing ? (
              <textarea ref={textRef} value={emails[job.id] || ''} onChange={e => setEmails(p => ({ ...p, [job.id]: e.target.value }))}
                style={{
                  width: '100%', height: '100%', minHeight: 260,
                  background: C.surface, border: `1px solid ${C.borderHi}`,
                  borderRadius: R.md, padding: '18px 20px',
                  color: C.t1, fontFamily: FONT.sans, fontSize: 15, lineHeight: 1.8,
                  resize: 'none', outline: 'none', boxSizing: 'border-box',
                }}
              />
            ) : (
              <div style={{
                fontFamily: FONT.sans, fontSize: 15, lineHeight: 1.85,
                color: C.t1, whiteSpace: 'pre-wrap',
              }}>
                {emails[job.id]}
              </div>
            )}
          </div>

          {/* Notice about mailto */}
          <div style={{
            marginBottom: 16, padding: '10px 14px',
            background: 'rgba(184,245,160,0.04)', border: `1px solid ${C.greenBorder}`,
            borderRadius: R.sm, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <ExternalLink size={13} strokeWidth={1.5} color={C.green} />
            <span style={{ fontFamily: FONT.sans, fontSize: 12, color: C.t2, lineHeight: 1.5 }}>
              Opens a pre-written email in Gmail. Review and click send there.
            </span>
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            paddingTop: 22, borderTop: `1px solid ${C.border}`,
          }}>
            <PrimaryBtn onClick={handleOpenMailto} disabled={loading || sending}>
              {sending
                ? <><Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Opening…</>
                : <><ExternalLink size={14} strokeWidth={2} /> Open in Gmail</>
              }
            </PrimaryBtn>
            <GhostBtn onClick={() => { setEditing(!editing); if (!editing) setTimeout(() => textRef.current?.focus(), 40) }}>
              <Pencil size={13} strokeWidth={1.5} /> {editing ? 'Done' : 'Edit'}
            </GhostBtn>
            <button onClick={() => advance('skipped')} style={{
              background: 'none', border: 'none', color: C.t3, cursor: 'pointer',
              fontFamily: FONT.sans, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6,
              marginLeft: 'auto', padding: '8px 4px', transition: 'color 0.1s ease',
            }}
              onMouseEnter={e => e.currentTarget.style.color = C.t2}
              onMouseLeave={e => e.currentTarget.style.color = C.t3}
            >
              Skip <SkipForward size={13} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
