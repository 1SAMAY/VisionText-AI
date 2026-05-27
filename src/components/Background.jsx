const particles = Array.from({ length: 16 }, (_, index) => ({
  id: index,
  left: `${(index * 29) % 100}%`,
  top: `${(index * 47) % 100}%`,
  delay: `${(index % 9) * -0.9}s`,
  duration: `${8 + (index % 7)}s`,
  size: `${3 + (index % 5)}px`,
}))

export default function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(35,213,255,0.28),transparent_34%),radial-gradient(circle_at_80%_0%,rgba(255,62,165,0.24),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(145,255,239,0.16),transparent_32%)]" />
      <div className="absolute inset-0 animate-shimmer bg-[linear-gradient(115deg,rgba(255,255,255,0.02),rgba(35,213,255,0.12),rgba(255,62,165,0.09),rgba(145,255,239,0.08),rgba(255,255,255,0.02))] bg-[length:260%_260%]" />
      <div className="absolute inset-0 opacity-[0.13] [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:72px_72px]" />

      {particles.map((particle) => (
        <span
          key={particle.id}
          className="absolute rounded-full bg-ion/80 shadow-[0_0_18px_rgba(145,255,239,0.9)]"
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
            animation: `floaty ${particle.duration} ease-in-out ${particle.delay} infinite`,
          }}
        />
      ))}
    </div>
  )
}
