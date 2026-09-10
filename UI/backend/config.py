"""Runtime constants for the CTF tracker. Paths resolve from this file so the app runs from any cwd."""
import os
from pathlib import Path

UI_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = UI_DIR / "frontend"
DIST_DIR = FRONTEND_DIR / "dist"  # vite build output; run.sh builds it
SFX_DIR = UI_DIR.parent / "sfx"
SFX_FOLDERS = {"fail": "fail", "success": "Success", "music": "background music"}
# Named one-shot sounds in the Success folder, kept out of the random success pool.
SUCCESS_CUES = {
    "finish": "street-fighter-ii-you-win-perfect.mp3",  # a team reaches the final flag
    "end": "mario-win-stage.mp3",                         # the whole CTF is over
}
STATE_FILE = UI_DIR / "backend" / "results" / "state.json"  # results/ is git-ignored

# Colors auto-assigned to teams that sign themselves up from a phone (matches the intake swatches).
TEAM_COLORS = [
    "#ff3ec8", "#37c4ff", "#3dff3d", "#ffe94a", "#ff7a1a", "#a55cff",
    "#ff4d5e", "#00ffc3", "#ffffff", "#ff9de2", "#5c8bff", "#c8ff3d",
]

PORT = int(os.environ.get("CTF_PORT", "8000"))
PUBLIC_URL = os.environ.get("CTF_PUBLIC_URL")  # http://LAN-IP:PORT — auto-detected when unset

# Admin dashboard is credential-locked so students can't reach the display by dropping /submit.
# Password unset -> app generates one at startup and prints it. Students never see any of this.
ADMIN_USER = os.environ.get("CTF_ADMIN_USER", "admin")
ADMIN_PASSWORD = os.environ.get("CTF_ADMIN_PASSWORD")  # None -> generated per run

COURSE_TITLE = "Ethical Hacking COSC 6840 CTF"
DEFAULT_LAST_LEVEL = 24

BANDIT_HOST = "bandit.labs.overthewire.org"
BANDIT_PORT = 2220
SSH_TIMEOUT = 12
FLAG_PATTERN = r"^[A-Za-z0-9]{32}$"  # every bandit password is 32 alphanumerics
RETRY_COOLDOWN_SEC = 3  # per-team gap between attempts; keeps OverTheWire happy
