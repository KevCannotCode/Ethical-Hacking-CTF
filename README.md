# Bandit CTF Tracker

Live scoreboard for a one-hour OverTheWire **Bandit** race. Students submit the password
they found from their phone; the server verifies it by SSHing into the next Bandit level,
then advances the team on a projector scoreboard. The instructor dashboard also has a
**Walkthroughs** tab: the Bandit 0–24 answer key with commands, live screenshots and
captured passwords.

- `UI/` — the app: Flask backend + Vite/React frontend
- `sfx/` — race sound effects

## Run

```bash
cd UI
cp .env.example .env          # set CTF_ADMIN_USER + CTF_ADMIN_PASSWORD (gates the dashboard)
./run.sh                      # first run builds the venv + frontend, then serves http://localhost:8000
```

- `/` — instructor dashboard + walkthroughs (HTTP Basic Auth from `.env`)
- `/submit` — student phone form (open; reached via the on-screen QR code)

Rebuild the frontend after editing `UI/frontend/src`: `./run.sh --build`.

## System requirements

Measured on the live server (`ctf.themocs.org`, Linode, 2026-09-29).

| Part | What it is | Needs |
|---|---|---|
| Frontend (`UI/frontend`) | Vite build, served by Flask | Node only to build |
| Backend | Flask under gunicorn, 1 worker, 8 threads | ~75 MB RAM idle |
| Answer check | One SSH login to `bandit.labs.overthewire.org` per submission | Outbound port 2220 open |

- **Minimum:** 1 vCPU, 512 MB RAM free, 1 GB disk.
- Load is one class at a time; a 1-hour race does not stress a 2 GB Linode.
