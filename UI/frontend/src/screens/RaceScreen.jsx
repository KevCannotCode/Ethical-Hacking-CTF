// The live race: chart, standings, hints, QR, ticker. Sounds and a toast for every verdict; celebrations at the finish.
import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import RaceChart from '@/components/RaceChart.jsx'
import Scoreboard from '@/components/Scoreboard.jsx'
import HintPanel from '@/components/HintPanel.jsx'
import JoinCard from '@/components/JoinCard.jsx'
import Ticker from '@/components/Ticker.jsx'
import Toast from '@/components/Toast.jsx'
import FinishBurst from '@/components/FinishBurst.jsx'
import EndScene from '@/components/EndScene.jsx'
import { audio } from '@/lib/audio.js'
import { winner } from '@/lib/rank.js'

export default function RaceScreen({ state, elapsedNow, refresh }) {
  const [toast, setToast] = useState(null)
  const [burst, setBurst] = useState(null)   // team currently getting the finish-line celebration
  const [showEnd, setShowEnd] = useState(false)
  const lastEvent = useRef(null)             // null until the first poll, so a reload never replays old sounds
  const endArmed = useRef(null)

  const finished = state.status === 'ended' ||
    (state.teams.length > 0 && state.teams.every((t) => t.level >= state.lastLevel))

  useEffect(() => {
    const maxId = state.events.reduce((m, e) => Math.max(m, e.id), 0)
    if (lastEvent.current === null || maxId < lastEvent.current) { lastEvent.current = maxId; return }
    const fresh = state.events.filter((e) => e.id > lastEvent.current)
    lastEvent.current = maxId
    for (const e of fresh) {
      // A team's own finish gets the fighter cheer — unless it was the last one, where the end scene takes over.
      if (e.kind === 'ok' && e.level >= state.lastLevel && !finished) { audio.playFinish(); setBurst({ name: e.team, color: e.color }) }
      else if (e.kind === 'ok' && e.level < state.lastLevel) audio.playOk()
      else if (e.kind === 'bad') audio.playFail()
    }
    if (fresh.length) setToast(fresh[fresh.length - 1])
  }, [state.events, state.lastLevel, finished])

  useEffect(() => {
    if (!toast) return undefined
    const id = setTimeout(() => setToast(null), 6000)
    return () => clearTimeout(id)
  }, [toast])

  useEffect(() => {
    if (!burst) return undefined
    const id = setTimeout(() => setBurst(null), 7000)
    return () => clearTimeout(id)
  }, [burst])

  // Play the end fanfare only on the transition into "finished", never on a reload that lands already finished.
  useEffect(() => {
    if (endArmed.current === null) { endArmed.current = finished; if (finished) setShowEnd(true); return }
    if (finished && !endArmed.current) { audio.playEnd(); setShowEnd(true) }
    endArmed.current = finished
  }, [finished])

  const champion = winner(state.teams, state.lastLevel)

  return (
    <main className="grid min-h-0 flex-1 grid-cols-[1fr_400px] grid-rows-[1fr_auto] gap-4 px-7 pt-2 pb-6">
      <Card className="panel scanlines glow-cyan grid min-h-0 min-w-0 grid-rows-[auto_1fr] gap-2 border-2 py-4">
        <CardHeader><CardTitle className="neon-green font-pixel text-2xl">Race</CardTitle></CardHeader>
        <CardContent className="min-h-0 min-w-0">
          <RaceChart teams={state.teams} elapsedNow={elapsedNow} lastLevel={state.lastLevel} />
        </CardContent>
      </Card>
      <aside className="row-span-2 grid min-h-0 min-w-0 grid-rows-[1fr_auto_auto] gap-4">
        <Scoreboard teams={state.teams} lastLevel={state.lastLevel} />
        <div className="max-h-[30vh] min-h-0">
          <HintPanel teams={state.teams} elapsedNow={elapsedNow} lastLevel={state.lastLevel} />
        </div>
        <JoinCard url={state.publicUrl} />
      </aside>
      <div className="min-w-0 self-end">
        <Ticker events={state.events} />
      </div>

      {champion && !showEnd && (
        <div className="glow-yellow fixed top-28 left-1/2 z-10 -translate-x-1/2 border-[3px] border-neon-yellow bg-well/95 px-9 py-4 font-pixel text-[26px] leading-[1.4] text-neon-yellow">
          🏁 {champion.name} captured the final flag!
        </div>
      )}
      {toast && !showEnd && <Toast event={toast} />}
      <FinishBurst team={showEnd ? null : burst} />
      {showEnd && <EndScene teams={state.teams} lastLevel={state.lastLevel} onClose={() => setShowEnd(false)} />}
    </main>
  )
}
