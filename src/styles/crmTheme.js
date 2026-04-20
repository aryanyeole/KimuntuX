/**
 * crmTheme.js — Shared design tokens for all CRM components.
 * Matches the main site's black + white + teal/emerald aesthetic.
 * Every CRM file imports this and aliases it as `C` so existing
 * styled-component references need no change.
 *
 * Main site fonts: Poppins (headings), Roboto (body), Montserrat (labels)
 * Main site accent: #00C896 (teal-green)
 */

// Google Fonts import string — paste into a <link> or @import if needed.
// The CRM shell (CRMLayout) injects a <style> tag; all child components
// inherit the font-family from the Shell wrapper.
export const CRM_FONT_IMPORT =
  "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Roboto:wght@300;400;500;700&display=swap";

export const crm = {
  // ── Backgrounds — true blacks ──────────────────────────────────────────────
  bg:          '#000000',
  surface:     '#0a0a0a',
  surfaceAlt:  '#111111',
  card:        '#141414',
  cardHover:   '#1a1a1a',

  // ── Borders — subtle gray ──────────────────────────────────────────────────
  border:      '#1e1e1e',
  borderLight: '#2a2a2a',

  // ── Text ──────────────────────────────────────────────────────────────────
  text:        '#ffffff',
  muted:       '#9ca3af',   // secondary text (kept as `muted` for backward compat)
  textMuted:   '#9ca3af',
  textDim:     '#6b7280',   // tertiary/placeholder

  // ── Primary accent — teal/emerald green (matches site logo) ───────────────
  accent:      '#00C896',
  accentLight: '#33D4B2',
  accentDark:  '#00A87E',
  accentHover: '#00B085',
  accentBg:    'rgba(0, 200, 150, 0.08)',

  // ── Secondary accent — purple (kept for variety) ───────────────────────────
  purple:      '#8b5cf6',   // kept as `purple` for backward compat
  secondary:   '#8b5cf6',
  secondaryBg: 'rgba(139, 92, 246, 0.08)',

  // ── Status ────────────────────────────────────────────────────────────────
  success:     '#00C896',
  successBg:   'rgba(0, 200, 150, 0.08)',
  warning:     '#f59e0b',
  warningBg:   'rgba(245, 158, 11, 0.08)',
  danger:      '#ef4444',
  dangerBg:    'rgba(239, 68, 68, 0.08)',

  // ── Lead classification ────────────────────────────────────────────────────
  hot:         '#ef4444',
  hotBg:       'rgba(239, 68, 68, 0.10)',
  warm:        '#f59e0b',
  warmBg:      'rgba(245, 158, 11, 0.10)',
  cold:        '#3b82f6',
  coldBg:      'rgba(59, 130, 246, 0.10)',

  // ── Convenience aliases ────────────────────────────────────────────────────
  green:       '#00C896',   // kept for CRMLayout `green` references
  blue:        '#3b82f6',

  // ── Gradients ─────────────────────────────────────────────────────────────
  gradient1:   'linear-gradient(135deg, #00C896, #00A87E)',
  gradient2:   'linear-gradient(135deg, #8b5cf6, #6d28d9)',

  // ── Typography ────────────────────────────────────────────────────────────
  fontFamily:  "'Poppins', 'Roboto', 'Helvetica Neue', sans-serif",

  // ── Border radius ─────────────────────────────────────────────────────────
  radius:      '8px',
  radiusLg:    '12px',
  radiusSm:    '6px',
};

export default crm;
