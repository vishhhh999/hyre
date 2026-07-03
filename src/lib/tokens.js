// HYRE Design Tokens
// Decision-tree derivation:
// Buyer belief → "precision tool built by someone who understands craft"
// Canvas → dark, cool-tinted (#0c0c0d not #0e0e0e — cooler = tool, warmer = lifestyle)
// Accent job → CTA-only. Green appears ONLY on primary actions + active states. Never decorative.
// Elevation → surface-luminance ladder. Zero shadows on dark canvas (physically wrong).
// Radius → 4-step closed set, role-locked.
// Type → DM Sans (UI) + DM Mono (system labels, scores, timestamps). Two families, strict role split.
// Convention break → Review Deck left panel uses warm #141413 tint vs cool main canvas — temperature split creates depth without color.

export const C = {
  // Canvas — luminance ladder only, no shadows
  canvas:    '#0c0c0d',
  surface:   '#111113',
  elevated:  '#18181b',
  overlay:   '#1e1e22',

  // Borders
  border:    '#26262a',
  borderHi:  '#38383e',

  // Text
  t1: '#f0ece4',
  t2: '#8e8a83',
  t3: '#52504c',

  // Accent — ONE job: primary CTA + active state only
  green: '#b8f5a0',
  greenDim: 'rgba(184,245,160,0.08)',
  greenBorder: 'rgba(184,245,160,0.2)',

  // Semantic
  success: '#6fcf97',
  warning: '#f2994a',
  error:   '#eb5757',

  // Review Deck left panel — warm tint, deliberate temperature split
  deckPanel: '#141413',
}

// Typography — two families, strict role separation
// DM Sans → all UI text: labels, body, buttons, nav
// DM Mono → eyebrows, match scores, stage badges, timestamps, email addresses
export const FONT = {
  sans: "'DM Sans', sans-serif",
  mono: "'DM Mono', monospace",
}

// Radius — 4-step closed vocabulary, role-locked
// 4px  → chips, tags, checkboxes
// 6px  → inputs, buttons
// 10px → cards, panels, dropdowns
// 16px → modals, deck overlay panels
export const R = { xs: 4, sm: 6, md: 10, lg: 16 }

// Spacing — 4px base unit, multiples only
export const S = {
  1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24,
  8: 32, 10: 40, 12: 48, 16: 64, 20: 80,
}
