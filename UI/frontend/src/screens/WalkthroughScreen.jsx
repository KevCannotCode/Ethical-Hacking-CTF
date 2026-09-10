// Instructor walkthrough: the Bandit answer key as a browsable reference. Pick a level on the left,
// read the goal, the commands, the live screenshot, the captured password and where it applies.
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent } from '@/components/ui/card.jsx'
import { getWalkthrough } from '@/adapters/index.js'

function copy(txt) { try { navigator.clipboard?.writeText(txt) } catch { /* not available */ } }

// One command line in the terminal-style box, with a copy button.
function CommandLine({ text }) {
  return (
    <li className="group flex items-start justify-between gap-3 border-2 border-neon-cyan/30 bg-well px-3 py-2">
      <code className="font-mono text-[17px] leading-snug text-foreground [overflow-wrap:anywhere]">
        <span className="mr-2 text-neon-green">$</span>{text}
      </code>
      <button type="button" onClick={() => copy(text)} aria-label="Copy command"
        className="shrink-0 text-[13px] text-muted-foreground underline opacity-60 hover:opacity-100">copy</button>
    </li>
  )
}

function Section({ label, children }) {
  return (
    <div className="grid gap-2">
      <h3 className="neon-green font-pixel text-[14px] leading-[1.6]">{label}</h3>
      {children}
    </div>
  )
}

function Detail({ level }) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-pixel text-[16px] text-neon-yellow">{level.from} → {level.to}</span>
          <Badge variant="outline" className="rounded-none border-2 border-neon-purple px-2.5 py-1 text-[15px] text-neon-purple">{level.skill}</Badge>
        </div>
        <h2 className="title-gradient font-pixel text-[22px] leading-[1.4]">{level.title}</h2>
      </div>

      <Section label="Goal"><p className="text-[20px] leading-snug text-foreground/90">{level.goal}</p></Section>
      <Section label="What we did"><p className="text-[20px] leading-snug text-foreground/90">{level.explanation}</p></Section>

      <Section label="Commands">
        <ul className="grid gap-2">{level.commands.map((c, i) => <CommandLine key={i} text={c} />)}</ul>
        <button type="button" onClick={() => copy(level.commands.join('\n'))}
          className="justify-self-start text-[15px] text-muted-foreground underline opacity-70 hover:opacity-100">copy all</button>
      </Section>

      <Section label="Terminal">
        <img src={level.shot} alt={`Terminal for ${level.from} to ${level.to}`}
          className="w-full border-2 border-neon-cyan/40" loading="lazy" />
      </Section>

      <Section label="Password (bandit answer)">
        <div className="glow-cyan flex items-center justify-between gap-3 border-2 border-neon-yellow bg-well px-4 py-3">
          <code className="font-mono text-[20px] tracking-wide text-neon-yellow [overflow-wrap:anywhere]">{level.password}</code>
          <button type="button" onClick={() => copy(level.password)} aria-label="Copy password"
            className="shrink-0 text-[14px] text-muted-foreground underline opacity-70 hover:opacity-100">copy</button>
        </div>
      </Section>

      <Section label="Where this applies"><p className="text-[20px] leading-snug text-foreground/90">{level.apply}</p></Section>
    </div>
  )
}

export default function WalkthroughScreen() {
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const [sel, setSel] = useState(0)

  useEffect(() => { getWalkthrough().then(setData).catch((x) => setErr(x.message)) }, [])

  if (err) return <main className="p-8 text-center text-neon-red">Could not load the walkthrough: {err}</main>
  if (!data) return <main className="p-8 text-center text-muted-foreground">Loading the answer key…</main>

  const level = data.levels[sel]
  return (
    <main className="flex min-h-0 flex-1 justify-center px-7 pt-2 pb-6">
      <div className="grid min-h-0 w-full max-w-[1280px] grid-cols-[300px_1fr] items-start gap-4">
        {/* left rail: intro + level list */}
        <Card className="panel glow-cyan sticky top-2 max-h-[calc(100vh-120px)] gap-3 overflow-auto border-2 py-4">
          <CardContent className="grid gap-3">
            <div className="grid gap-1.5">
              <p className="text-[17px] leading-snug text-muted-foreground">{data.subtitle}</p>
              <code className="border-2 border-neon-cyan/30 bg-well px-2 py-1.5 font-mono text-[14px] leading-snug text-foreground [overflow-wrap:anywhere]">{data.connect}</code>
              <p className="text-[14px] leading-snug text-muted-foreground">Captured live {data.capturedDate}. Instructor copy — do not distribute.</p>
            </div>
            <ul className="grid gap-1.5">
              {data.levels.map((l, i) => (
                <li key={l.id}>
                  <button type="button" onClick={() => setSel(i)} aria-current={i === sel}
                    className="grid w-full grid-cols-[auto_1fr] items-baseline gap-2 border-2 border-transparent bg-well/50 px-2.5 py-2 text-left hover:border-neon-cyan/40 aria-[current=true]:border-neon-green aria-[current=true]:bg-secondary">
                    <span className="font-mono text-[15px] text-neon-cyan">{String(l.id).padStart(2, '0')}</span>
                    <span className="text-[17px] leading-tight text-foreground [overflow-wrap:anywhere]">{l.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* right: the selected level */}
        <Card className="panel scanlines glow-cyan gap-4 border-2 px-6 py-6">
          <CardContent className="grid gap-4 p-0">
            <Detail level={level} />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
