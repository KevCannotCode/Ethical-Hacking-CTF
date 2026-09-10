// Flag submission. Verdict shape: { status: ok|bad|error|done, msg, team, level, target }.
import { post } from './_shared.js'

export const submitFlag = (teamId, flag) =>
  post('/api/submit', { team_id: teamId, flag }).then((r) => ({
    status: r.status, msg: r.msg, team: r.team, level: r.level, target: r.target,
  }))
