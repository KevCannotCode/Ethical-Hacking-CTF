// Standings: most flags first, earliest last solve breaks ties. Winner = first team over the finish line.
export const lastSolveAt = (t) => (t.solves.length ? t.solves[t.solves.length - 1].at : Infinity)

export const rankTeams = (teams) =>
  [...teams].sort((a, b) => b.level - a.level || lastSolveAt(a) - lastSolveAt(b))

export const winner = (teams, lastLevel) =>
  rankTeams(teams.filter((t) => t.level >= lastLevel))[0] || null
