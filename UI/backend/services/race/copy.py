"""Every sentence the tracker says to students lives here."""
import random

BAD = [
    "Nope. That is not the password for bandit{n}.",
    "Wrong flag. Did you cat the right file?",
    "Denied. bandit{n} laughs at you.",
    "Not it. Hidden things hide — try ls -la.",
    "Access denied. Copy the whole 32 characters.",
    "Close, but bandit{n} says no.",
    "That flag opens nothing. Read the level page again.",
]
OK = [
    "{team} cracked bandit{n}!",
    "{team} is in. bandit{n} unlocked.",
    "Flag accepted — {team} reaches bandit{n}.",
    "{team} leveled up to bandit{n}.",
]
WINNER = "{team} captured the final flag!"


def bad(n: int) -> str:
    return random.choice(BAD).format(n=n)


def ok(team: str, n: int, final: bool) -> str:
    if final:
        return WINNER.format(team=team)
    return random.choice(OK).format(team=team, n=n)
