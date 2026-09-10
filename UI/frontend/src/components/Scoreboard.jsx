// Standings card: rank, team, current bandit level.
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { rankTeams } from '@/lib/rank.js'

export default function Scoreboard({ teams, lastLevel }) {
  return (
    <Card className="panel scanlines glow-cyan min-h-0 gap-3 border-2 py-4">
      <CardHeader><CardTitle className="neon-green font-pixel text-2xl">Scoreboard</CardTitle></CardHeader>
      <CardContent className="min-h-0 overflow-auto">
        <ol className="grid gap-2">
          {rankTeams(teams).map((t, i) => (
            <li key={t.id} style={{ borderColor: t.color }} className="grid grid-cols-[34px_1fr_auto] items-center gap-2.5 border-l-[6px] bg-well/60 px-2.5 py-1.5">
              <span className="text-muted-foreground">{i + 1}</span>
              <span style={{ color: t.color }} className="font-pixel text-[13px] leading-[1.35] [overflow-wrap:anywhere]">{t.name}</span>
              <span className="text-[26px]">{t.level >= lastLevel ? '🏁 ' : ''}bandit{t.level}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}
