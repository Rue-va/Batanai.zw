export function RadialGauge({
  value,
  size = 96,
  label,
  sublabel,
}: {
  value: number
  size?: number
  label?: string
  sublabel?: string
}) {
  const deg = (value / 100) * 360
  return (
    <div
      className="relative flex items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(var(--primary) ${deg}deg, var(--border-soft) ${deg}deg)`,
      }}
    >
      <div className="flex flex-col items-center justify-center rounded-full bg-forest-900" style={{ width: size - 16, height: size - 16 }}>
        <span className="text-xl font-bold leading-none">{label ?? value}</span>
        {sublabel && <span className="mt-0.5 text-[10px] text-muted-foreground">{sublabel}</span>}
      </div>
    </div>
  )
}
