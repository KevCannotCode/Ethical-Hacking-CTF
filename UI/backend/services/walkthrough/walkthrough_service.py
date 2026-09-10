"""Instructor Bandit walkthrough: serve the answer-key content and its terminal screenshots.

Content is baked at build time into data.json (authored notes + live-captured commands, passwords
and screenshots). This service just reads it and resolves screenshot files — no live SSH at runtime.
"""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA_FILE = HERE / "data.json"
SHOTS_DIR = HERE / "shots"


class Walkthrough:
    def __init__(self, data_file: Path = DATA_FILE, shots_dir: Path = SHOTS_DIR):
        self._data_file = data_file
        self.shots_dir = shots_dir

    def content(self) -> dict:
        """The full walkthrough: header + every level with commands, password and screenshot url."""
        data = json.loads(self._data_file.read_text())
        for lvl in data["levels"]:
            lvl["shot"] = f"/api/walkthrough/shot/{lvl['shot']}"
        return data

    def shot_name(self, name: str) -> str:
        """Validate a screenshot filename before it is served (no path traversal)."""
        candidate = (self.shots_dir / name).resolve()
        if candidate.parent != self.shots_dir or not candidate.is_file():
            raise KeyError(name)
        return candidate.name
