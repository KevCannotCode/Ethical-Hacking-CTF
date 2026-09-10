// Per-phone hints for the joined team: tips unlocked so far on its level, plus a live countdown to the next one.
import { useTick } from '@/hooks/useRaceState.js'
import { teamHints } from '@/lib/hints.js'
import { fmtClock } from '@/lib/clock.js'

export default function PhoneHints({ team, elapsedNow, lastLevel }) {
  useTick(1000, true) // the countdown ticks every second
  const h = teamHints(team, elapsedNow(), lastLevel)
  if (h.done) return null

  return (
    <div className="grid gap-2 border-2 border-neon-yellow/60 bg-well px-3 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="neon-yellow font-pixel text-[16px]">Hints</h2>
        <span className="text-[18px] text-muted-foreground">
          {h.nextInSec != null ? <>next in <b className="text-neon-yellow">{fmtClock(h.nextInSec)}</b></>
            : h.tips.length ? 'all hints shown' : ''}
        </span>
      </div>
      {h.tips.length ? (
        <ol className="grid gap-1.5 text-[19px] leading-snug text-foreground">
          {h.tips.map((t, i) => (
            <li key={i} className="grid grid-cols-[auto_1fr] gap-2">
              <span className="text-neon-green">{i + 1}.</span><span>{t}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-[18px] leading-snug text-muted-foreground">
          No hint yet — keep digging. First one unlocks in {fmtClock(h.nextInSec ?? 0)}.
        </p>
      )}
    </div>
  )
}
