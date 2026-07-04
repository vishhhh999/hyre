import { useState } from 'react'
import { AlertCircle, RefreshCw, Send, Loader, ArrowRight } from 'lucide-react'
import { C, FONT, R } from '../lib/tokens.js'
import { STAGES } from '../lib/data.js'
import { Eyebrow, PrimaryBtn, GhostBtn, Skeleton } from './Primitives.jsx'
import { generateFollowUp, buildGmailUrl } from '../lib/api.js'

function FollowUpModal({ app, profile, onClose, onSent }) {
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useState(() => {
    let alive = true
    generateFollowUp(app, profile).then(text => {
      if (alive) { setBody(text); setLoading(false) }
    })
    return () => { alive = false }
  })

  const send = () => {
    setSending(true)
    const subject = `Following up — ${app.title}`
    const gmailUrl = buildGmailUrl(app.email, subject, body)
    window.open(gmailUrl, '_blank')
    setTimeout(() => {
      setSending(false)
      onSent(app.id)
      onClose()
    }, 500)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 150,
      background: 'rgba(12,12,13,0.88)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, animation: 'fadeIn 0.2s ease',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: R.lg, width: '100%', maxWidth: 520,
        animation: 'slideUp 0.28s cubic-bezier(0.16,1,0.3,1)', overflow: 'hidden',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: FONT.sans, fontSize: 16, fontWeight: 600, color: C.t1 }}>
            Follow-up · {app.company}
          </div>
          <div style={{ fontFamily: FONT.mono, fontSize: 11, color: C.t3, letterSpacing: '0.06em', marginTop: 5 }}>
            TO: {app.email}
          </div>
        </div>
        <div style={{ padding: '22px 24px', minHeight: 150 }}>
          {loading
            ? <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[88, 62, 44].map((w, i) => <Skeleton key={i} width={`${w}%`} height={15} />)}
              </div>
            : <textarea value={body} onChange={e => setBody(e.target.value)} style={{
                width: '100%', minHeight: 150,
                background: 'none', border: 'none', outline: 'none',
                color: C.t1, fontFamily: FONT.sans, fontSize: 15,
                lineHeight: 1.75, resize: 'none', boxSizing: 'border-box',
              }} />
          }
        </div>
        <div style={{
          padding: '16px 24px', borderTop: `1px solid ${C.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <GhostBtn onClick={onClose}>Keep waiting</GhostBtn>
          <PrimaryBtn onClick={send} disabled={loading || sending}>
            {sending
              ? <><Loader size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> Opening…</>
              : <><Send size={13} strokeWidth={2} /> Open in Gmail</>
            }
          </PrimaryBtn>
        </div>
      </div>
    </div>
  )
}

function PipelineCard({ app, onFollowUp, onAdvance }) {
  const days = Math.floor((Date.now() - new Date(app.sentAt)) / 86400000)
  const stageIdx = STAGES.findIndex(s => s.id === app.stage)
  const nextStage = STAGES[stageIdx + 1]

  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: R.md, padding: '14px 16px',
      transition: 'border-color 0.12s ease',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = C.borderHi}
      onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
    >
      <div style={{ fontFamily: FONT.sans, fontSize: 14, fontWeight: 600, color: C.t1, lineHeight: 1.3 }}>{app.title}</div>
      <div style={{ fontFamily: FONT.sans, fontSize: 13, color: C.t2, marginTop: 4 }}>{app.company}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
        <div style={{ fontFamily: FONT.mono, fontSize: 11, color: C.t3, letterSpacing: '0.04em' }}>
          {days === 0 ? 'TODAY' : `${days}D AGO`}
          {app.followUps > 0 && ` · ${app.followUps} FU`}
        </div>
        {nextStage && (
          <button onClick={() => onAdvance(app.id, nextStage.id)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: C.t3, display: 'flex', alignItems: 'center', gap: 5,
            fontFamily: FONT.mono, fontSize: 11, letterSpacing: '0.06em', padding: 0,
            transition: 'color 0.1s ease',
          }}
            onMouseEnter={e => e.currentTarget.style.color = nextStage.color}
            onMouseLeave={e => e.currentTarget.style.color = C.t3}
          >
            {nextStage.label.toUpperCase()} <ArrowRight size={11} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </div>
  )
}

export default function Pipeline({ applied, profile, onFollowUp, onAdvanceStage }) {
  const [fuModal, setFuModal] = useState(null)

  const needsFollowUp = applied.filter(a =>
    a.stage === 'sent' &&
    (Date.now() - new Date(a.sentAt)) / 86400000 >= 7 &&
    a.followUps === 0
  )

  if (applied.length === 0) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 380 }}>
          <div style={{
            fontFamily: FONT.sans, fontSize: 44, fontWeight: 700,
            color: C.t1, letterSpacing: '-0.025em', lineHeight: 1, marginBottom: 16,
          }}>
            Nothing here<span style={{ color: C.green }}>.</span>
          </div>
          <div style={{ fontFamily: FONT.sans, fontSize: 16, color: C.t2, lineHeight: 1.6 }}>
            Head to Discover, select roles you like, and send your first batch of applications.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ padding: '44px 52px' }}>
        <Eyebrow style={{ display: 'block', marginBottom: 12 }}>Pipeline</Eyebrow>
        <div style={{
          fontFamily: FONT.sans, fontSize: 44, fontWeight: 700,
          color: C.t1, letterSpacing: '-0.025em', lineHeight: 1, marginBottom: 10,
        }}>
          {applied.length} applications<span style={{ color: C.green }}>.</span>
        </div>
        <div style={{ fontFamily: FONT.sans, fontSize: 15, color: C.t2, marginBottom: 36 }}>
          {applied.filter(a => a.stage === 'interview').length} in interview stage
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 36 }}>
          {STAGES.map(s => {
            const count = applied.filter(a => a.stage === s.id).length
            return (
              <div key={s.id} style={{
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: R.md, padding: '18px 22px',
              }}>
                <div style={{
                  fontFamily: FONT.sans, fontSize: 34, fontWeight: 700,
                  color: s.color, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
                }}>
                  {count}
                </div>
                <Eyebrow color={C.t3} style={{ display: 'block', marginTop: 8 }}>{s.label}</Eyebrow>
              </div>
            )
          })}
        </div>

        {/* Follow-up engine */}
        {needsFollowUp.length > 0 && (
          <div style={{
            marginBottom: 36,
            background: 'rgba(242,153,74,0.04)', border: `1px solid rgba(242,153,74,0.2)`,
            borderRadius: R.md, padding: '20px 24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <AlertCircle size={15} strokeWidth={1.5} color={C.warning} />
              <span style={{ fontFamily: FONT.sans, fontSize: 15, fontWeight: 700, color: C.warning }}>
                {needsFollowUp.length} {needsFollowUp.length === 1 ? 'application' : 'applications'} ready for follow-up
              </span>
            </div>
            <div style={{ fontFamily: FONT.sans, fontSize: 13, color: C.t3, marginBottom: 16 }}>
              No reply in 7+ days. Follow-ups roughly double reply rates.
            </div>
            {needsFollowUp.map(app => (
              <div key={app.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 0', borderTop: `1px solid ${C.border}`,
              }}>
                <div>
                  <span style={{ fontFamily: FONT.sans, fontSize: 14, color: C.t1, fontWeight: 500 }}>{app.title}</span>
                  <span style={{ fontFamily: FONT.sans, fontSize: 14, color: C.t2 }}> · {app.company}</span>
                </div>
                <button onClick={() => setFuModal(app)} style={{
                  background: 'rgba(242,153,74,0.08)', border: `1px solid rgba(242,153,74,0.25)`,
                  color: C.warning, fontFamily: FONT.sans, fontSize: 13, fontWeight: 600,
                  padding: '8px 14px', borderRadius: R.sm, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 7,
                }}>
                  <RefreshCw size={13} strokeWidth={2} /> Draft follow-up
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Kanban */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {STAGES.map(stage => {
            const items = applied.filter(a => a.stage === stage.id)
            return (
              <div key={stage.id}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  paddingBottom: 14, borderBottom: `1px solid ${C.border}`, marginBottom: 14,
                }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: stage.color, flexShrink: 0 }} />
                  <Eyebrow color={C.t2}>{stage.label}</Eyebrow>
                  <span style={{ fontFamily: FONT.mono, fontSize: 11, color: C.t3, marginLeft: 'auto' }}>{items.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {items.length === 0
                    ? <div style={{ fontFamily: FONT.sans, fontSize: 13, color: C.t3, padding: '6px 0', fontStyle: 'italic' }}>Empty</div>
                    : items.map(app => (
                        <PipelineCard key={app.id} app={app} onFollowUp={setFuModal} onAdvance={onAdvanceStage} />
                      ))
                  }
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {fuModal && (
        <FollowUpModal app={fuModal} profile={profile} onClose={() => setFuModal(null)} onSent={onFollowUp} />
      )}
    </div>
  )
}
