"""Decides whether a flag unlocks bandit<level>. Caches verdicts so repeats never touch OverTheWire."""
import re
import threading

from . import ssh

OK, BAD, ERROR = ssh.OK, ssh.BAD, ssh.ERROR


class Verifier:
    def __init__(self, host: str, port: int, timeout: float, flag_pattern: str, login=ssh.try_login):
        self._host, self._port, self._timeout = host, port, timeout
        self._pattern = re.compile(flag_pattern)
        self._login = login
        self._known: dict[tuple[int, str], str] = {}
        self._lock = threading.Lock()

    def check(self, level: int, flag: str) -> tuple[str, str]:
        flag = flag.strip()
        if not self._pattern.match(flag):
            return BAD, "That is not a bandit password — expect 32 letters and digits"
        key = (level, flag)
        with self._lock:
            if key in self._known:
                return self._known[key], ""
        status, detail = self._login(self._host, self._port, f"bandit{level}", flag, self._timeout)
        if status in (OK, BAD):
            with self._lock:
                self._known[key] = status
        return status, detail
