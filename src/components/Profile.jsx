import { useState, useRef } from 'react'
import { Upload, CheckCircle, FileText, X } from 'lucide-react'
import { C, FONT, R } from '../lib/tokens.js'
import { Eyebrow, PrimaryBtn } from './Primitives.jsx'

function Field({ label, value, onChange, multiline, half, placeholder, rows }) {
  const [focused, setFocused] = useState(false)
  const shared = {
    width: '100%', background: C.surface,
    border: `1px solid ${focused ? C.borderHi : C.border}`,
    borderRadius: R.sm, padding: '12px 14px',
    color: C.t1, fontFamily: FONT.sans, fontSize: 15,
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.12s ease',
  }
  return (
    <div style={{ gridColumn: half ? 'auto' : '1 / -1' }}>
      <Eyebrow style={{ display: 'block', marginBottom: 8 }}>{label}</Eyebrow>
      {multiline
        ? <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder || ''}
            style={{ ...shared, resize: 'none', minHeight: rows ? rows * 28 : 88, lineHeight: 1.65 }}
          />
        : <input
            value={value}
            onChange={e => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder || ''}
            style={shared}
          />
      }
    </div>
  )
}

function FileUpload({ label, hint, accept, fileName, onFile, onClear }) {
  const inputRef = useRef(null)
  return (
    <div>
      <Eyebrow style={{ display: 'block', marginBottom: 8 }}>{label}</Eyebrow>
      {fileName ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: C.surface, border: `1px solid ${C.green}`,
          borderRadius: R.sm, padding: '12px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={15} strokeWidth={1.5} color={C.green} />
            <span style={{ fontFamily: FONT.sans, fontSize: 14, color: C.t1 }}>{fileName}</span>
          </div>
          <button
            onClick={onClear}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.t3, display: 'flex' }}
            onMouseEnter={e => e.currentTarget.style.color = C.error}
            onMouseLeave={e => e.currentTarget.style.color = C.t3}
          >
            <X size={15} strokeWidth={2} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          style={{
            width: '100%', border: `1px dashed ${C.border}`,
            borderRadius: R.sm, padding: '20px 16px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            cursor: 'pointer', background: 'none', transition: 'border-color 0.12s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = C.borderHi}
          onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
        >
          <Upload size={18} strokeWidth={1.5} color={C.t3} />
          <div style={{ fontFamily: FONT.sans, fontSize: 14, fontWeight: 600, color: C.t2 }}>{label}</div>
          <div style={{ fontFamily: FONT.mono, fontSize: 11, color: C.t3, letterSpacing: '0.04em' }}>{hint}</div>
        </button>
      )}
      <input
        ref={inputRef} type="file" accept={accept} style={{ display: 'none' }}
        onChange={e => { const f = e.target.files[0]; if (f) onFile(f.name) }}
      />
    </div>
  )
}

export default function Profile({ profile, onSave }) {
  const [data, setData] = useState({ ...profile })
  const [saved, setSaved] = useState(false)

  const set = k => val => setData(p => ({ ...p, [k]: val }))

  const handleSave = () => {
    onSave({ ...data })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ padding: '44px 52px', maxWidth: 680 }}>
        <Eyebrow style={{ display: 'block', marginBottom: 12 }}>Profile</Eyebrow>
        <div style={{
          fontFamily: FONT.sans, fontSize: 44, fontWeight: 700,
          color: C.t1, letterSpacing: '-0.025em', lineHeight: 1, marginBottom: 10,
        }}>
          Your applicant data<span style={{ color: C.green }}>.</span>
        </div>
        <div style={{ fontFamily: FONT.sans, fontSize: 15, color: C.t2, marginBottom: 36 }}>
          Every email Claude writes pulls from this. The more detail here, the better the output.
        </div>

        {/* Identity header — name + role, no photo */}
        <div style={{
          padding: '18px 20px',
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: R.md,
          marginBottom: 28,
        }}>
          <div style={{ fontFamily: FONT.sans, fontSize: 17, fontWeight: 700, color: C.t1 }}>
            {data.name || <span style={{ color: C.t3 }}>Your name</span>}
          </div>
          <div style={{ fontFamily: FONT.sans, fontSize: 14, color: C.t2, marginTop: 3 }}>
            {data.role || <span style={{ color: C.t3 }}>Your role</span>}
          </div>
        </div>

        {/* Contact + basics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <Field label="Full Name" value={data.name} onChange={set('name')} half placeholder="Vishesh Mahendru" />
          <Field label="Role / Title" value={data.role} onChange={set('role')} half placeholder="Brand & Visual Designer" />
          <Field label="Email" value={data.email} onChange={set('email')} half placeholder="you@email.com" />
          <Field label="Phone" value={data.phone || ''} onChange={set('phone')} half placeholder="+91 00000 00000" />
          <Field label="Portfolio URL" value={data.portfolio} onChange={set('portfolio')} placeholder="visheshmahendru.com" />
          <Field label="Years of Experience" value={data.experience} onChange={set('experience')} half placeholder="3–4 years" />
          <Field
            label="Skills"
            value={data.skills}
            onChange={set('skills')}
            multiline
            placeholder="Brand identity, packaging, web design, Figma, Framer, Blender 3D…"
          />
          <Field
            label="About Me"
            value={data.about || ''}
            onChange={set('about')}
            multiline
            rows={5}
            placeholder="Write in first person. Describe your background, approach, what kind of work you do best, and what you're looking for. Claude will pull from this when writing emails."
          />
        </div>

        {/* File uploads */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
          <FileUpload
            label="Resume / CV"
            hint="PDF · attached to every email"
            accept=".pdf,.doc,.docx"
            fileName={data.resumeName}
            onFile={name => setData(p => ({ ...p, resumeName: name }))}
            onClear={() => setData(p => ({ ...p, resumeName: null }))}
          />
          <FileUpload
            label="Portfolio PDF"
            hint="Optional · linked in emails"
            accept=".pdf"
            fileName={data.portfolioFileName}
            onFile={name => setData(p => ({ ...p, portfolioFileName: name }))}
            onClear={() => setData(p => ({ ...p, portfolioFileName: null }))}
          />
        </div>

        <PrimaryBtn onClick={handleSave}>
          {saved ? <><CheckCircle size={15} strokeWidth={2} /> Profile saved</> : 'Save profile'}
        </PrimaryBtn>
      </div>
    </div>
  )
}
