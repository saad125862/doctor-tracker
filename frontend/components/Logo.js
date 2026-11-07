// "Stethoscope" mark: one clean stroke with the chest piece as a dot. Colour comes from `color` (currentColor).
export function LogoMark({ size = 34, className }) {
  return (
    <svg className={className} width={size} height={(size * 130) / 120} viewBox="0 0 120 130" fill="none" role="img" aria-label="Doctor Tracker logo">
      <path d="M28 20 V52 A32 32 0 0 0 92 52 V20" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
      <circle cx="28" cy="16" r="8" fill="currentColor" />
      <circle cx="92" cy="16" r="8" fill="currentColor" />
      <path d="M60 84 V94" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
      <circle cx="60" cy="108" r="15" fill="currentColor" />
      <circle cx="60" cy="108" r="6" style={{ fill: 'var(--logo-dot, #0A0E14)' }} />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="brand-text">
      Doctor <em>Tracker</em>
    </span>
  );
}
