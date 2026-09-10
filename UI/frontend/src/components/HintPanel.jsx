// Big-screen hint pulse. Hints live on players' phones now; this points them there and counts down the next unlock.
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { useTick } from '@/hooks/useRaceState.js'
import { hintPulse } from '@/lib/hints.js'
import { fmtClock } from '@/lib/clock.js'

export default function HintPanel({ teams, elapsedNow, lastLevel }) {
  useTick(1000, true) // the countdown ticks every second
  const { eta, showing } = hintPulse(teams, elapsedNow(), lastLevel)
  return (
    <Card className="panel scanlines glow-cyan h-full min-h-0 gap-2 border-2 py-3">
      <CardHeader><CardTitle className="neon-yellow font-pixel text-[18px]">Hints</CardTitle></CardHeader>
      <CardContent className="grid content-center gap-2">
        <p className="text-[22px] leading-snug text-foreground">Stuck? Hints appear on your phone 📱</p>
        {eta != null ? (
          <p className="text-[20px] leading-tight text-muted-foreground">Next hint in <b className="neon-yellow text-[26px]">{fmtClock(eta)}</b></p>
        ) : showing > 0 ? (
          <p className="text-[20px] leading-tight text-muted-foreground">All current hints are on players' phones.</p>
        ) : (
          <p className="text-[20px] leading-tight text-muted-foreground">Hints unlock as a level drags on.</p>
        )}
      </CardContent>
    </Card>
  )
}
