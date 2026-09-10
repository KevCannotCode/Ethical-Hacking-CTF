// Big verdict for the latest submission, shown for a few seconds over the race.
const tone = {
  ok: 'border-neon-green text-neon-green glow-green',
  bad: 'border-neon-red text-neon-red shadow-[0_0_22px_var(--neon-red)]',
  error: 'border-neon-yellow text-neon-yellow glow-yellow',
}

export default function Toast({ event }) {
  return (
    <div className={`fixed bottom-24 left-1/2 max-w-[80vw] -translate-x-1/2 border-[3px] bg-well/95 px-7 py-3.5 text-center text-[30px] ${tone[event.kind] || tone.error}`}>
      <b style={{ color: event.color }} className="font-pixel text-[18px]">{event.team}</b> — {event.msg}
    </div>
  )
}
