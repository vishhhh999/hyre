import { useState, useCallback } from 'react'
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

export default function App() {
  const [nav, setNav] = useState('discover')
  const [applied, setApplied] = useState([])          // starts empty — nothing fake
  const [dismissed, setDismissed] = useState([])      // dismissed job IDs
  const [deckQueue, setDeckQueue] = useState(null)
  const [profile, setProfile] = useState({ ...DEFAULT_PROFILE })

  const handleSend = useCallback((job) => {
    setApplied(p => {
      if (p.find(a => a.id === job.id)) return p
      return [{
        id: job.id, title: job.title, company: job.company,
        email: job.email, stage: 'sent',
        sentAt: new Date().toISOString(), followUps: 0,
      }, ...p]
    })
  }, [])

  const handleDismiss = useCallback((id) => {
    setDismissed(p => [...p, id])
  }, [])

  const handleFollowUp = (id) =>
    setApplied(p => p.map(a => a.id === id ? { ...a, followUps: a.followUps + 1 } : a))

  const handleAdvanceStage = (id, stage) =>
    setApplied(p => p.map(a => a.id === id ? { ...a, stage } : a))

  const followUpCount = applied.filter(a =>
    a.stage === 'sent' &&
    (Date.now() - new Date(a.sentAt)) / 86400000 >= 7 &&
    a.followUps === 0
  ).length

  const gmailConnected = false  // honest — not connected until OAuth is wired

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
        {/* Sidebar */}
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

          {/* Honest connection status */}
          <div style={{ padding: '18px 26px', borderTop: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                background: gmailConnected ? C.green : C.t3,
              }} />
              <Eyebrow color={C.t3}>
                {gmailConnected ? 'Gmail connected' : 'Gmail not connected'}
              </Eyebrow>
            </div>
            {!gmailConnected && (
              <div style={{ fontFamily: FONT.sans, fontSize: 11, color: C.t3, marginTop: 5, lineHeight: 1.5 }}>
                Emails open in Gmail as drafts
              </div>
            )}
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {nav === 'discover' && (
            <Discover
              appliedIds={applied.map(a => a.id)}
              dismissedIds={dismissed}
              onDismiss={handleDismiss}
              onEnterDeck={setDeckQueue}
            />
          )}
          {nav === 'pipeline' && (
            <Pipeline
              applied={applied}
              profile={profile}
              onFollowUp={handleFollowUp}
              onAdvanceStage={handleAdvanceStage}
            />
          )}
          {nav === 'profile' && (
            <Profile profile={profile} onSave={setProfile} />
          )}
        </main>
      </div>

      {deckQueue && (
        <ReviewDeck
          queue={deckQueue}
          profile={profile}
          onSend={handleSend}
          onExit={() => { setDeckQueue(null); setNav('pipeline') }}
        />
      )}
    </>
  )
}
