// Title bar: level range, gradient title, how-to-play, live clock and menu while the race runs.
import { useState } from 'react'
import { useTick } from '@/hooks/useRaceState.js'
import { fmtClock } from '@/lib/clock.js'
import MenuDialog from '@/components/MenuDialog.jsx'
import Tutorial from '@/components/Tutorial.jsx'

// Tab button for the instructor's Race / Walkthroughs switch.
function Tab({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick} aria-current={active}
      className="glow-team border-2 px-4 py-2 font-pixel text-[15px] aria-[current=true]:bg-secondary aria-[current=false]:opacity-60"
      style={{ '--team': active ? 'var(--neon-green)' : 'var(--neon-cyan)',
               borderColor: active ? 'var(--neon-green)' : 'var(--neon-cyan)',
               color: active ? 'var(--neon-green)' : 'var(--neon-cyan)' }}>
      {children}
    </button>
  )
}

export default function Header({ state, elapsedNow, refresh, view, setView }) {
  const running = !!state?.running
  const live = running || state?.status === 'ended' // ended keeps the frozen clock and menu on screen
  const race = view === 'race'
  const [showTut, setShowTut] = useState(false)
  useTick(250, running)
  return (
    <header className="grid min-h-24 grid-cols-[1fr_auto_1fr] items-center gap-4 px-7 pt-4 pb-2">
      <nav className="flex items-center gap-3">
        <Tab active={race} onClick={() => setView('race')}>Race</Tab>
        <Tab active={!race} onClick={() => setView('walkthrough')}>Walkthroughs</Tab>
      </nav>
      <h1 className="title-gradient text-center font-pixel text-[32px] leading-[1.35]">
        {state?.title ?? 'Ethical Hacking COSC 6840 CTF'}
      </h1>
      <div className="flex items-center justify-end gap-5">
        {race && (
          <>
            <button type="button" onClick={() => setShowTut(true)}
              className="glow-team border-2 border-neon-cyan px-4 py-2 font-pixel text-[15px] text-neon-cyan"
              style={{ '--team': 'var(--neon-cyan)' }}>
              How to play
            </button>
            {live && (
              <>
                <div className="neon-yellow text-[58px] leading-none tracking-wider">{fmtClock(elapsedNow())}</div>
                <MenuDialog refresh={refresh} running={running} teams={state?.teams ?? []} />
              </>
            )}
          </>
        )}
      </div>
      {showTut && <Tutorial onClose={() => setShowTut(false)} />}
    </header>
  )
}
