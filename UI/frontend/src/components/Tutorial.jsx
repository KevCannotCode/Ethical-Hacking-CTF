// First-run how-to-play for the phone. Dismissed state lives in localStorage; a "?" reopens it.
import { Button } from '@/components/ui/button.jsx'

const STEPS = [
  ['🚩', 'Race to the top', 'Each level hides the password for the next one. First team to reach the last level wins.'],
  ['🔑', 'Find the password', "Log into the Bandit server and follow the level's clue to the password it hides."],
  ['📲', 'Submit it here', 'Paste the password and hit Submit. A correct one bumps your team up the board.'],
  ['💡', 'Stuck is fine', 'Wrong guesses cost nothing. Keep trying, and watch the board — hints appear when a level drags.'],
]

export default function Tutorial({ onClose }) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-background/95 p-4">
      <div className="panel scanlines glow-cyan grid max-h-full max-w-[560px] gap-5 overflow-auto border-2 p-7">
        <h1 className="neon-green text-center font-pixel text-[20px] leading-[1.5]">How to play</h1>
        <ol className="grid gap-5">
          {STEPS.map(([icon, title, body], i) => (
            <li key={i} className="grid grid-cols-[auto_1fr] items-start gap-4">
              <span className="text-3xl leading-none">{icon}</span>
              <div className="grid gap-1">
                <p className="text-[26px] font-bold leading-tight text-neon-yellow">{title}</p>
                <p className="text-[22px] leading-snug text-foreground/85">{body}</p>
              </div>
            </li>
          ))}
        </ol>
        <Button size="lg" onClick={onClose}>Let's go 🚀</Button>
      </div>
    </div>
  )
}
