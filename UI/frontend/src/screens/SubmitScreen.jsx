// Phone flow: one team per phone. Join or create your team (any time before the CTF ends), then submit flags.
import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import ResultAlert from '@/components/ResultAlert.jsx'
import Tutorial from '@/components/Tutorial.jsx'
import PhoneHints from '@/components/PhoneHints.jsx'
import { addTeam, renameTeam, setTeamColor, submitFlag } from '@/adapters/index.js'

// Persist the team the phone belongs to (id + name) so a disconnect/reload lands back on the same team.
// The name guards against a stale id after a reset — we only re-bind when both still match.
const KEY = 'ctf-team'
const readTeam = () => {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    if (raw[0] === '{') { const o = JSON.parse(raw); return o && o.id ? o : null }
    return { id: raw, name: '' } // legacy value: a bare id
  } catch { return null }
}
const saveTeam = (id, name) => { try { localStorage.setItem(KEY, JSON.stringify({ id, name: name || '' })) } catch { /* private mode */ } }

const TUT = 'ctf-tutorial'
const tutDone = () => { try { return localStorage.getItem(TUT) === '1' } catch { return false } }
const saveTut = () => { try { localStorage.setItem(TUT, '1') } catch { /* private mode */ } }

const SWATCHES = ['#ff3ec8', '#37c4ff', '#3dff3d', '#ffe94a', '#ff7a1a', '#a55cff', '#ff4d5e', '#00ffc3', '#ffffff', '#ff9de2', '#5c8bff', '#c8ff3d']

// Swatch row: pick or recolor. `disabled` colors are taken by other teams; `current` is highlighted.
function Swatches({ current, disabled, onPick }) {
  return (
    <div className="flex flex-wrap gap-2">
      {SWATCHES.map((c) => (
        <button
          key={c} type="button" onClick={() => onPick(c)} disabled={disabled.has(c)}
          aria-pressed={c === current} aria-label={`Color ${c}`}
          style={{ '--team': c, background: c }}
          className="glow-team size-9 border-2 border-transparent transition-transform aria-pressed:scale-110 aria-pressed:border-white disabled:opacity-15 disabled:shadow-none"
        />
      ))}
    </div>
  )
}

export default function SubmitScreen({ state, refresh, elapsedNow }) {
  const [saved, setSaved] = useState(readTeam)
  const [newName, setNewName] = useState('')
  const [color, setColor] = useState(null)
  const [joinErr, setJoinErr] = useState('')
  const [flag, setFlag] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [showTut, setShowTut] = useState(() => !tutDone())
  const [renaming, setRenaming] = useState(false)
  const [editName, setEditName] = useState('')

  if (!state) return <p className="p-6 text-center text-muted-foreground">Connecting…</p>

  let team = state.teams.find((t) => t.id === saved?.id) || null
  if (team && saved?.name && team.name !== saved.name) team = null // stale id after a reset — don't hijack another team
  const intake = state.status === 'intake'
  const used = new Set(state.teams.map((t) => t.color.toLowerCase()))
  // Colors free for a new team, or for recoloring my own (my current color isn't "taken" against me).
  const takenForNew = used
  const takenForMine = team ? new Set([...used].filter((c) => c !== team.color.toLowerCase())) : used
  const picked = color && !used.has(color) ? color : SWATCHES.find((c) => !used.has(c)) || null

  function pick(id, name) {
    const nm = name ?? state.teams.find((t) => t.id === id)?.name ?? ''
    setSaved({ id, name: nm }); saveTeam(id, nm); setJoinErr('')
  }
  function startRename() { setEditName(team.name); setRenaming(true); setJoinErr('') }
  function closeTut() { setShowTut(false); saveTut() }

  async function saveRename(e) {
    e.preventDefault()
    if (!team || !editName.trim()) return
    setJoinErr('')
    try {
      const u = await renameTeam(team.id, editName.trim())
      pick(u.id, u.name) // keep the stored name in sync so the phone stays bound after the rename
      setRenaming(false)
      await refresh()
    } catch (x) { setJoinErr(x.message) }
  }

  async function create(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setJoinErr('')
    try {
      const t = await addTeam(newName.trim(), picked)
      pick(t.id, t.name)
      setNewName('')
      setColor(null)
      await refresh()
    } catch (x) { setJoinErr(x.message) }
  }

  async function recolor(c) {
    if (!team) return
    setJoinErr('')
    try {
      await setTeamColor(team.id, c)
      await refresh()
    } catch (x) { setJoinErr(x.message) }
  }

  async function send(e) {
    e.preventDefault()
    if (!team || !flag.trim()) return
    setBusy(true)
    try {
      const r = await submitFlag(team.id, flag.trim())
      setResult(r)
      if (r.status === 'ok') setFlag('')
    } catch (x) {
      setResult({ status: 'error', msg: x.message })
    } finally {
      setBusy(false)
      refresh()
    }
  }

  return (
    <div className="mx-auto grid max-w-[560px] gap-4 p-4 [&>*]:min-w-0">
      {showTut && <Tutorial onClose={closeTut} />}
      <div className="flex items-center justify-center gap-2">
        <h1 className="title-gradient py-1.5 text-center font-pixel text-[clamp(14px,4vw,20px)] leading-[1.5] [overflow-wrap:anywhere]">{state.title}</h1>
        <button type="button" onClick={() => setShowTut(true)} aria-label="How to play" className="shrink-0 border-2 border-neon-cyan px-2 py-1 font-pixel text-[12px] text-neon-cyan">?</button>
      </div>

      <Card className="panel scanlines glow-cyan gap-4 border-2 py-5">
        <CardContent className="grid gap-4">
          {state.status === 'ended' ? (
            <p className="py-5 text-center text-neon-yellow">The CTF has ended. Nice work! 🏁</p>
          ) : team ? (
            // ---- committed to a team: this phone is locked to it ----
            <>
              <h2 className="neon-green font-pixel text-[18px]">Your team</h2>
              {renaming ? (
                <form onSubmit={saveRename} className="grid grid-cols-[1fr_auto] gap-2.5">
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={24} autoComplete="off" aria-label="Rename team" autoFocus />
                  <Button type="submit" variant="secondary">Save</Button>
                </form>
              ) : (
                <div className="glow-team flex items-center justify-between gap-3 border-2 bg-secondary px-3 py-3 font-pixel text-[14px] leading-[1.4]"
                  style={{ '--team': team.color, color: team.color, borderColor: team.color }}>
                  <span className="[overflow-wrap:anywhere]">{team.name}</span>
                  {intake && <button type="button" onClick={startRename} className="shrink-0 text-[11px] text-muted-foreground underline">rename</button>}
                </div>
              )}

              {intake && (
                <div className="grid gap-2">
                  <p className="text-muted-foreground">Pick your team color:</p>
                  <Swatches current={team.color.toLowerCase()} disabled={takenForMine} onPick={recolor} />
                </div>
              )}
              {joinErr && <p className="text-neon-red">{joinErr}</p>}

              {!state.running ? (
                <p className="text-muted-foreground"><b className="text-neon-yellow">{team.name}</b> — you're in. Waiting for the instructor to start the CTF…</p>
              ) : (
                <>
                  <p className="text-muted-foreground">
                    {team.level >= state.lastLevel ? <><b className="text-neon-yellow">{team.name}</b> captured the final flag 🏁</>
                      : <><b className="text-neon-yellow">{team.name}</b> is on bandit{team.level}. Next flag: the password for <b className="text-neon-yellow">bandit{team.level + 1}</b>.</>}
                  </p>
                  <h2 className="neon-green font-pixel text-[18px]">Flag</h2>
                  <form onSubmit={send} className="grid gap-3">
                    <Input
                      value={flag} onChange={(e) => setFlag(e.target.value)} placeholder="paste the 32-character password"
                      autoCapitalize="off" autoCorrect="off" spellCheck={false} maxLength={64} aria-label="Flag"
                      className="font-mono text-[20px] tracking-wide"
                    />
                    <Button size="lg" type="submit" disabled={busy}>{busy ? 'Checking…' : 'Submit flag'}</Button>
                  </form>
                  {result && <ResultAlert result={result} lastLevel={state.lastLevel} />}
                  <PhoneHints team={team} elapsedNow={elapsedNow} lastLevel={state.lastLevel} />
                </>
              )}
            </>
          ) : (
            // ---- no team yet: join an existing team or create your own (open until the CTF ends) ----
            <>
              <h2 className="neon-green font-pixel text-[18px]">Your team</h2>
              {state.teams.length > 0 && (
                <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-2.5">
                  {state.teams.map((t) => (
                    <button
                      key={t.id} type="button" onClick={() => pick(t.id)}
                      style={{ '--team': t.color, color: t.color, borderColor: t.color }}
                      className="border-2 bg-well px-3 py-3 font-pixel text-[14px] leading-[1.5] opacity-70 [overflow-wrap:anywhere] hover:opacity-100"
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              )}
              <form onSubmit={create} className="grid gap-2.5">
                <div className="grid grid-cols-[1fr_auto] gap-2.5">
                  <Input
                    value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New team name"
                    maxLength={24} autoComplete="off" aria-label="New team name"
                  />
                  <Button type="submit" variant="secondary">Create</Button>
                </div>
                <Swatches current={picked} disabled={takenForNew} onPick={setColor} />
              </form>
              {joinErr && <p className="text-neon-red">{joinErr}</p>}
              <p className="text-muted-foreground">
                {state.running ? 'Tap a team to join it, or create your own — you can jump in now.'
                  : 'Tap a team to join it, or create your own — then wait for the instructor to start.'}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
