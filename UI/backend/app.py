"""HTTP entry point. Routes only — race rules live in services/race, flag checks in services/verify."""
import argparse
import hmac
import os
from functools import wraps

from flask import Flask, Response, abort, jsonify, request, send_from_directory

from . import config
from .services.netinfo import netinfo
from .services.race.race_service import Race
from .services.verify.verify_service import Verifier
from .services.walkthrough.walkthrough_service import Walkthrough

app = Flask(__name__, static_folder=None)
race = Race(config.STATE_FILE, config.DEFAULT_LAST_LEVEL, config.RETRY_COOLDOWN_SEC, config.TEAM_COLORS)
verifier = Verifier(config.BANDIT_HOST, config.BANDIT_PORT, config.SSH_TIMEOUT, config.FLAG_PATTERN)
walkthrough = Walkthrough()
# Resolved at import so a WSGI server (gunicorn) serves a usable QR; main() overrides it from CLI flags.
app.config["PUBLIC_URL"] = netinfo.public_url(config.PORT, config.PUBLIC_URL)

# Admin credentials: resolved in main() (env/CLI, or generated). Empty password fails closed.
ADMIN_USER = config.ADMIN_USER
ADMIN_PASSWORD = config.ADMIN_PASSWORD or ""


def require_admin(view):
    """Gate a route behind HTTP Basic Auth so only the instructor reaches the dashboard and controls."""
    @wraps(view)
    def wrapped(*args, **kwargs):
        auth = request.authorization
        ok = (ADMIN_PASSWORD and auth and auth.type == "basic"
              and hmac.compare_digest(auth.username or "", ADMIN_USER)
              and hmac.compare_digest(auth.password or "", ADMIN_PASSWORD))
        if not ok:
            return Response("Admin access only.", 401, {"WWW-Authenticate": 'Basic realm="CTF admin"'})
        return view(*args, **kwargs)
    return wrapped


# ---- pages & assets (vite build in frontend/dist; the app picks the screen from the path) ----
@app.get("/")
@require_admin
def admin_page():
    # The full dashboard/display — instructor only.
    return send_from_directory(config.DIST_DIR, "index.html")


@app.get("/submit")
def submit_page():
    # The student phone form — open, reached from the QR.
    return send_from_directory(config.DIST_DIR, "index.html")


@app.get("/assets/<path:path>")
def assets(path):
    return send_from_directory(config.DIST_DIR / "assets", path)


@app.get("/fonts/<path:path>")
def fonts(path):
    return send_from_directory(config.DIST_DIR / "fonts", path)


@app.get("/gifs/<path:path>")
def gifs(path):
    return send_from_directory(config.DIST_DIR / "gifs", path)


@app.get("/sfx/<kind>")
def sfx_list(kind):
    folder = config.SFX_DIR / config.SFX_FOLDERS.get(kind, "")
    if kind not in config.SFX_FOLDERS or not folder.is_dir():
        return jsonify([])
    names = sorted(f for f in os.listdir(folder) if f.lower().endswith((".mp3", ".ogg", ".wav", ".m4a")))
    if kind == "success":  # the celebration cues have their own triggers, keep them out of the random pool
        names = [n for n in names if n not in config.SUCCESS_CUES.values()]
    return jsonify([f"/sfx/{kind}/{n}" for n in names])


@app.get("/sfx/<kind>/<path:name>")
def sfx_file(kind, name):
    if kind not in config.SFX_FOLDERS:
        abort(404)
    return send_from_directory(config.SFX_DIR / config.SFX_FOLDERS[kind], name)


@app.get("/api/cues")
def cues():
    """Named one-shot sounds the display plays on the finish and end scenes."""
    return jsonify({k: f"/sfx/success/{v}" for k, v in config.SUCCESS_CUES.items()})


@app.get("/api/walkthrough")
@require_admin
def walkthrough_content():
    """Instructor answer key: every Bandit level with its commands, password and screenshot."""
    return jsonify(walkthrough.content())


@app.get("/api/walkthrough/shot/<path:name>")
@require_admin
def walkthrough_shot(name):
    try:
        return send_from_directory(walkthrough.shots_dir, walkthrough.shot_name(name))
    except KeyError:
        abort(404)


# ---- api --------------------------------------------------------------------
@app.get("/api/state")
def state():
    snap = race.snapshot()
    snap["title"] = config.COURSE_TITLE
    snap["public_url"] = app.config["PUBLIC_URL"]
    return jsonify(snap)


@app.get("/api/qr.svg")
def qr():
    return netinfo.qr_svg(app.config["PUBLIC_URL"]), 200, {"Content-Type": "image/svg+xml"}


@app.post("/api/teams")
def add_team():
    body = request.get_json(force=True) or {}
    try:
        return jsonify(race.add_team(str(body.get("name", "")), str(body.get("color", ""))))
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400


@app.post("/api/teams/<team_id>/name")
def rename_team(team_id):
    body = request.get_json(force=True) or {}
    try:
        return jsonify(race.rename_team(team_id, str(body.get("name", ""))))
    except KeyError:
        return jsonify({"error": "Unknown team — pick your team again"}), 404
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400


@app.post("/api/teams/<team_id>/color")
def set_color(team_id):
    body = request.get_json(force=True) or {}
    try:
        return jsonify(race.set_color(team_id, str(body.get("color", ""))))
    except KeyError:
        return jsonify({"error": "Unknown team — pick your team again"}), 404
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400


@app.delete("/api/teams/<team_id>")
@require_admin
def remove_team(team_id):
    race.remove_team(team_id)
    return jsonify({"ok": True})


@app.post("/api/start")
@require_admin
def start():
    body = request.get_json(force=True) or {}
    try:
        race.start(int(body["last_level"]) if body.get("last_level") else None)
    except (ValueError, TypeError) as exc:
        return jsonify({"error": str(exc)}), 400
    return jsonify({"ok": True})


@app.post("/api/reset")
@require_admin
def reset():
    race.reset_race()
    return jsonify({"ok": True})


@app.post("/api/new")
@require_admin
def new_ctf():
    race.new_ctf()
    return jsonify({"ok": True})


@app.post("/api/end")
@require_admin
def end_ctf():
    race.end()
    return jsonify({"ok": True})


@app.post("/api/submit")
def submit():
    body = request.get_json(force=True) or {}
    try:
        return jsonify(race.submit(str(body.get("team_id", "")), str(body.get("flag", "")), verifier.check))
    except KeyError:
        return jsonify({"error": "Unknown team — pick your team again"}), 404


# ---- main -------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser(description="Bandit CTF tracker")
    ap.add_argument("--port", type=int, default=config.PORT)
    ap.add_argument("--public-url", default=config.PUBLIC_URL, help="http://LAN-IP:PORT students can reach")
    ap.add_argument("--admin-user", default=config.ADMIN_USER, help="dashboard login user")
    ap.add_argument("--admin-password", default=config.ADMIN_PASSWORD, help="dashboard login password (generated if unset)")
    args = ap.parse_args()
    app.config["PUBLIC_URL"] = netinfo.public_url(args.port, args.public_url)

    global ADMIN_USER, ADMIN_PASSWORD
    ADMIN_USER = args.admin_user
    ADMIN_PASSWORD = args.admin_password or ""
    if not ADMIN_PASSWORD:
        raise SystemExit("No admin password set. Put CTF_ADMIN_USER / CTF_ADMIN_PASSWORD in CTF/UI/.env (see .env.example).")

    if not (config.DIST_DIR / "index.html").exists():
        raise SystemExit("frontend/dist is missing: run ./run.sh (it builds the frontend) or `cd frontend && npm run build`")
    print(f"\n  Dashboard: http://localhost:{args.port}/   (instructor only, login from .env)")
    print(f"  Students : {app.config['PUBLIC_URL']}")
    if netinfo.is_wsl():
        print("  WSL      : run expose-lan.ps1 in an admin PowerShell once per boot, or phones cannot reach this.")
    print()
    app.run(host="0.0.0.0", port=args.port, threaded=True)


if __name__ == "__main__":
    main()
