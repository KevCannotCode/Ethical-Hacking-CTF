"""Race state: teams, clock, flags, events. Verification is injected so this stays testable offline."""
import random
import threading
import time
from pathlib import Path

from . import copy, store

OK, BAD, ERROR, DONE = "ok", "bad", "error", "done"
MAX_EVENTS = 60


def new_state(last_level: int) -> dict:
    return {
        "status": "intake",
        "started_at": None,
        "ended_at": None,
        "last_level": last_level,
        "teams": [],
        "events": [],
        "next_team_id": 1,
        "next_event_id": 1,
    }


class Race:
    def __init__(self, state_file: Path, last_level: int, cooldown_sec: float = 0, colors: list[str] | None = None):
        self._file = state_file
        self._lock = threading.RLock()
        self._cooldown = cooldown_sec
        self._colors = colors or []
        self._inflight: set[str] = set()
        self._last_try: dict[str, float] = {}
        self.state = store.load(state_file) or new_state(last_level)

    # ---- read -------------------------------------------------------------
    def snapshot(self) -> dict:
        with self._lock:
            return {**self.state, "server_now": time.time(), "elapsed": self.elapsed()}

    def elapsed(self) -> float:
        started = self.state["started_at"]
        if started is None:
            return 0.0
        ended = self.state.get("ended_at")  # clock freezes when the CTF is called
        return (ended or time.time()) - started

    def team(self, team_id: str) -> dict:
        for t in self.state["teams"]:
            if t["id"] == team_id:
                return t
        raise KeyError(team_id)

    # ---- intake -----------------------------------------------------------
    def add_team(self, name: str, color: str = "") -> dict:
        name = " ".join(name.split())
        if not name:
            raise ValueError("Team name is empty")
        color = (color or "").strip()
        with self._lock:
            if self.state["status"] == "ended":
                raise ValueError("The CTF has ended — sign-ups are closed")
            if any(t["name"].lower() == name.lower() for t in self.state["teams"]):
                raise ValueError(f"Team name '{name}' is taken")
            if color and any(t["color"].lower() == color.lower() for t in self.state["teams"]):
                raise ValueError("That color is taken — pick another")
            if not color:
                color = self._auto_color()
            team = {
                "id": f"t{self.state['next_team_id']}",
                "name": name,
                "color": color,
                "level": 0,
                "solves": [],
            }
            self.state["next_team_id"] += 1
            self.state["teams"].append(team)
            self._save()
            return team

    def rename_team(self, team_id: str, name: str) -> dict:
        """Rename a team any time before the CTF ends. The phone's escape hatch when it named itself wrong."""
        name = " ".join(name.split())
        if not name:
            raise ValueError("Team name is empty")
        with self._lock:
            if self.state["status"] == "ended":
                raise ValueError("The CTF has ended — names are locked")
            team = self.team(team_id)
            if any(t["name"].lower() == name.lower() and t["id"] != team_id for t in self.state["teams"]):
                raise ValueError(f"Team name '{name}' is taken")
            team["name"] = name
            self._save()
            return team

    def set_color(self, team_id: str, color: str) -> dict:
        """Recolor a team any time before the CTF ends."""
        color = (color or "").strip()
        if not color:
            raise ValueError("Pick a color")
        with self._lock:
            if self.state["status"] == "ended":
                raise ValueError("The CTF has ended — colors are locked")
            team = self.team(team_id)
            if any(t["color"].lower() == color.lower() and t["id"] != team_id for t in self.state["teams"]):
                raise ValueError("That color is taken — pick another")
            team["color"] = color
            self._save()
            return team

    def _auto_color(self) -> str:
        used = {t["color"].lower() for t in self.state["teams"]}
        for c in self._colors:
            if c.lower() not in used:
                return c
        return "#%06x" % random.randint(0, 0xFFFFFF)  # palette exhausted — hand out a random hue

    def remove_team(self, team_id: str) -> None:
        with self._lock:
            self.state["teams"] = [t for t in self.state["teams"] if t["id"] != team_id]
            self._save()

    def start(self, last_level: int | None = None) -> None:
        with self._lock:
            if not self.state["teams"]:
                raise ValueError("Add at least one team first")
            if last_level is not None:
                if not 1 <= last_level <= 34:
                    raise ValueError("Last level must be between 1 and 34")
                self.state["last_level"] = last_level
            self.state["status"] = "running"
            self.state["started_at"] = time.time()
            self.state["ended_at"] = None
            self._save()

    def end(self) -> None:
        """Call the CTF: freeze the clock and switch the display to the end scene."""
        with self._lock:
            if self.state["status"] == "running":
                self.state["ended_at"] = time.time()
                self.state["status"] = "ended"
                self._save()

    # ---- menu -------------------------------------------------------------
    def reset_race(self) -> None:
        """Back to zero flags and a fresh clock; teams stay. A called CTF starts running again."""
        with self._lock:
            for t in self.state["teams"]:
                t["level"] = 0
                t["solves"] = []
            self.state["events"] = []
            if self.state["status"] in ("running", "ended"):
                self.state["status"] = "running"
                self.state["started_at"] = time.time()
                self.state["ended_at"] = None
            else:
                self.state["started_at"] = None
            self._save()

    def new_ctf(self) -> None:
        """Wipe everything and return to intake."""
        with self._lock:
            self.state = new_state(self.state["last_level"])
            self._last_try.clear()
            self._save()

    # ---- flags ------------------------------------------------------------
    def submit(self, team_id: str, flag: str, check) -> dict:
        """check(level, flag) -> (status, detail). Advances the team when status is OK."""
        with self._lock:
            team = self.team(team_id)
            last = self.state["last_level"]
            if self.state["status"] != "running":
                msg = "The CTF has ended" if self.state["status"] == "ended" else "The CTF has not started yet"
                return self._reply(ERROR, team, msg)
            if team["level"] >= last:
                return self._reply(DONE, team, "You already captured the final flag")
            if team_id in self._inflight:
                return self._reply(ERROR, team, "Still checking your last flag — hold on")
            wait = self._cooldown - (time.time() - self._last_try.get(team_id, 0))
            if wait > 0:
                return self._reply(ERROR, team, f"Slow down — try again in {wait:.0f}s")
            self._last_try[team_id] = time.time()
            self._inflight.add(team_id)
            target = team["level"] + 1
        try:
            status, detail = check(target, flag)
        finally:
            with self._lock:
                self._inflight.discard(team_id)
        with self._lock:
            if status == OK and team["level"] == target - 1:
                team["level"] = target
                team["solves"].append({"level": target, "t": self.elapsed()})
                msg = copy.ok(team["name"], target, final=target >= last)
            elif status == OK:
                msg = f"Already past bandit{target}"
            elif status == BAD:
                msg = detail or copy.bad(target)
            else:
                msg = f"Could not reach the bandit server: {detail}"
            self._push_event(team, status, target, msg)
            self._save()
            return self._reply(status, team, msg, target)

    # ---- internals --------------------------------------------------------
    def _reply(self, status: str, team: dict, msg: str, target: int | None = None) -> dict:
        return {
            "status": status,
            "msg": msg,
            "team": team["name"],
            "level": team["level"],
            "target": target if target is not None else team["level"] + 1,
        }

    def _push_event(self, team: dict, kind: str, level: int, msg: str) -> None:
        ev = {
            "id": self.state["next_event_id"],
            "t": self.elapsed(),
            "team_id": team["id"],
            "team": team["name"],
            "color": team["color"],
            "kind": kind,
            "level": level,
            "msg": msg,
        }
        self.state["next_event_id"] += 1
        self.state["events"] = (self.state["events"] + [ev])[-MAX_EVENTS:]

    def _save(self) -> None:
        store.save(self._file, self.state)
