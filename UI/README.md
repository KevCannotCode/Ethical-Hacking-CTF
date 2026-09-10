# Bandit CTF tracker

Live scoreboard for the one-hour OverTheWire Bandit race. Teams submit the password they found;
the server proves it by logging in to the next bandit level over SSH, then moves the team's line.

```
 phone  /submit ── POST /api/submit {team, flag} ──▶ backend/app.py
                                                        │
                                                        ▼
                                          race.submit(team, flag, verifier.check)
                                                        │  target = team.level + 1
                                                        ▼
                                  ssh bandit<target>@bandit.labs.overthewire.org -p 2220
                                                        │ login ok  → level +1, "ok" event
                                                        │ auth fail → "bad" event
                                                        ▼
 projector  /  ◀── GET /api/state, 1 s poll ──── backend/results/state.json
               chart · scoreboard · QR · sounds
```

## Run

```bash
./run.sh                      # http://localhost:8000  (first run: builds venv + frontend)
./run.sh --build              # rebuild the frontend after editing frontend/src
./run.sh --port 9000
./run.sh --public-url http://192.168.1.20:8000   # what the QR code should say, if auto-detect is wrong
```

Under WSL2 the Windows host owns the LAN address, so phones cannot reach the server until the port is
forwarded. Once per boot, in an **admin** PowerShell:

```powershell
.\expose-lan.ps1            # default port 8000
```

Classroom Wi-Fi often blocks device-to-device traffic. If phones cannot load the QR link, put the
laptop on a phone hotspot and have students join it.

## Access

Two separate views:

- `/` — the **instructor dashboard/display**. Credential-locked (HTTP Basic Auth) so students can't
  reach it by dropping `/submit` from the QR link. Put the login in `CTF/UI/.env` (git-ignored; copy
  `.env.example`): `CTF_ADMIN_USER` and `CTF_ADMIN_PASSWORD`. `run.sh` loads it automatically and the
  app never prints the credentials. No password set → the app refuses to start. Control endpoints
  (start, reset, new, end, remove team) are gated too. Log in once and the browser reuses the
  credentials for the whole session. The **Menu** lists every team with a **Kick** button, so the
  instructor can remove anyone from the lobby or mid-race.
- `/submit` — the **student phone form**. Open, reached from the QR. Reading state and self-registering
  (join, create, rename, recolor, submit) need no login.

## Walkthroughs (instructor answer key)

The dashboard has two tabs: **Race** and **Walkthroughs**. The Walkthroughs tab is the OverTheWire
Bandit answer key (levels 0 → 24) — the one wargame the schedule requires (Lab 1). Pick a level and
see its goal, a short explanation, the simple command sequence, the **live terminal screenshot**, the
captured password, and a paragraph on where the technique applies. It is built as the model reference
for the report students write about the lab.

Everything is instructor-only: served behind the same Basic Auth as the dashboard (`GET
/api/walkthrough`, `GET /api/walkthrough/shot/<name>`), so the passwords never ship in the shared JS
bundle. The tab is deep-linkable at `/#walkthrough`. Content lives in the `walkthrough` service —
`content.json` is the authored source (goal/explanation/apply), `data.json` is the served build
(authored notes merged with the live-captured commands, passwords and screenshots), and `shots/`
holds one PNG per level. See `backend/services/walkthrough/README.md` to regenerate after a rotation.

## Screens

- `/` intake: team name + color, last level, **Start the CTF**. Then the race: chart, scoreboard,
  hints, QR, ticker, menu (sound effects, music, **End the CTF**, reset race, new CTF). A
  **Walkthroughs** tab shows the instructor Bandit answer key (see above).
- `/submit` phone form: a first-run **how-to-play** tutorial (reopen with `?`), then join a team or
  **create one** and pick its color. One team per phone — once committed, the phone locks to it and
  only submits flags. Sign-ups stay open until the CTF ends, so a **late team can join mid-race**.
  The phone remembers its team (id + name in `localStorage`), so a disconnect/reload lands back on the
  same team with its live progress intact. Result shows the verdict and the next `ssh` command.
  Kahoot-style self-register from the QR.

## Hints

Hints are **per team, on the phone**. Each level has a time budget (`src/data/hints.js`); hint 1 appears
at the budget, hint 2 at twice it, and levels 15+ earn a third (two max below 15). The phone shows the
tips this team has unlocked on its current level plus a live "next hint in m:ss" countdown (`PhoneHints`).
The big screen doesn't list them — it just says *Hints appear on your phone* and counts down the soonest
unlock across the room (`HintPanel`, fed by `hintPulse`). Nudges, never the whole answer. Pure logic in
`src/lib/hints.js` (`teamHints`, `hintPulse`).

## Celebrations

- A team reaching the final flag: pixel-fighter burst + `../sfx/Success/street-fighter-ii-you-win-perfect.mp3`.
- The whole CTF ending (all teams done, or **End the CTF** in the menu): Mario clears the flagpole,
  final standings roll, `../sfx/Success/mario-win-stage.mp3`. Clock freezes on the ended state.
- GIFs are vendored offline in `frontend/public/gifs/` (from giphy.com).

## Sounds

- `../sfx/fail/` plays at random on a wrong flag, `../sfx/Success/` on a good one. The two celebration
  cues above live in `Success/` too but are kept out of the random pool (`config.SUCCESS_CUES`).
- `../sfx/background music/` background tracks, crossfaded 3 s track-to-track so the loop never cuts.
  Music ducks to 20 % while a sound effect plays. Empty folder → built-in 8-bit loop.

## Layout

```
backend/                      Flask
  app.py                      routes only; serves frontend/dist
  config.py                   bandit host, port, title, paths
  services/race/              teams, clock, flags, events, persistence (race_service.py, store.py, copy.py)
  services/verify/            flag check with cache (verify_service.py) over one ssh attempt (ssh.py)
  services/netinfo/           LAN url + QR svg
  services/walkthrough/       instructor Bandit answer key: content.json + data.json + shots/ (gated)
  tests/unit/                 pytest, no network
  results/state.json          live state, survives restarts, git-ignored
frontend/                     Vite + React (plain JSX) + Tailwind v4 + shadcn/ui
  src/shell/App.jsx           picks the screen from the path, owns polling + the Race/Walkthroughs tab
  src/screens/                IntakeScreen, RaceScreen, SubmitScreen, WalkthroughScreen
  src/components/             RaceChart, Scoreboard, HintPanel, JoinCard, Ticker, Toast, FinishBurst,
                              EndScene, MenuDialog, Header, Background
  src/components/ui/          shadcn components (button, input, card, dialog, badge, label, switch, alert)
  src/adapters/               the only place that calls fetch; wire ↔ app shape mappers
  src/lib/                    pure logic: chart geometry, ranking, hints, clock, audio engine
  src/data/hints.js           per-level Bandit hints + time budgets
  src/hooks/useRaceState.js   polling + smooth local clock
  public/gifs/                celebration GIFs (win-fighter, end-flag), vendored offline
  src/styles/tokens.css       design system, locked (neon palette on shadcn variables, pixel + terminal fonts)
  src/styles/app.css          Tailwind entry + neon utilities
  src/tests/logic/            vitest, pure logic
  dist/                       build output, git-ignored
```

shadcn components come from the registry (`npx shadcn@latest add <name>` inside `frontend/`); the
shadcn MCP server is registered in the repo's `.mcp.json` for Claude Code.

Tests: `.venv/bin/pytest -q backend/tests` and `cd frontend && npm test`.
