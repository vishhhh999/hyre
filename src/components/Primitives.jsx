import { C, FONT, R } from '../lib/tokens.js'
import { CheckCircle } from 'lucide-react'

// Mono eyebrow — used for ALL system-generated labels, scores, stages, timestamps
// DM Mono, positive tracking — signals "machine-generated data, not human copy"
export const Eyebrow = ({ children, color = C.t3, style = {} }) => (
  <span style={{
    fontFamily: FONT.mono,
    fontSize: 10,
    fontWeight: 500,
    letterSpacing: '0.1em',
    color,
    textTransform: 'uppercase',
    ...style,
  }}>
    {children}
  </span>
)

// Match score — mono, color-coded, tabular figures
export const MatchScore = ({ score }) => {
  const color = score >= 90 ? C.green : score >= 80 ? C.warning : C.t2
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 40, height: 2, background: C.elevated, borderRadius: 1, overflow: 'hidden' }}>
        <div style={{
          width: `${score}%`, height: '100%',
          background: color,
          borderRadius: 1,
          transition: 'width 0.4s ease',
        }} />
      </div>
      <span style={{
        fontFamily: FONT.mono,
        fontSize: 11,
        fontWeight: 500,
        color,
        letterSpacing: '0.04em',
        fontVariantNumeric: 'tabular-nums',
        minWidth: 24,
      }}>
        {score}
      </span>
    </div>
  )
}

// Tag chip — 4px radius (xs), mono label
export const Tag = ({ label }) => (
  <span style={{
    fontFamily: FONT.mono,
    fontSize: 10,
    fontWeight: 400,
    letterSpacing: '0.06em',
    color: C.t2,
    background: C.elevated,
    border: `1px solid ${C.border}`,
    borderRadius: R.xs,
    padding: '3px 7px',
  }}>
    {label}
  </span>
)

// Company logomark — luminance-stepped surface, no shadows
export const Logo = ({ initials, size = 40 }) => (
  <div style={{
    width: size, height: size,
    background: C.elevated,
    border: `1px solid ${C.border}`,
    borderRadius: R.md,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
    fontFamily: FONT.mono,
    fontSize: size <= 36 ? 10 : 11,
    fontWeight: 500,
    color: C.t3,
    letterSpacing: '0.06em',
  }}>
    {initials}
  </div>
)

// Checkbox — 4px radius, green only when checked
export const Check = ({ checked, size = 16 }) => (
  <div style={{
    width: size, height: size,
    borderRadius: R.xs,
    border: `1.5px solid ${checked ? C.green : C.borderHi}`,
    background: checked ? C.green : 'transparent',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.12s ease',
  }}>
    {checked && <CheckCircle size={size - 4} strokeWidth={3} color={C.canvas} />}
  </div>
)

// Kbd hint — mono, elevated surface
export const Kbd = ({ k }) => (
  <span style={{
    fontFamily: FONT.mono,
    fontSize: 10,
    fontWeight: 500,
    color: C.t2,
    background: C.elevated,
    border: `1px solid ${C.borderHi}`,
    borderRadius: R.xs,
    padding: '2px 6px',
    letterSpacing: '0.04em',
  }}>
    {k}
  </span>
)

// Stage badge — mono, semantic color, no background fill
export const StageBadge = ({ stage, stages }) => {
  const s = stages.find(x => x.id === stage)
  if (!s) return null
  return (
    <Eyebrow color={s.color}>{s.label}</Eyebrow>
  )
}

// Skeleton shimmer — used during email generation
export const Skeleton = ({ width = '100%', height = 12, style = {} }) => (
  <div style={{
    width, height,
    borderRadius: R.xs,
    background: `linear-gradient(90deg, ${C.elevated} 25%, ${C.border} 50%, ${C.elevated} 75%)`,
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.4s infinite',
    ...style,
  }} />
)

// Primary button — green, CTA only
export const PrimaryBtn = ({ children, onClick, disabled, style = {} }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      background: disabled ? C.elevated : C.green,
      border: 'none',
      color: disabled ? C.t3 : C.canvas,
      fontFamily: FONT.sans,
      fontSize: 13,
      fontWeight: 700,
      padding: '9px 18px',
      borderRadius: R.sm,
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', gap: 7,
      transition: 'opacity 0.12s ease',
      opacity: disabled ? 0.5 : 1,
      ...style,
    }}
  >
    {children}
  </button>
)

// Ghost button — no fill, hairline border
export const GhostBtn = ({ children, onClick, style = {} }) => (
  <button
    onClick={onClick}
    style={{
      background: 'none',
      border: `1px solid ${C.border}`,
      color: C.t2,
      fontFamily: FONT.sans,
      fontSize: 12,
      fontWeight: 500,
      padding: '8px 14px',
      borderRadius: R.sm,
      cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 6,
      transition: 'border-color 0.12s ease, color 0.12s ease',
      ...style,
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderHi; e.currentTarget.style.color = C.t1 }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.t2 }}
  >
    {children}
  </button>
)
