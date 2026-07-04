import { useState, useRef } from 'react'
import { AlertCircle, RefreshCw, Send, Loader, X, ExternalLink, Mail } from 'lucide-react'
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
    const subject = `Following up - ${app.title}`
    const gmailUrl = buildGmailUrl(app.email, subject, body)
    window.open(gmailUrl, '_blank')
    setTimeout(() => { setSending(false); onSent(app.id); onClose() }, 500)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(12,12,13,0.88)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'fadeIn 0.2s ease' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: R.lg, width: '100%', maxWidth: 520, animation: 'slideUp 0.28s cubic-bezier(0.16,1,0.3,1)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: FONT.sans, fontSize: 16, fontWeight: 600, color: C.t1 }}>Follow-up: {app.company}</div>
          <div style={{ fontFamily: FONT.mono, fontSize: 11, color: C.t3, letterSpacing: '0.06em', marginTop: 5 }}>TO: {app.email}</div>
        </div>
        <div style={{ padding: '22px 24px', minHeight: 150 }}>
          {loading
            ? <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[88, 62, 44].map((w, i) => <Skeleton key={i} width={`${w}%`} height={15} />)}</div>
            : <textarea value={body} onChange={e => setBody(e.target.value)} style={{ width: '100%', minHeight: 150, background: 'none', border: 'none', outline: 'none', color: C.t1, fontFamily: FONT.sans, fontSize: 15, lineHeight: 1.75, resize: 'none', boxSizing: 'border-box' }} />
          }
        </div>
        <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <GhostBtn onClick={onClose}>Keep waiting</GhostBtn>
          <PrimaryBtn onClick={send} disabled={loading || sending}>
            {sending ? <><Loader size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> Opening...</> : <><Send size={13} strokeWidth={2} /> Open in Gmail</>}
          </PrimaryBtn>
        </div>
      </div>
    </div>
  )
}

// Email preview modal for drafted items
function EmailPreviewModal({ app, emailCache, profile, onClose, onSend }) {
  const body = emailCache[app.id] || '(no draft saved)'
  const [text, setText] = useState(body)
  const [sending, setSending] = useState(false)

  const send = () => {
    setSending(true)
    const subject = `${app.title} - ${profile.name || 'Application'}`
    const gmailUrl = buildGmailUrl(app.email, subject, text)
    window.open(gmailUrl, '_blank')
    setTimeout(() => { setSending(false); onSend(app.id); onClose() }, 500)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(12,12,13,0.88)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'fadeIn 0.2s ease' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: R.lg, width: '100%', maxWidth: 560, animation: 'slideUp 0.28s cubic-bezier(0.16,1,0.3,1)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: FONT.sans, fontSize: 16, fontWeight: 600, color: C.t1 }}>{app.title} - {app.company}</div>
          <div style={{ fontFamily: FONT.mono, fontSize: 11, color: C.t3, letterSpacing: '0.06em', marginTop: 5 }}>DRAFT - TO: {app.email}</div>
        </div>
        <div style={{ padding: '22px 24px', minHeight: 180 }}>
          <textarea value={text} onChange={e => setText(e.target.value)}
            style={{ width: '100%', minHeight: 180, background: 'none', border: 'none', outline: 'none', color: C.t1, fontFamily: FONT.sans, fontSize: 14, lineHeight: 1.75, resize: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between' }}>
          <GhostBtn onClick={onClose}>Close</GhostBtn>
          <PrimaryBtn onClick={send} disabled={sending || !app.email}>
            {sending ? <><Loader size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> Opening...</> : <><ExternalLink size={13} strokeWidth={2} /> Open in Gmail</>}
          </PrimaryBtn>
        </div>
      </div>
    </div>
  )
}

function PipelineCard({ app, emailCache, onMove, onRemove, onFollowUp, onPreviewDraft, onSend, stages }) {
  const days = Math.floor((Date.now() - new Date(app.sentAt)) / 86400000)
  const [dragging, setDragging] = useState(false)
  const [showMoveMenu, setShowMoveMenu] = useState(false)
  const hasDraft = !!emailCache[app.id]
  const hasEmail = !!app.email
  const hasUrl = !!app.applyUrl

  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.setData('jobId', String(app.id)); setDragging(true) }}
      onDragEnd={() => setDragging(false)}
      style={{
        background: C.surface, border: `1px solid ${dragging ? C.borderHi : C.border}`,
        borderRadius: R.md, padding: '13px 15px', cursor: 'grab',
        opacity: dragging ? 0.5 : 1,
        transition: 'border-color 0.12s ease, opacity 0.1s ease',
        position: 'relative',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = C.borderHi}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; setShowMoveMenu(false) }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: FONT.sans, fontSize: 13, fontWeight: 600, color: C.t1, lineHeight: 1.3 }}>{app.title}</div>
          <div style={{ fontFamily: FONT.sans, fontSize: 12, color: C.t2, marginTop: 3 }}>{app.company}</div>
        </div>
        <button onClick={() => onRemove(app.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.t3, padding: '0 0 0 8px', flexShrink: 0, transition: 'color 0.1s ease' }}
          onMouseEnter={e => e.currentTarget.style.color = C.error}
          onMouseLeave={e => e.currentTarget.style.color = C.t3}>
          <X size={13} strokeWidth={2} />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
        <div style={{ fontFamily: FONT.mono, fontSize: 10, color: C.t3, letterSpacing: '0.04em' }}>
          {days === 0 ? 'TODAY' : `${days}D AGO`}
          {app.followUps > 0 && ` · ${app.followUps} FU`}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {/* Actions based on what's available */}
          {app.stage === 'drafted' && hasDraft && hasEmail && (
            <button onClick={() => onPreviewDraft(app)} title="Preview and send draft"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.green, padding: 0, display: 'flex' }}>
              <Mail size={12} strokeWidth={1.5} />
            </button>
          )}
          {hasUrl && app.stage === 'drafted' && (
            <button onClick={() => window.open(app.applyUrl, '_blank')} title="Open listing"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.t3, padding: 0, display: 'flex', transition: 'color 0.1s ease' }}
              onMouseEnter={e => e.currentTarget.style.color = C.t2}
              onMouseLeave={e => e.currentTarget.style.color = C.t3}>
              <ExternalLink size={12} strokeWidth={1.5} />
            </button>
          )}
          {app.stage === 'sent' && hasEmail && (
            <button onClick={() => onFollowUp(app)} title="Draft follow-up"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.t3, padding: 0, display: 'flex', transition: 'color 0.1s ease' }}
              onMouseEnter={e => e.currentTarget.style.color = C.warning}
              onMouseLeave={e => e.currentTarget.style.color = C.t3}>
              <RefreshCw size={12} strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function DropZone({ stageId, onDrop, children }) {
  const [over, setOver] = useState(false)

  return (
    <div
      onDragOver={e => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={e => {
        e.preventDefault()
        setOver(false)
        const id = e.dataTransfer.getData('jobId')
        if (id) onDrop(id, stageId)
      }}
      style={{
        minHeight: 80,
        border: over ? `1px dashed ${C.green}` : '1px dashed transparent',
        borderRadius: R.md,
        padding: over ? 4 : 0,
        transition: 'all 0.15s ease',
        display: 'flex', flexDirection: 'column', gap: 10,
        background: over ? 'rgba(184,245,160,0.03)' : 'transparent',
      }}
    >
      {children}
    </div>
  )
}

export default function Pipeline({ pipeline, emailCache, profile, onMoveStage, onRemove, onFollowUp }) {
  const [fuModal, setFuModal] = useState(null)
  const [previewModal, setPreviewModal] = useState(null)

  const needsFollowUp = pipeline.filter(a =>
    a.stage === 'sent' &&
    (Date.now() - new Date(a.sentAt)) / 86400000 >= 7 &&
    a.followUps === 0
  )

  const handleDrop = (jobIdStr, targetStage) => {
    const id = isNaN(Number(jobIdStr)) ? jobIdStr : Number(jobIdStr)
    onMoveStage(id, targetStage)
  }

  const handleSendFromDraft = (id) => {
    onMoveStage(id, 'sent')
  }

  if (pipeline.length === 0) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 380 }}>
          <div style={{ fontFamily: FONT.sans, fontSize: 44, fontWeight: 700, color: C.t1, letterSpacing: '-0.025em', lineHeight: 1, marginBottom: 16 }}>
            Nothing here<span style={{ color: C.green }}>.</span>
          </div>
          <div style={{ fontFamily: FONT.sans, fontSize: 16, color: C.t2, lineHeight: 1.6 }}>
            Head to Discover, select roles, review and send or save drafts.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ padding: '44px 52px' }}>
        <Eyebrow style={{ display: 'block', marginBottom: 12 }}>Pipeline</Eyebrow>
        <div style={{ fontFamily: FONT.sans, fontSize: 44, fontWeight: 700, color: C.t1, letterSpacing: '-0.025em', lineHeight: 1, marginBottom: 10 }}>
          {pipeline.length} tracked<span style={{ color: C.green }}>.</span>
        </div>
        <div style={{ fontFamily: FONT.sans, fontSize: 15, color: C.t2, marginBottom: 36 }}>
          drag cards between columns to move stages
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 36 }}>
          {STAGES.map(s => {
            const count = pipeline.filter(a => a.stage === s.id).length
            return (
              <div key={s.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: R.md, padding: '16px 18px' }}>
                <div style={{ fontFamily: FONT.sans, fontSize: 30, fontWeight: 700, color: s.color, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{count}</div>
                <Eyebrow color={C.t3} style={{ display: 'block', marginTop: 8 }}>{s.label}</Eyebrow>
              </div>
            )
          })}
        </div>

        {/* Follow-up alerts */}
        {needsFollowUp.length > 0 && (
          <div style={{ marginBottom: 36, background: 'rgba(242,153,74,0.04)', border: `1px solid rgba(242,153,74,0.2)`, borderRadius: R.md, padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <AlertCircle size={15} strokeWidth={1.5} color={C.warning} />
              <span style={{ fontFamily: FONT.sans, fontSize: 15, fontWeight: 700, color: C.warning }}>
                {needsFollowUp.length} {needsFollowUp.length === 1 ? 'application' : 'applications'} ready for follow-up
              </span>
            </div>
            <div style={{ fontFamily: FONT.sans, fontSize: 13, color: C.t3, marginBottom: 16 }}>
              no reply in 7+ days. follow-ups roughly double reply rates.
            </div>
            {needsFollowUp.map(app => (
              <div key={app.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderTop: `1px solid ${C.border}` }}>
                <div>
                  <span style={{ fontFamily: FONT.sans, fontSize: 14, color: C.t1, fontWeight: 500 }}>{app.title}</span>
                  <span style={{ fontFamily: FONT.sans, fontSize: 14, color: C.t2 }}> · {app.company}</span>
                </div>
                <button onClick={() => setFuModal(app)} style={{ background: 'rgba(242,153,74,0.08)', border: `1px solid rgba(242,153,74,0.25)`, color: C.warning, fontFamily: FONT.sans, fontSize: 13, fontWeight: 600, padding: '8px 14px', borderRadius: R.sm, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <RefreshCw size={13} strokeWidth={2} /> draft follow-up
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Drag and drop kanban */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
          {STAGES.map(stage => {
            const items = pipeline.filter(a => a.stage === stage.id)
            return (
              <div key={stage.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 14, borderBottom: `1px solid ${C.border}`, marginBottom: 12 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: stage.color, flexShrink: 0 }} />
                  <Eyebrow color={C.t2}>{stage.label}</Eyebrow>
                  <span style={{ fontFamily: FONT.mono, fontSize: 10, color: C.t3, marginLeft: 'auto' }}>{items.length}</span>
                </div>
                <DropZone stageId={stage.id} onDrop={handleDrop}>
                  {items.length === 0
                    ? <div style={{ fontFamily: FONT.sans, fontSize: 12, color: C.t3, padding: '6px 0', fontStyle: 'italic' }}>empty</div>
                    : items.map(app => (
                        <PipelineCard
                          key={app.id}
                          app={app}
                          emailCache={emailCache}
                          onMove={onMoveStage}
                          onRemove={onRemove}
                          onFollowUp={setFuModal}
                          onPreviewDraft={setPreviewModal}
                          onSend={handleSendFromDraft}
                          stages={STAGES}
                        />
                      ))
                  }
                </DropZone>
              </div>
            )
          })}
        </div>
      </div>

      {fuModal && (
        <FollowUpModal app={fuModal} profile={profile} onClose={() => setFuModal(null)} onSent={onFollowUp} />
      )}
      {previewModal && (
        <EmailPreviewModal app={previewModal} emailCache={emailCache} profile={profile} onClose={() => setPreviewModal(null)} onSend={handleSendFromDraft} />
      )}
    </div>
  )
}
