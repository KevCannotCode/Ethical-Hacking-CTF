// Intake: name the teams, pick colors, choose the last level, start the clock.
import { useState } from 'react'
import { Badge } from '@/components/ui/badge.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import JoinCard from '@/components/JoinCard.jsx'
import { addTeam, removeTeam, startRace } from '@/adapters/index.js'
import { audio } from '@/lib/audio.js'

const SWATCHES = ['#ff3ec8', '#37c4ff', '#3dff3d', '#ffe94a', '#ff7a1a', '#a55cff', '#ff4d5e', '#00ffc3', '#ffffff', '#ff9de2', '#5c8bff', '#c8ff3d']

export default function IntakeScreen({ state, refresh }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(null)
  const [lastLevel, setLastLevel] = useState(state.lastLevel)
  const [err, setErr] = useState('')

  const used = new Set(state.teams.map((t) => t.color.toLowerCase()))
  const picked = color && !used.has(color) ? color : SWATCHES.find((c) => !used.has(c)) || null

  async function add(e) {
    e.preventDefault()
    setErr('')
    try {
      await addTeam(name, picked)
      setName('')
      setColor(null)
      await refresh()
    } catch (x) { setErr(x.message) }
  }
  async function start() {
    setErr('')
    try {
      audio.resume()
      await startRace(Number(lastLevel))
      await refresh()
    } catch (x) { setErr(x.message) }
  }

  return (
    <main className="flex justify-center px-7 pt-2 pb-6">
      <div className="grid w-full max-w-[1180px] grid-cols-[1fr_360px] items-start gap-4">
      <Card className="panel scanlines glow-cyan gap-4 border-2 py-5">
        <CardHeader><CardTitle className="neon-green font-pixel text-2xl">Teams</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={add} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Team name" maxLength={24} required aria-label="Team name" autoComplete="off" />
            <Button type="submit" variant="secondary">Add team</Button>
            <div className="col-span-full flex flex-wrap gap-2.5">
              {SWATCHES.map((c) => (
                <button
                  key={c} type="button" onClick={() => setColor(c)} disabled={used.has(c)}
                  aria-pressed={c === picked} aria-label={`Color ${c}`}
                  style={{ '--team': c, background: c }}
                  className="glow-team size-11 border-[3px] border-transparent transition-transform aria-pressed:scale-110 aria-pressed:border-white disabled:opacity-15 disabled:shadow-none"
                />
              ))}
            </div>
          </form>

          <ul className="flex min-h-12 flex-wrap gap-2.5">
            {state.teams.length ? state.teams.map((t) => (
              <li key={t.id}>
                <Badge variant="outline" style={{ '--team': t.color, color: t.color, borderColor: t.color }} className="glow-team gap-2 rounded-none border-2 px-3 py-1.5 font-pixel text-[14px] leading-[1.4]">
                  {t.name}
                  <button type="button" onClick={() => removeTeam(t.id).then(refresh)} aria-label={`Remove ${t.name}`} className="text-xl leading-none">✕</button>
                </Badge>
              </li>
            )) : <li className="text-muted-foreground">No teams yet. Add the first one above.</li>}
          </ul>

          {err && <p className="text-neon-red">{err}</p>}

          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
            <Label htmlFor="last-level" className="gap-3 whitespace-nowrap text-[26px]">
              Last level
              <Input id="last-level" type="number" min={1} max={34} value={lastLevel} onChange={(e) => setLastLevel(e.target.value)} className="w-28 text-center" />
            </Label>
            <span className="text-[22px] leading-tight text-muted-foreground">Flags to capture: the passwords for bandit1 … bandit{lastLevel}</span>
            <Button size="lg" onClick={start} disabled={!state.teams.length}>Start the CTF</Button>
          </div>
        </CardContent>
      </Card>
      <JoinCard url={state.publicUrl} />
      </div>
    </main>
  )
}
