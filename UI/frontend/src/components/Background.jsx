// Starfield + perspective grid behind every screen. Deterministic, drawn once.
import { useMemo } from 'react'

const W = 1920, H = 1080

function build() {
  let seed = 7
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  const stars = Array.from({ length: 240 }, () => ({
    cx: (rnd() * W) | 0, cy: (rnd() * H) | 0, r: +(rnd() * 1.6 + 0.4).toFixed(1), o: +(rnd() * 0.6 + 0.2).toFixed(2),
    tw: +(rnd() * 3.5 + 2.5).toFixed(1), // twinkle period, seconds
    d: +(rnd() * 5).toFixed(1),          // twinkle start delay
  }))
  const fan = Array.from({ length: 29 }, (_, k) => W / 2 + (k - 14) * 210)
  const rows = []
  for (let k = 0, y = 120; y < H; k++, y += 34 + k * 11) rows.push(y)
  return { stars, fan, rows }
}

export default function Background() {
  const { stars, fan, rows } = useMemo(build, [])
  return (
    <svg aria-hidden="true" className="fixed inset-0 -z-10 h-full w-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="haze" cx="50%" cy="0%" r="60%">
          <stop offset="0" stopColor="#5a2bd8" stopOpacity=".45" />
          <stop offset="1" stopColor="#04061b" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#haze)" />
      <g className="bg-stars">
        {stars.map((s, i) => (
          <circle
            key={i} cx={s.cx} cy={s.cy} r={s.r} fill="#fff" className="bg-star"
            style={{ '--peak': s.o, animationDuration: `${s.tw}s`, animationDelay: `${s.d}s` }}
          />
        ))}
      </g>
      {fan.map((x2, i) => <line key={'f' + i} x1={W / 2} y1={-160} x2={x2} y2={H} stroke="#1b4fd0" strokeOpacity=".3" />)}
      {rows.map((y, i) => <line key={'r' + i} x1={0} y1={y} x2={W} y2={y} stroke="#1b4fd0" strokeOpacity=".24" />)}
    </svg>
  )
}
