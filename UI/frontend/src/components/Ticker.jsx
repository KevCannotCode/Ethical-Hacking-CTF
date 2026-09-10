// Latest submissions, newest first, one line.
import { Card, CardContent } from '@/components/ui/card.jsx'

const tone = { ok: 'text-neon-green', bad: 'text-neon-red', error: 'text-neon-yellow' }

export default function Ticker({ events }) {
  const latest = [...events].reverse().slice(0, 6)
  return (
    <Card className="panel scanlines glow-cyan self-end border-2 py-2.5">
      <CardContent className="px-5">
        <ul className="flex gap-7 overflow-hidden whitespace-nowrap text-2xl">
          {latest.length ? latest.map((e) => (
            <li key={e.id} className={tone[e.kind] || 'text-muted-foreground'}>
              <b style={{ color: e.color }} className="font-pixel text-[13px]">{e.team}</b> {e.msg}
            </li>
          )) : <li className="text-muted-foreground">Waiting for the first flag…</li>}
        </ul>
      </CardContent>
    </Card>
  )
}
