// Instructor menu: sound toggles, kick teams, reset race, new CTF.
import { useReducer, useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Switch } from '@/components/ui/switch.jsx'
import { resetRace, newCtf, endCtf, removeTeam } from '@/adapters/index.js'
import { audio } from '@/lib/audio.js'

export default function MenuDialog({ refresh, running, teams = [] }) {
  const [open, setOpen] = useState(false)
  const [, force] = useReducer((n) => n + 1, 0)

  async function kick(t) {
    if (!confirm(`Kick ${t.name}? They drop off the board and their progress is lost.`)) return
    await removeTeam(t.id)
    refresh()
  }
  async function end() {
    if (!confirm('End the CTF now? The clock stops and the winners scene plays.')) return
    await endCtf()
    setOpen(false)
    refresh()
  }
  async function reset() {
    if (!confirm('Reset every team to zero flags and restart the clock? Teams stay.')) return
    await resetRace()
    setOpen(false)
    refresh()
  }
  async function fresh() {
    if (!confirm('Clear every team and go back to the intake screen?')) return
    await newCtf()
    setOpen(false)
    refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="secondary">Menu</Button></DialogTrigger>
      <DialogContent className="panel glow-cyan gap-6 border-2 sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="neon-green font-pixel text-2xl">Menu</DialogTitle>
          <DialogDescription className="sr-only">Sound and race controls</DialogDescription>
        </DialogHeader>
        <div className="grid gap-5">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="sfx" className="text-[26px]">Sound effects</Label>
            <Switch id="sfx" className="scale-150 mr-3" checked={audio.sfx} onCheckedChange={() => { audio.toggleSfx(); force() }} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="music" className="text-[26px]">Background music</Label>
            <Switch id="music" className="scale-150 mr-3" checked={audio.music} onCheckedChange={() => { audio.toggleMusic(); force() }} />
          </div>

          {teams.length > 0 && (
            <div className="grid gap-2">
              <p className="text-[22px] text-muted-foreground">Teams — kick anyone who shouldn't be here</p>
              <ul className="grid max-h-56 gap-2 overflow-auto">
                {teams.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 border-2 bg-well/60 px-3 py-2" style={{ borderColor: t.color }}>
                    <span style={{ color: t.color }} className="font-pixel text-[13px] leading-[1.35] [overflow-wrap:anywhere]">{t.name}</span>
                    <Button variant="outline" onClick={() => kick(t)} className="shrink-0 border-2 border-neon-red text-neon-red hover:text-neon-red">Kick</Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {running && (
            <Button variant="outline" className="justify-start whitespace-normal text-left border-2 border-neon-yellow text-neon-yellow hover:text-neon-yellow" onClick={end}>
              End the CTF: stop the clock, play the winners scene
            </Button>
          )}
          <Button variant="outline" className="justify-start whitespace-normal text-left border-2 border-neon-red text-neon-red hover:text-neon-red" onClick={reset}>
            Reset race: flags and clock to zero, teams stay
          </Button>
          <Button variant="outline" className="justify-start whitespace-normal text-left border-2 border-neon-red text-neon-red hover:text-neon-red" onClick={fresh}>
            New CTF: clear everything
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
