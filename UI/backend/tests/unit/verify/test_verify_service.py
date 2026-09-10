from backend.services.verify.verify_service import BAD, ERROR, OK, Verifier

GOOD = "a" * 32


class FakeLogin:
    def __init__(self, status):
        self.status, self.calls = status, []

    def __call__(self, host, port, user, password, timeout):
        self.calls.append((user, password))
        return self.status, "boom" if self.status == ERROR else ""


def make(login):
    return Verifier("host", 1, 1, r"^[A-Za-z0-9]{32}$", login=login)


def test_wrong_shape_never_hits_the_server():
    login = FakeLogin(OK)
    status, detail = make(login).check(3, "short")
    assert status == BAD and "32" in detail and login.calls == []


def test_verdicts_are_cached():
    login = FakeLogin(OK)
    v = make(login)
    assert v.check(2, GOOD)[0] == OK
    assert v.check(2, GOOD)[0] == OK
    assert login.calls == [("bandit2", GOOD)]


def test_errors_are_not_cached():
    login = FakeLogin(ERROR)
    v = make(login)
    assert v.check(2, GOOD) == (ERROR, "boom")
    v.check(2, GOOD)
    assert len(login.calls) == 2


def test_whitespace_is_stripped():
    login = FakeLogin(BAD)
    make(login).check(1, f"  {GOOD}\n")
    assert login.calls == [("bandit1", GOOD)]
