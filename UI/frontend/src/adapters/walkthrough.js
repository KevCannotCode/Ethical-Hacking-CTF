// Walkthrough endpoint: the instructor Bandit answer key. Wire shape is mapped here and nowhere else.
import { get } from './_shared.js'

export const mapLevel = (l) => ({
  id: l.id,
  from: l.from,
  to: l.to,
  title: l.title,
  skill: l.skill,
  goal: l.goal,
  explanation: l.explanation,
  apply: l.apply,
  commands: l.commands,
  password: l.password,
  shot: l.shot,
})

export const mapWalkthrough = (w) => ({
  title: w.title,
  subtitle: w.subtitle,
  intro: w.intro,
  connect: w.connect,
  notes: w.notes,
  wargamesScope: w.wargames_scope,
  capturedDate: w.captured_date,
  levels: w.levels.map(mapLevel),
})

export const getWalkthrough = () => get('/api/walkthrough').then(mapWalkthrough)
