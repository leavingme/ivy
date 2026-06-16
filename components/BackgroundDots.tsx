/**
 * Background dot pattern — pure CSS, zero JS, no canvas.
 * Matches leavingme.cn's radial-gradient dot pattern.
 */
export function BackgroundDots() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 bg-dots"
      style={{
        maskImage:
          'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        WebkitMaskImage:
          'radial-gradient(ellipse at center, black 30%, transparent 75%)',
      }}
    />
  )
}
