import { useState } from 'react'
import { AlertCircle, RefreshCw, Send, Loader, ArrowRight } from 'lucide-react'
import { C, FONT, R } from '../lib/tokens.js'
import { STAGES } from '../lib/data.js'
import { Eyebrow, PrimaryBtn, GhostBtn, Skeleton } from './Primitives.jsx'
import { generateFollowUp } from '../lib/api.js'

function FollowUpModal({ app, onClose, onSent }) {
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useState(() => {
    let alive = true
    generateFollowUp(app).then(text => {
      if (alive) { setBody(text); setLoading(false) }
    })
    return () => { alive = false }
  }, [])

  const send = async () => {
    setSending(true)
    await new Promise(r => setTimeout(r, 700))
    setSending(false)
    onSent(app.id)
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 150,
        background: 'rgba(12,12,13,0.88)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: R.lg,
        width: '100%', maxWidth: 500,
        animation: 'slideUp 0.28s cubic-bezier(0.16,1,0.3,1)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: FONT.sans, fontSize: 14, fontWeight: 600, color: C.t1 }}>
            Follow-up · {app.company}
          </div>
          <div style={{ fontFamily: FONT.mono, fontSize: 10, color: C.t3, letterSpacing: '0.06em', marginTop: 4 }}>
            TO: {app.email}
          </div>
        </div>

        <div style={{ padding: '20px 22px', minHeight: 140 }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[88, 62, 44].map((w, i) => <Skeleton key={i} width={`${w}%`} height={13} />)}
            </div>
          ) : (
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              style={{
                width: '100%', minHeight: 140,
                background: 'none', border: 'none', outline: 'none',
                color: C.t1, fontFamily: FONT.sans, fontSize: 13,
                lineHeight: 1.75, resize: 'none', boxSizing: 'border-box',
              }}
            />
          )}
        </div>

        <div style={{
          padding: '14px 22px',
          borderTop: `1px solid ${C.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <GhostBtn onClick={onClose}>Keep waiting</GhostBtn>
          <PrimaryBtn onClick={send} disabled={loading || sending}>
            {sending
              ? <><Loader size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> Sending…</>
              : <><Send size={12} strokeWidth={2} /> Send follow-up</>
            }
          </PrimaryBtn>
        </div>
      </div>
    </div>
  )
}

function PipelineCard({ app, onFollowUp, onAdvance, stages }) {
  const days = Math.floor((Date.now() - new Date(app.sentAt)) / 86400000)
  const stageIdx = stages.findIndex(s => s.id === app.stage)
  const nextStage = stages[stageIdx + 1]

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: R.md,
      padding: '12px 14px',
      transition: 'border-color 0.12s ease',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = C.borderHi}
      onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
    >
      <div style={{ fontFamily: FONT.sans, fontSize: 13, fontWeight: 600, color: C.t1, lineHeight: 1.3 }}>
        {app.title}
      </div>
      <div style={{ fontFamily: FONT.sans, fontSize: 12, color: C.t2, marginTop: 3 }}>
        {app.company}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
        <div style={{ fontFamily: FONT.mono, fontSize: 10, color: C.t3, letterSpacing: '0.04em' }}>
          {days === 0 ? 'TODAY' : `${days}D AGO`}
          {app.followUps > 0 && ` · ${app.followUps} FU`}
        </div>
        {nextStage && (
          <button
            onClick={() => onAdvance(app.id, nextStage.id)}
            title={`Mark as ${nextStage.label}`}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: C.t3, display: 'flex', alignItems: 'center', gap: 4,
              fontFamily: FONT.mono, fontSize: 10, letterSpacing: '0.06em',
              padding: 0, transition: 'color 0.1s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.color = nextStage.color}
            onMouseLeave={e => e.currentTarget.style.color = C.t3}
          >
            {nextStage.label.toUpperCase()} <ArrowRight size={10} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </div>
  )
}

export default function Pipeline({ applied, onFollowUp, onAdvanceStage }) {
  const [fuModal, setFuModal] = useState(null)

  const needsFollowUp = applied.filter(a =>
    a.stage === 'sent' &&
    (Date.now() - new Date(a.sentAt)) / 86400000 >= 7 &&
    a.followUps === 0
  )

  const sentCount = applied.length
  const interviewCount = applied.filter(a => a.stage === 'interview').length

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ padding: '40px 48px' }}>
        <Eyebrow style={{ display: 'block', marginBottom: 10 }}>Pipeline</Eyebrow>
        <div style={{
          fontFamily: FONT.sans, fontSize: 40, fontWeight: 700,
          color: C.t1, letterSpacing: '-0.025em', lineHeight: 1, marginBottom: 8,
        }}>
          {sentCount} applications<span style={{ color: C.green }}>.</span>
        </div>
        <div style={{ fontFamily: FONT.sans, fontSize: 13, color: C.t2, marginBottom: 32 }}>
          {interviewCount} in interview stage
        </div>

        {/* Stats row — tabular nums, mono */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 32 }}>
          {STAGES.map(s => {
            const count = applied.filter(a => a.stage === s.id).length
            return (
              <div key={s.id} style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: R.md,
                padding: '16px 18px',
              }}>
                <div style={{
                  fontFamily: FONT.sans, fontSize: 28, fontWeight: 700,
                  color: s.color,
                  letterSpacing: '-0.02em',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {count}
                </div>
                <Eyebrow color={C.t3} style={{ display: 'block', marginTop: 6 }}>{s.label}</Eyebrow>
              </div>
            )
          })}
        </div>

        {/* Follow-up engine */}
        {needsFollowUp.length > 0 && (
          <div style={{
            marginBottom: 32,
            background: 'rgba(242,153,74,0.04)',
            border: `1px solid rgba(242,153,74,0.2)`,
            borderRadius: R.md,
            padding: '18px 22px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <AlertCircle size={13} strokeWidth={1.5} color={C.warning} />
              <span style={{ fontFamily: FONT.sans, fontSize: 13, fontWeight: 700, color: C.warning }}>
                {needsFollowUp.length} {needsFollowUp.length === 1 ? 'application' : 'applications'} ready for follow-up
              </span>
            </div>
            <div style={{ fontFamily: FONT.sans, fontSize: 12, color: C.t3, marginBottom: 14 }}>
              No reply in 7+ days. Follow-ups roughly double reply rates.
            </div>
            {needsFollowUp.map(app => (
              <div key={app.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 0',
                borderTop: `1px solid ${C.border}`,
              }}>
                <div>
                  <span style={{ fontFamily: FONT.sans, fontSize: 13, color: C.t1, fontWeight: 500 }}>{app.title}</span>
                  <span style={{ fontFamily: FONT.sans, fontSize: 13, color: C.t2 }}> · {app.company}</span>
                </div>
                <button
                  onClick={() => setFuModal(app)}
                  style={{
                    background: 'rgba(242,153,74,0.08)',
                    border: `1px solid rgba(242,153,74,0.25)`,
                    color: C.warning,
                    fontFamily: FONT.sans, fontSize: 12, fontWeight: 600,
                    padding: '6px 12px', borderRadius: R.sm,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <RefreshCw size={11} strokeWidth={2} /> Draft follow-up
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Kanban columns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {STAGES.map(stage => {
            const items = applied.filter(a => a.stage === stage.id)
            return (
              <div key={stage.id}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  paddingBottom: 12,
                  borderBottom: `1px solid ${C.border}`,
                  marginBottom: 12,
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: stage.color, flexShrink: 0 }} />
                  <Eyebrow color={C.t2}>{stage.label}</Eyebrow>
                  <span style={{ fontFamily: FONT.mono, fontSize: 10, color: C.t3, marginLeft: 'auto' }}>{items.length}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {items.length === 0 ? (
                    <div style={{ fontFamily: FONT.sans, fontSize: 12, color: C.t3, padding: '8px 0', fontStyle: 'italic' }}>
                      Empty
                    </div>
                  ) : items.map(app => (
                    <PipelineCard
                      key={app.id}
                      app={app}
                      onFollowUp={setFuModal}
                      onAdvance={onAdvanceStage}
                      stages={STAGES}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {fuModal && (
        <FollowUpModal
          app={fuModal}
          onClose={() => setFuModal(null)}
          onSent={onFollowUp}
        />
      )}
    </div>
  )
}
