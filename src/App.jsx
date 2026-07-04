import { useState, useCallback, useEffect } from 'react'
import { Search, Inbox, User } from 'lucide-react'
import { C, FONT, R } from './lib/tokens.js'
import { DEFAULT_PROFILE } from './lib/data.js'
import { Eyebrow } from './components/Primitives.jsx'
import Discover from './components/Discover.jsx'
import Pipeline from './components/Pipeline.jsx'
import Profile from './components/Profile.jsx'
import ReviewDeck from './components/ReviewDeck.jsx'

const NAV = [
  { id: 'discover', label: 'Discover', icon: Search },
  { id: 'pipeline', label: 'Pipeline', icon: Inbox },
  { id: 'profile',  label: 'Profile',  icon: User },
]

const LS = {
  get: (key, fallback) => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
  },
  set: (key, val) => {
    try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
  },
}

export default function App() {
  const [nav, setNav] = useState('discover')

  // pipeline entries — all stages including 'drafted'
  const [pipeline, setPipeline] = useState(() => LS.get('hyre:pipeline', []))

  // dismissed job IDs
  const [dismissed, setDismissed] = useState(() => LS.get('hyre:dismissed', []))

  // email cache: { [jobId]: emailBodyString }
  const [emailCache, setEmailCache] = useState(() => LS.get('hyre:emailcache', {}))

  // cached live jobs from last API fetch
  const [cachedLiveJobs, setCachedLiveJobs] = useState(() => LS.get('hyre:livejobs', []))

  const [deckQueue, setDeckQueue] = useState(null)
  const [profile, setProfile] = useState(() => LS.get('hyre:profile', { ...DEFAULT_PROFILE }))

  // persist everything
  useEffect(() => { LS.set('hyre:pipeline', pipeline) }, [pipeline])
  useEffect(() => { LS.set('hyre:dismissed', dismissed) }, [dismissed])
  useEffect(() => { LS.set('hyre:emailcache', emailCache) }, [emailCache])
  useEffect(() => { LS.set('hyre:livejobs', cachedLiveJobs) }, [cachedLiveJobs])
  useEffect(() => { LS.set('hyre:profile', profile) }, [profile])

  const handleSaveProfile = useCallback((data) => {
    setProfile(data)
    LS.set('hyre:profile', data)
  }, [])

  // called from ReviewDeck when user clicks "open in Gmail" — adds to pipeline as 'sent'
  const handleSend = useCallback((job, emailBody) => {
    // cache the email so it never regenerates
    setEmailCache(p => {
      const updated = { ...p, [job.id]: emailBody }
      LS.set('hyre:emailcache', updated)
      return updated
    })
    setPipeline(p => {
      if (p.find(a => a.id === job.id)) return p
      return [{
        id: job.id, title: job.title, company: job.company,
        email: job.email, applyUrl: job.applyUrl || null,
        stage: 'sent', sentAt: new Date().toISOString(), followUps: 0,
      }, ...p]
    })
  }, [])

  // called from ReviewDeck when user saves draft without sending
  const handleDraft = useCallback((job, emailBody) => {
    setEmailCache(p => {
      const updated = { ...p, [job.id]: emailBody }
      LS.set('hyre:emailcache', updated)
      return updated
    })
    setPipeline(p => {
      if (p.find(a => a.id === job.id)) return p
      return [{
        id: job.id, title: job.title, company: job.company,
        email: job.email, applyUrl: job.applyUrl || null,
        stage: 'drafted', sentAt: new Date().toISOString(), followUps: 0,
      }, ...p]
    })
  }, [])

  const handleDismiss = useCallback((id) => {
    setDismissed(p => [...p, id])
  }, [])

  const handleMoveStage = useCallback((id, stage) => {
    setPipeline(p => p.map(a => a.id === id ? { ...a, stage } : a))
  }, [])

  const handleRemoveFromPipeline = useCallback((id) => {
    setPipeline(p => p.filter(a => a.id !== id))
  }, [])

  const handleFollowUp = useCallback((id) => {
    setPipeline(p => p.map(a => a.id === id ? { ...a, followUps: a.followUps + 1 } : a))
  }, [])

  // all job IDs in pipeline — exclude from discover
  const pipelineIds = pipeline.map(a => a.id)

  const followUpCount = pipeline.filter(a =>
    a.stage === 'sent' &&
    (Date.now() - new Date(a.sentAt)) / 86400000 >= 7 &&
    a.followUps === 0
  ).length

  return (
    <>
      <style>{`
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes deckSlide { from { opacity: 0; transform: translateX(22px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', background: C.canvas }}>
        <aside style={{
          width: 200, flexShrink: 0,
          borderRight: `1px solid ${C.border}`,
          display: 'flex', flexDirection: 'column',
          height: '100vh', position: 'sticky', top: 0,
        }}>
          <div style={{ padding: '30px 26px 26px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: FONT.sans, fontSize: 20, fontWeight: 700, color: C.t1, letterSpacing: '-0.02em' }}>
              HY<span style={{ color: C.green }}>RE</span>
            </div>
            <Eyebrow color={C.t3} style={{ display: 'block', marginTop: 5 }}>AI Job Agent</Eyebrow>
          </div>

          <nav style={{ padding: '14px 10px', flex: 1 }}>
            {NAV.map(item => {
              const active = nav === item.id
              return (
                <button key={item.id} onClick={() => setNav(item.id)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 11,
                  padding: '11px 16px', borderRadius: R.sm, border: 'none',
                  background: active ? C.surface : 'transparent',
                  color: active ? C.t1 : C.t2,
                  fontFamily: FONT.sans, fontSize: 15, fontWeight: active ? 600 : 400,
                  cursor: 'pointer', textAlign: 'left', marginBottom: 2,
                  transition: 'background 0.1s ease, color 0.1s ease',
                }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = C.surface; e.currentTarget.style.color = C.t1 } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.t2 } }}
                >
                  <item.icon size={16} strokeWidth={1.5} />
                  {item.label}
                  {item.id === 'pipeline' && followUpCount > 0 && (
                    <span style={{
                      marginLeft: 'auto', background: C.warning, color: C.canvas,
                      fontFamily: FONT.mono, fontSize: 10, fontWeight: 500,
                      padding: '2px 7px', borderRadius: 9999, letterSpacing: '0.04em',
                    }}>
                      {followUpCount}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </aside>

        <main style={{ flex: 1, height: '100vh', overflow: 'hidden' }}>
          {nav === 'discover' && (
            <Discover
              pipelineIds={pipelineIds}
              dismissedIds={dismissed}
              cachedLiveJobs={cachedLiveJobs}
              onCacheLiveJobs={setCachedLiveJobs}
              onDismiss={handleDismiss}
              onEnterDeck={setDeckQueue}
            />
          )}
          {nav === 'pipeline' && (
            <Pipeline
              pipeline={pipeline}
              emailCache={emailCache}
              profile={profile}
              onMoveStage={handleMoveStage}
              onRemove={handleRemoveFromPipeline}
              onFollowUp={handleFollowUp}
            />
          )}
          {nav === 'profile' && (
            <Profile profile={profile} onSave={handleSaveProfile} />
          )}
        </main>
      </div>

      {deckQueue && (
        <ReviewDeck
          queue={deckQueue}
          profile={profile}
          emailCache={emailCache}
          onSend={handleSend}
          onDraft={handleDraft}
          onExit={() => { setDeckQueue(null); setNav('pipeline') }}
        />
      )}
    </>
  )
}
