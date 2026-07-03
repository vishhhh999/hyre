import { useState } from 'react'
import { Upload, CheckCircle, FileText, Image } from 'lucide-react'
import { C, FONT, R } from '../lib/tokens.js'
import { PROFILE } from '../lib/data.js'
import { Eyebrow, PrimaryBtn } from './Primitives.jsx'

function Field({ label, value, onChange, multiline, half }) {
  const [focused, setFocused] = useState(false)
  const shared = {
    width: '100%',
    background: C.surface,
    border: `1px solid ${focused ? C.borderHi : C.border}`,
    borderRadius: R.sm,
    padding: '10px 12px',
    color: C.t1,
    fontFamily: FONT.sans,
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.12s ease',
  }

  return (
    <div style={{ gridColumn: half ? 'auto' : '1 / -1' }}>
      <Eyebrow style={{ display: 'block', marginBottom: 7 }}>{label}</Eyebrow>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            style={{ ...shared, resize: 'none', minHeight: 80, lineHeight: 1.6 }} />
        : <input value={value} onChange={e => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            style={shared} />
      }
    </div>
  )
}

export default function Profile() {
  const [data, setData] = useState({ ...PROFILE })
  const [saved, setSaved] = useState(false)

  const set = k => val => setData(p => ({ ...p, [k]: val }))

  const save = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ padding: '40px 48px', maxWidth: 620 }}>
        <Eyebrow style={{ display: 'block', marginBottom: 10 }}>Profile</Eyebrow>
        <div style={{
          fontFamily: FONT.sans, fontSize: 40, fontWeight: 700,
          color: C.t1, letterSpacing: '-0.025em', lineHeight: 1, marginBottom: 8,
        }}>
          Your applicant data<span style={{ color: C.green }}>.</span>
        </div>
        <div style={{ fontFamily: FONT.sans, fontSize: 13, color: C.t2, marginBottom: 32 }}>
          Every email Claude writes pulls directly from this. Keep it sharp.
        </div>

        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: C.elevated,
            border: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: FONT.sans, fontSize: 18, fontWeight: 700, color: C.t2 }}>VM</span>
          </div>
          <div>
            <div style={{ fontFamily: FONT.sans, fontSize: 14, fontWeight: 600, color: C.t1 }}>{data.name}</div>
            <div style={{ fontFamily: FONT.sans, fontSize: 12, color: C.t2, marginTop: 2 }}>{data.role}</div>
            <button style={{
              marginTop: 8, background: 'none',
              border: `1px solid ${C.border}`,
              color: C.t3, fontFamily: FONT.sans, fontSize: 11, fontWeight: 500,
              padding: '4px 10px', borderRadius: R.xs,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <Upload size={10} strokeWidth={1.5} /> Upload photo
            </button>
          </div>
        </div>

        {/* Fields grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
          <Field label="FULL NAME" value={data.name} onChange={set('name')} half />
          <Field label="ROLE / TITLE" value={data.role} onChange={set('role')} half />
          <Field label="EMAIL" value={data.email} onChange={set('email')} half />
          <Field label="PHONE" value={data.phone || ''} onChange={set('phone')} half />
          <Field label="PORTFOLIO URL" value={data.portfolio} onChange={set('portfolio')} />
          <Field label="YEARS OF EXPERIENCE" value={data.experience} onChange={set('experience')} half />
          <Field label="SKILLS" value={data.skills} onChange={set('skills')} multiline />
        </div>

        {/* File uploads */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Resume / CV', hint: 'PDF · attached to every email', Icon: FileText },
            { label: 'Portfolio PDF', hint: 'Optional · linked otherwise', Icon: Image },
          ].map(f => (
            <div key={f.label} style={{
              border: `1px dashed ${C.border}`,
              borderRadius: R.md,
              padding: '20px 16px',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 8, cursor: 'pointer', textAlign: 'center',
              transition: 'border-color 0.12s ease',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.borderHi}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
            >
              <f.Icon size={18} strokeWidth={1.5} color={C.t3} />
              <div style={{ fontFamily: FONT.sans, fontSize: 12, fontWeight: 600, color: C.t2 }}>{f.label}</div>
              <div style={{ fontFamily: FONT.mono, fontSize: 10, color: C.t3, letterSpacing: '0.04em' }}>{f.hint}</div>
            </div>
          ))}
        </div>

        <PrimaryBtn onClick={save}>
          {saved
            ? <><CheckCircle size={13} strokeWidth={2} /> Saved</>
            : 'Save profile'
          }
        </PrimaryBtn>
      </div>
    </div>
  )
}
