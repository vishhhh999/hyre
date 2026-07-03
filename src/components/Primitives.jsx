import { C, FONT, R } from '../lib/tokens.js'
import { CheckCircle } from 'lucide-react'

export const Eyebrow = ({ children, color = C.t3, style = {} }) => (
  <span style={{
    fontFamily: FONT.mono, fontSize: 11, fontWeight: 500,
    letterSpacing: '0.1em', color, textTransform: 'uppercase', ...style,
  }}>
    {children}
  </span>
)

export const MatchScore = ({ score }) => {
  const color = score >= 90 ? C.green : score >= 80 ? C.warning : C.t2
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 48, height: 3, background: C.elevated, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 2 }} />
      </div>
      <span style={{
        fontFamily: FONT.mono, fontSize: 13, fontWeight: 500, color,
        letterSpacing: '0.02em', fontVariantNumeric: 'tabular-nums', minWidth: 28,
      }}>
        {score}
      </span>
    </div>
  )
}

export const Tag = ({ label }) => (
  <span style={{
    fontFamily: FONT.mono, fontSize: 11, fontWeight: 400,
    letterSpacing: '0.05em', color: C.t2,
    background: C.elevated, border: `1px solid ${C.border}`,
    borderRadius: R.xs, padding: '4px 9px',
  }}>
    {label}
  </span>
)

export const Check = ({ checked, size = 17 }) => (
  <div style={{
    width: size, height: size, borderRadius: R.xs,
    border: `1.5px solid ${checked ? C.green : C.borderHi}`,
    background: checked ? C.green : 'transparent',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, transition: 'all 0.12s ease',
  }}>
    {checked && <CheckCircle size={size - 5} strokeWidth={3} color={C.canvas} />}
  </div>
)

export const Kbd = ({ k }) => (
  <span style={{
    fontFamily: FONT.mono, fontSize: 11, fontWeight: 500, color: C.t2,
    background: C.elevated, border: `1px solid ${C.borderHi}`,
    borderRadius: R.xs, padding: '2px 7px', letterSpacing: '0.04em',
  }}>
    {k}
  </span>
)

export const Skeleton = ({ width = '100%', height = 14, style = {} }) => (
  <div style={{
    width, height, borderRadius: R.xs,
    background: `linear-gradient(90deg, ${C.elevated} 25%, ${C.border} 50%, ${C.elevated} 75%)`,
    backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', ...style,
  }} />
)

export const PrimaryBtn = ({ children, onClick, disabled, style = {} }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: disabled ? C.elevated : C.green,
    border: 'none', color: disabled ? C.t3 : C.canvas,
    fontFamily: FONT.sans, fontSize: 15, fontWeight: 700,
    padding: '11px 22px', borderRadius: R.sm,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', gap: 8,
    opacity: disabled ? 0.5 : 1, transition: 'opacity 0.12s ease', ...style,
  }}>
    {children}
  </button>
)

export const GhostBtn = ({ children, onClick, style = {} }) => (
  <button onClick={onClick} style={{
    background: 'none', border: `1px solid ${C.border}`,
    color: C.t2, fontFamily: FONT.sans, fontSize: 14, fontWeight: 500,
    padding: '10px 16px', borderRadius: R.sm, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 7, transition: 'border-color 0.12s ease, color 0.12s ease', ...style,
  }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderHi; e.currentTarget.style.color = C.t1 }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.t2 }}
  >
    {children}
  </button>
)
