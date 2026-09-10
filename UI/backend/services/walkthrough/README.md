# walkthrough service

Instructor-only OverTheWire Bandit answer key (levels 0 → 24), shown as a tab on the gated
dashboard (`/`). Every command was run live against `bandit.labs.overthewire.org:2220`; every
password is the value that command produced, and every screenshot is that real terminal output.

- `content.json` — authored source: per-level title, skill, goal, explanation, and how-to-apply.
- `data.json` — generated, served: `content.json` merged with the live-captured commands,
  passwords and screenshot names. This is the only file the service reads at runtime.
- `shots/lNN.png` — one terminal screenshot per level.

Served behind `require_admin` (same HTTP Basic Auth as the dashboard):
`GET /api/walkthrough` and `GET /api/walkthrough/shot/<name>`.

## Regenerating

`data.json` and `shots/` are built by `tools/generate.py`. It logs in to each level over SSH with
its known password, runs that level's commands, asserts the output produced the next password, and
renders the transcript to a PNG. Edit `content.json` for wording (goal / explanation / apply); the
commands, passwords and screenshots come from the live run.

Re-run it when OverTheWire rotates the passwords or a level's live files change:

```bash
# update the KEY table at the top of tools/generate.py with the current passwords first
.venv/bin/pip install pillow      # dev-only; the app itself never renders at runtime
.venv/bin/python backend/services/walkthrough/tools/generate.py
cd frontend && npm run build      # data.json/shots are served as-is; no rebuild needed for the API,
                                  # only if you also changed frontend source
```

The full walk takes a few minutes — levels 21–23 wait for cron, 16 runs an nmap scan, 24 brute-forces
a pincode. `pillow` and `paramiko` are the only extra needs (paramiko already ships with the app).
