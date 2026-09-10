// Brief celebration when a team captures the final flag: pixel fighter + "PERFECT". Parent controls how long it shows.
export default function FinishBurst({ team }) {
  if (!team) return null
  return (
    <div className="animate-in fade-in zoom-in-95 duration-300 pointer-events-none fixed inset-0 z-30 flex items-center justify-center">
      <div className="panel glow-yellow flex flex-col items-center gap-4 border-[3px] border-neon-yellow bg-well/95 px-12 py-8">
        <img
          src="/gifs/win-fighter.gif" alt="" width={210}
          className="h-[280px] w-auto [image-rendering:pixelated]"
          style={{ filter: `drop-shadow(0 0 14px ${team.color})` }}
        />
        <div className="neon-yellow font-pixel text-[40px] leading-none">PERFECT!</div>
        <div style={{ color: team.color }} className="font-pixel text-[22px] leading-[1.4]">
          {team.name} captured the final flag
        </div>
      </div>
    </div>
  )
}
