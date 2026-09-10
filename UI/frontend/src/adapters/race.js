// Race endpoints: state, teams, start/reset/new. Wire shape (snake_case) is mapped here and nowhere else.
import { del, get, post } from './_shared.js'

export const mapTeam = (t) => ({
  id: t.id,
  name: t.name,
  color: t.color,
  level: t.level,
  solves: t.solves.map((s) => ({ level: s.level, at: s.t })),
})

export const mapEvent = (e) => ({
  id: e.id, at: e.t, teamId: e.team_id, team: e.team, color: e.color, kind: e.kind, level: e.level, msg: e.msg,
})

export const mapState = (s) => ({
  status: s.status,
  running: s.status === 'running',
  elapsed: s.elapsed,
  lastLevel: s.last_level,
  title: s.title,
  publicUrl: s.public_url,
  teams: s.teams.map(mapTeam),
  events: s.events.map(mapEvent),
})

export const fetchState = () => get('/api/state').then(mapState)
export const addTeam = (name, color) => post('/api/teams', { name, color }).then(mapTeam)
export const renameTeam = (id, name) => post(`/api/teams/${id}/name`, { name }).then(mapTeam)
export const setTeamColor = (id, color) => post(`/api/teams/${id}/color`, { color }).then(mapTeam)
export const removeTeam = (id) => del(`/api/teams/${id}`)
export const startRace = (lastLevel) => post('/api/start', { last_level: lastLevel })
export const resetRace = () => post('/api/reset')
export const newCtf = () => post('/api/new')
export const endCtf = () => post('/api/end')
