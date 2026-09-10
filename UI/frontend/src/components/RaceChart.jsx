// The race chart. Geometry comes from lib/chart.js; this only paints it.
import { useEffect, useRef, useState } from 'react'
import { layoutRace } from '@/lib/chart.js'
import { useTick } from '@/hooks/useRaceState.js'

function Marker({ kind, cx, cy, color, big }) {
  const r = big ? 9 : 6
  const common = { fill: color, stroke: '#04061b', strokeWidth: 2, style: big ? { filter: `drop-shadow(0 0 6px ${color})` } : undefined }
  if (kind === 'square') return <rect x={cx - r} y={cy - r} width={2 * r} height={2 * r} {...common} />
  if (kind === 'diamond') return <polygon points={`${cx},${cy - r - 2} ${cx + r + 2},${cy} ${cx},${cy + r + 2} ${cx - r - 2},${cy}`} {...common} />
  if (kind === 'triangle') return <polygon points={`${cx},${cy - r - 2} ${cx + r + 1},${cy + r} ${cx - r - 1},${cy + r}`} {...common} />
  return <circle cx={cx} cy={cy} r={r} {...common} />
}

export default function RaceChart({ teams, elapsedNow, lastLevel }) {
  const ref = useRef(null)
  const [size, setSize] = useState({ w: 1200, h: 600 })
  useTick(1000, true)

  useEffect(() => {
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect
      if (width && height) setSize({ w: width, h: height })
    })
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])

  const L = layoutRace({ teams, elapsed: elapsedNow(), lastLevel, width: size.w, height: size.h })
  return (
    <svg ref={ref} className="block h-full w-full" viewBox={`0 0 ${size.w} ${size.h}`}>
      {L.grid.map((g, i) => <line key={i} {...g} className="stroke-grid/45" />)}
      {L.yLabels.map((t) => <text key={'y' + t.text} x={t.x} y={t.y} textAnchor="end" className="fill-muted-foreground font-term text-[22px]">{t.text}</text>)}
      {L.xLabels.map((t) => <text key={'x' + t.text} x={t.x} y={t.y} textAnchor="middle" className="fill-muted-foreground font-term text-[22px]">{t.text}</text>)}
      <line {...L.finish} className="stroke-neon-yellow stroke-[3] [stroke-dasharray:12_8]" />
      <text x={L.finishLabel.x} y={L.finishLabel.y} className="fill-neon-yellow font-pixel text-[14px]">FINISH · bandit{lastLevel}</text>
      <text x={L.flag.x} y={L.flag.y} className="text-[44px]">🏁</text>
      <line {...L.now} className="stroke-white/25 [stroke-dasharray:3_5]" />
      {L.lines.map((l) => (
        <path key={l.id} d={l.d} stroke={l.color} strokeDasharray={l.dash} fill="none" strokeWidth={4} strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 5px ${l.color})` }} />
      ))}
      {L.markers.map((m, i) => <Marker key={i} {...m} />)}
      {L.labels.map((l) => (
        <g key={l.id}>
          {l.connector && <line {...l.connector} stroke={l.color} strokeOpacity={0.7} />}
          <text x={l.x} y={l.y} fill={l.color} className="font-pixel text-[13px]">{l.text}</text>
        </g>
      ))}
    </svg>
  )
}
