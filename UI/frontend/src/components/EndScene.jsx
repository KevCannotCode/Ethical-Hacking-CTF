// End-of-CTF takeover: Mario clears the flag, final standings roll, instructor dismisses to the frozen board.
import { Button } from '@/components/ui/button.jsx'
import { rankTeams } from '@/lib/rank.js'
import { fmtClock } from '@/lib/clock.js'

const PLACE = ['🥇', '🥈', '🥉']
const lastAt = (t) => (t.solves.length ? t.solves[t.solves.length - 1].at : null)

export default function EndScene({ teams, lastLevel, onClose }) {
  const ranked = rankTeams(teams)
  return (
    <div className="animate-in fade-in duration-500 fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-background/95 px-6 py-8">
      <img src="/gifs/end-flag.gif" alt="" className="h-[220px] w-auto [image-rendering:pixelated]" />
      <h2 className="title-gradient font-pixel text-[44px] leading-[1.3]">CTF complete</h2>
      <ol className="grid w-full max-w-[720px] gap-2.5">
        {ranked.map((t, i) => (
          <li
            key={t.id} style={{ borderColor: t.color }}
            className={`grid grid-cols-[54px_1fr_auto] items-center gap-3 border-l-[8px] bg-well/70 px-4 py-2.5 ${i === 0 ? 'glow-yellow' : ''}`}
          >
            <span className="text-[30px]">{PLACE[i] || i + 1}</span>
            <span style={{ color: t.color }} className="font-pixel text-[16px] leading-[1.4] [overflow-wrap:anywhere]">{t.name}</span>
            <span className="text-[24px] text-muted-foreground">
              {t.level >= lastLevel ? `🏁 finished ${fmtClock(lastAt(t) || 0)}` : `bandit${t.level}`}
            </span>
          </li>
        ))}
      </ol>
      <Button size="lg" variant="secondary" onClick={onClose}>Back to the board</Button>
    </div>
  )
}
