import { cn } from '@/lib/utils'

// MonitorIllustration is the friendly air monitor from the mobile app
// (app/lib/widgets/monitor_illustration.dart), drawn in Sand & Sage: a sand
// body with a wood outline, a sage screen with a smile, a status light that
// glows softly, and a ground ellipse instead of a drop shadow. It floats
// gently and holds still under prefers-reduced-motion. Pass `label` when it
// carries meaning; otherwise it's hidden from assistive technology.
export function MonitorIllustration({ label, className, animated = true }) {
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true }
  return (
    <svg
      viewBox="0 0 120 100"
      className={cn('h-auto w-28', className)}
      {...a11y}
    >
      <ellipse
        cx="60"
        cy="90"
        rx="44"
        ry="5"
        fill="var(--ground)"
      />
      <g
        className={animated ? 'animate-float' : undefined}
        style={{ transformBox: 'fill-box' }}
      >
        <rect
          x="26"
          y="24"
          width="68"
          height="56"
          rx="16"
          fill="var(--sand)"
          stroke="var(--wood)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <rect
          x="36"
          y="34"
          width="48"
          height="28"
          rx="8"
          fill="var(--sage)"
        />
        <circle
          cx="52"
          cy="45"
          r="2.4"
          fill="#fff"
        />
        <circle
          cx="68"
          cy="45"
          r="2.4"
          fill="#fff"
        />
        <path
          d="M52 52 Q60 58 68 52"
          fill="none"
          stroke="#fff"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <circle
          cx="84"
          cy="71"
          r="2.6"
          fill="var(--highlight)"
          className={animated ? 'animate-glow' : undefined}
        />
      </g>
    </svg>
  )
}

// MonitorGlyph is the monitor as a 24px line icon, used for the brand mark.
export function MonitorGlyph({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('size-5', className)}
      aria-hidden="true"
    >
      <rect
        x="3"
        y="4.5"
        width="18"
        height="15"
        rx="4.5"
      />
      <path d="M9.5 10.5v.01M14.5 10.5v.01" />
      <path d="M9.5 13.5q2.5 2 5 0" />
    </svg>
  )
}
