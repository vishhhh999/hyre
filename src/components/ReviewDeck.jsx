import { useState, useEffect, useRef } from 'react'
import { Send, Pencil, SkipForward, FileText, Globe, Loader, Sparkles, ExternalLink, BookmarkPlus } from 'lucide-react'
import { C, FONT, R } from '../lib/tokens.js'
import { generateEmail, buildGmailUrl } from '../lib/api.js'
import { Eyebrow, MatchScore, Kbd, Skeleton, PrimaryBtn, GhostBtn, Tag } from './Primitives.jsx'

function DeckComplete({ sentCount, draftedCount, skippedCount, onExit }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: C.canvas, display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.4s ease',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: FONT.sans, fontSize: 104, fontWeight: 700, color: C.green, lineHeight: 1, letterSpacing: '-0.04em' }}>
          {sentCount}
        </div>
        <div style={{ fontFamily: FONT.sans, fontSize: 18, fontWeight: 600, color: C.t1, marginTop: 18 }}>
          {sentCount === 1 ? 'application opened in Gmail' : 'applications opened in Gmail'}
        </div>
        <div style={{ fontFamily: FONT.mono, fontSize: 12, color: C.t3, letterSpacing: '0.08em', marginTop: 10 }}>
          {draftedCount > 0 && `${draftedCount} SAVED TO PIPELINE · `}
          {skippedCount > 0 && `${skippedCount} SKIPPED · `}
          CHECK YOUR DRAFTS AND HIT SEND
        </div>
        <PrimaryBtn onClick={onExit} style={{ margin: '36px auto 0' }}>
          View pipeline
        </PrimaryBtn>
      </div>
    </div>
  )
}

export default function ReviewDeck({ queue, profile, emailCache, onSend, onDraft, onExit }) {
  const [idx, setIdx] = useState(0)
  const [emails, setEmails] = useState({})   // local session overrides
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [sending, setSending] = useState(false)
  const [results, setResults] = useState({})  // id -> 'sent' | 'drafted' | 'skipped'
  const [done, setDone] = useState(false)
  const textRef = useRef(null)

  const job = queue[idx]

  // get email body: local edit > cache > generate
  const getEmail = (j) => emails[j.id] || emailCache[j.id] || null

  useEffect(() => {
    if (!job) return
    let alive = true

    const load = async (j) => {
      // cache hit — no API call needed
      if (getEmail(j)) return
      const body = await generateEmail(j, profile)
      if (alive) setEmails(p => ({ ...p, [j.id]: body }))
    }

    const cached = getEmail(job)
    setLoading(!cached)
    setEditing(false)

    if (!cached) {
      load(job).then(() => { if (alive) setLoading(false) })
    }
    // prefetch next if not cached
    if (queue[idx + 1] && !getEmail(queue[idx + 1])) load(queue[idx + 1])

    return () => { alive = false }
  }, [idx])

  const currentBody = getEmail(job) || ''

  const advance = (result) => {
    setResults(p => ({ ...p, [job.id]: result }))
    if (idx + 1 < queue.length) setIdx(i => i + 1)
    else setDone(true)
  }

  // open in Gmail + mark sent
  const handleSend = () => {
    if (loading || sending) return
    setSending(true)
    const body = emails[job.id] || currentBody
    const subject = `${job.title} - ${profile.name || 'Application'}`
    const gmailUrl = buildGmailUrl(job.email, subject, body)
    window.open(gmailUrl, '_blank')
    onSend(job, body)
    setTimeout(() => { setSending(false); advance('sent') }, 600)
  }

  // save to pipeline as drafted, don't open Gmail
  const handleDraft = () => {
    const body = emails[job.id] || currentBody
    onDraft(job, body)
    advance('drafted')
  }

  // open apply URL if job has one and no email
  const handleApplyUrl = () => {
    window.open(job.applyUrl, '_blank')
    onDraft(job, currentBody) // save draft for reference
    advance('drafted')
  }

  const hasEmail = !!job?.email
  const hasApplyUrl = !!job?.applyUrl

  useEffect(() => {
    const h = (e) => {
      if (done) return
      if (editing) { if (e.key === 'Escape') setEditing(false); return }
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); hasEmail ? handleSend() : handleApplyUrl() }
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 's') advance('skipped')
      if (e.key.toLowerCase() === 'e') { setEditing(true); setTimeout(() => textRef.current?.focus(), 40) }
      if (e.key === 'Escape') onExit()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [idx, editing, done, loading, sending, emails])

  const sentCount    = Object.values(results).filter(r => r === 'sent').length
  const draftedCount = Object.values(results).filter(r => r === 'drafted').length
  const skippedCount = Object.values(results).filter(r => r === 'skipped').length

  if (done) return <DeckComplete sentCount={sentCount} draftedCount={draftedCount} skippedCount={skippedCount} onExit={onExit} />

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: C.canvas, display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.25s ease' }}>
      {/* Top rail */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '18px 36px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <Eyebrow color={C.t3}>Review Deck</Eyebrow>
        <div style={{ display: 'flex', gap: 4, flex: 1, maxWidth: 280 }}>
          {queue.map((q, i) => {
            const r = results[q.id]
            return (
              <div key={q.id} style={{
                flex: 1, height: 2, borderRadius: 1,
                background: r === 'sent' ? C.green : r === 'drafted' ? C.warning : r === 'skipped' ? C.borderHi : i === idx ? C.t1 : C.elevated,
                transition: 'background 0.25s ease',
              }} />
            )
          })}
        </div>
        <Eyebrow color={C.t3}>{idx + 1} / {queue.length}</Eyebrow>
        <button onClick={onExit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.t3, display: 'flex', alignItems: 'center', gap: 8, fontFamily: FONT.sans, fontSize: 14, marginLeft: 'auto' }}>
          Exit <Kbd k="ESC" />
        </button>
      </div>

      {/* Main split */}
      <div key={job.id} style={{ flex: 1, display: 'flex', overflow: 'hidden', animation: 'deckSlide 0.3s cubic-bezier(0.16,1,0.3,1)' }}>
        {/* LEFT: warm panel */}
        <div style={{ width: 340, flexShrink: 0, background: C.deckPanel, borderRight: `1px solid ${C.border}`, padding: '52px 40px', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          <Eyebrow color={C.green} style={{ marginBottom: 18 }}>
            {String(idx + 1).padStart(2, '0')} of {String(queue.length).padStart(2, '0')}
          </Eyebrow>
          <div style={{ fontFamily: FONT.sans, fontSize: 26, fontWeight: 700, color: C.t1, lineHeight: 1.15, letterSpacing: '-0.015em', marginBottom: 10 }}>
            {job.title}
          </div>
          <div style={{ fontFamily: FONT.sans, fontSize: 15, color: C.t2, marginBottom: 4 }}>{job.company}</div>
          <div style={{ fontFamily: FONT.mono, fontSize: 12, color: C.t3, letterSpacing: '0.04em', marginBottom: 26 }}>
            {job.location} · {job.salary || 'Salary not listed'}
          </div>
          <MatchScore score={job.match} />
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 22 }}>
            {(job.tags || []).map(t => <Tag key={t} label={t} />)}
          </div>
          <div style={{ marginTop: 26, padding: '14px 16px', background: C.elevated, border: `1px solid ${C.border}`, borderRadius: R.md }}>
            <Eyebrow style={{ display: 'block', marginBottom: 10 }}>Why this match</Eyebrow>
            <div style={{ fontFamily: FONT.sans, fontSize: 12, color: C.t2, lineHeight: 1.65 }}>{job.why}</div>
          </div>

          {/* Apply method indicator */}
          <div style={{ marginTop: 16, padding: '10px 14px', background: C.elevated, border: `1px solid ${C.border}`, borderRadius: R.sm }}>
            <Eyebrow style={{ display: 'block', marginBottom: 6 }}>Apply via</Eyebrow>
            {hasEmail
              ? <div style={{ fontFamily: FONT.mono, fontSize: 11, color: C.green, letterSpacing: '0.04em' }}>{job.email}</div>
              : hasApplyUrl
                ? <a href={job.applyUrl} target="_blank" rel="noreferrer" style={{ fontFamily: FONT.mono, fontSize: 11, color: C.green, letterSpacing: '0.04em' }}>LISTING PAGE</a>
                : <div style={{ fontFamily: FONT.mono, fontSize: 11, color: C.t3, letterSpacing: '0.04em' }}>NO APPLY METHOD FOUND</div>
            }
          </div>

          {/* Cache status */}
          {emailCache[job.id] && (
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.green }} />
              <Eyebrow color={C.t3}>email from cache</Eyebrow>
            </div>
          )}

          {/* Keyboard hints */}
          <div style={{ marginTop: 'auto', paddingTop: 36, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {hasEmail
              ? [{ k: '↵', label: 'Open in Gmail' }, { k: 'D', label: 'Save as draft' }, { k: 'E', label: 'Edit first' }, { k: '→', label: 'Skip' }]
              : [{ k: '↵', label: 'Open listing' }, { k: '→', label: 'Skip' }]
            }.map(h => (
              <div key={h.k} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Kbd k={h.k} />
                <span style={{ fontFamily: FONT.sans, fontSize: 13, color: C.t3 }}>{h.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: email or listing */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '52px 60px', maxWidth: 720, overflow: 'hidden' }}>
          {hasEmail ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 18, borderBottom: `1px solid ${C.border}`, marginBottom: 30 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: FONT.sans, fontSize: 14, color: C.t3 }}>To:</span>
                  <span style={{ fontFamily: FONT.mono, fontSize: 14, color: C.t2, letterSpacing: '0.02em' }}>{job.email}</span>
                </div>
                <div style={{ display: 'flex', gap: 14 }}>
                  {profile.resumeName && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: FONT.mono, fontSize: 11, color: C.t3, letterSpacing: '0.06em' }}>
                      <FileText size={11} strokeWidth={1.5} /> {profile.resumeName.toUpperCase()}
                    </span>
                  )}
                  {profile.portfolio && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: FONT.mono, fontSize: 11, color: C.t3, letterSpacing: '0.06em' }}>
                      <Globe size={11} strokeWidth={1.5} /> PORTFOLIO
                    </span>
                  )}
                </div>
              </div>

              <div style={{ flex: 1, overflow: 'auto', marginBottom: 28 }}>
                {loading ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
                      <Sparkles size={14} strokeWidth={1.5} color={C.green} />
                      <span style={{ fontFamily: FONT.sans, fontSize: 14, color: C.green }}>Writing for {job.company}...</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {[92, 68, 80, 55, 42, 72].map((w, i) => <Skeleton key={i} width={`${w}%`} height={16} />)}
                    </div>
                  </div>
                ) : editing ? (
                  <textarea
                    ref={textRef}
                    value={emails[job.id] || currentBody}
                    onChange={e => setEmails(p => ({ ...p, [job.id]: e.target.value }))}
                    style={{ width: '100%', height: '100%', minHeight: 260, background: C.surface, border: `1px solid ${C.borderHi}`, borderRadius: R.md, padding: '18px 20px', color: C.t1, fontFamily: FONT.sans, fontSize: 15, lineHeight: 1.8, resize: 'none', outline: 'none', boxSizing: 'border-box' }}
                  />
                ) : (
                  <div style={{ fontFamily: FONT.sans, fontSize: 15, lineHeight: 1.85, color: C.t1, whiteSpace: 'pre-wrap' }}>
                    {currentBody}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 22, borderTop: `1px solid ${C.border}` }}>
                <PrimaryBtn onClick={handleSend} disabled={loading || sending}>
                  {sending
                    ? <><Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Opening...</>
                    : <><ExternalLink size={14} strokeWidth={2} /> Open in Gmail</>
                  }
                </PrimaryBtn>
                <GhostBtn onClick={handleDraft}>
                  <BookmarkPlus size={13} strokeWidth={1.5} /> Save draft
                </GhostBtn>
                <GhostBtn onClick={() => { setEditing(!editing); if (!editing) setTimeout(() => textRef.current?.focus(), 40) }}>
                  <Pencil size={13} strokeWidth={1.5} /> {editing ? 'Done' : 'Edit'}
                </GhostBtn>
                <button onClick={() => advance('skipped')} style={{ background: 'none', border: 'none', color: C.t3, cursor: 'pointer', fontFamily: FONT.sans, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto', padding: '8px 4px', transition: 'color 0.1s ease' }}
                  onMouseEnter={e => e.currentTarget.style.color = C.t2}
                  onMouseLeave={e => e.currentTarget.style.color = C.t3}
                >
                  Skip <SkipForward size={13} strokeWidth={1.5} />
                </button>
              </div>
            </>
          ) : hasApplyUrl ? (
            // no email — show apply via listing
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 20 }}>
              <div style={{ fontFamily: FONT.sans, fontSize: 16, color: C.t2, textAlign: 'center', maxWidth: 380, lineHeight: 1.6 }}>
                This role applies via the company's listing page, not email. Click to open and apply directly.
              </div>
              <PrimaryBtn onClick={handleApplyUrl}>
                <ExternalLink size={14} strokeWidth={2} /> Open listing page
              </PrimaryBtn>
              <button onClick={() => advance('skipped')} style={{ background: 'none', border: 'none', color: C.t3, cursor: 'pointer', fontFamily: FONT.sans, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                Skip <SkipForward size={13} strokeWidth={1.5} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <div style={{ fontFamily: FONT.sans, fontSize: 14, color: C.t3 }}>no apply method available for this role</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
