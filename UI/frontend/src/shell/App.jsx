// App shell: one build, two screens. `/` is the projector, `/submit` is the phone form.
// On `/` the instructor toggles between the live Race and the Walkthroughs answer key.
import { useEffect, useState } from 'react'
import { useRaceState } from '@/hooks/useRaceState.js'
import Background from '@/components/Background.jsx'
import Header from '@/components/Header.jsx'
import IntakeScreen from '@/screens/IntakeScreen.jsx'
import RaceScreen from '@/screens/RaceScreen.jsx'
import SubmitScreen from '@/screens/SubmitScreen.jsx'
import WalkthroughScreen from '@/screens/WalkthroughScreen.jsx'
import { soundList, cues } from '@/adapters/index.js'
import { audio } from '@/lib/audio.js'

export default function App() {
  const phone = window.location.pathname.startsWith('/submit')
  const { state, refresh, elapsedNow } = useRaceState(phone ? 5000 : 1000)
  // Instructor tab: 'race' | 'walkthrough'. Kept in the URL hash so it is deep-linkable and survives a reload.
  const [view, setView] = useState(() => (window.location.hash === '#walkthrough' ? 'walkthrough' : 'race'))
  const changeView = (v) => { setView(v); window.location.hash = v === 'walkthrough' ? 'walkthrough' : '' }

  useEffect(() => { if (state?.title) document.title = state.title }, [state?.title])

  useEffect(() => {
    if (phone) return undefined
    audio.load(soundList, cues)
    const resume = () => audio.resume() // browsers only start audio after a gesture
    document.addEventListener('pointerdown', resume, { once: true })
    return () => document.removeEventListener('pointerdown', resume)
  }, [phone])

  if (phone) {
    return (
      <>
        <Background />
        <SubmitScreen state={state} refresh={refresh} elapsedNow={elapsedNow} />
      </>
    )
  }
  return (
    <>
      <Background />
      <div className="flex h-full flex-col">
        <Header state={state} elapsedNow={elapsedNow} refresh={refresh} view={view} setView={changeView} />
        {view === 'walkthrough'
          ? <WalkthroughScreen />
          : state && (state.running || state.status === 'ended'
            ? <RaceScreen state={state} elapsedNow={elapsedNow} refresh={refresh} />
            : <IntakeScreen state={state} refresh={refresh} />)}
      </div>
    </>
  )
}
