import pytest

from backend.services.race.race_service import BAD, DONE, ERROR, OK, Race


def make(tmp_path, cooldown=0):
    return Race(tmp_path / "state.json", last_level=3, cooldown_sec=cooldown)


def accept(level, flag):
    return OK, ""


def reject(level, flag):
    return BAD, ""


def test_add_team_validates(tmp_path):
    r = make(tmp_path)
    r.add_team("  Alpha   Squad ", "#ff00ff")
    assert r.state["teams"][0]["name"] == "Alpha Squad"
    with pytest.raises(ValueError):
        r.add_team("alpha squad", "#00ff00")
    with pytest.raises(ValueError):
        r.add_team("Beta", "#FF00FF")
    with pytest.raises(ValueError):
        r.add_team("   ", "#00ff00")


def test_start_needs_a_team_and_sets_level(tmp_path):
    r = make(tmp_path)
    with pytest.raises(ValueError):
        r.start()
    r.add_team("A", "#fff")
    r.start(last_level=5)
    assert r.state["status"] == "running" and r.state["last_level"] == 5
    assert r.state["started_at"] is not None


def test_submit_before_start_is_error(tmp_path):
    r = make(tmp_path)
    t = r.add_team("A", "#fff")
    assert r.submit(t["id"], "x", accept)["status"] == ERROR


def test_ok_advances_one_level_at_a_time(tmp_path):
    r = make(tmp_path)
    t = r.add_team("A", "#fff")
    r.start()
    calls = []

    def check(level, flag):
        calls.append((level, flag))
        return OK, ""

    rep = r.submit(t["id"], "flag1", check)
    assert rep["status"] == OK and rep["level"] == 1 and rep["target"] == 1
    assert calls == [(1, "flag1")]
    assert r.team(t["id"])["solves"][0]["level"] == 1
    assert r.state["events"][-1]["kind"] == OK and r.state["events"][-1]["id"] == 1


def test_bad_flag_records_event_without_advancing(tmp_path):
    r = make(tmp_path)
    t = r.add_team("A", "#fff")
    r.start()
    rep = r.submit(t["id"], "nope", reject)
    assert rep["status"] == BAD and rep["level"] == 0
    ev = r.state["events"][-1]
    assert ev["kind"] == BAD and ev["level"] == 1 and "bandit1" in ev["msg"] or ev["msg"]


def test_bad_detail_from_verifier_is_shown(tmp_path):
    r = make(tmp_path)
    t = r.add_team("A", "#fff")
    r.start()
    rep = r.submit(t["id"], "x", lambda l, f: (BAD, "wrong shape"))
    assert rep["msg"] == "wrong shape"


def test_finishing_and_done(tmp_path):
    r = make(tmp_path)
    t = r.add_team("A", "#fff")
    r.start()
    for _ in range(3):
        rep = r.submit(t["id"], "f", accept)
    assert rep["level"] == 3 and "final" in rep["msg"]
    assert r.submit(t["id"], "f", accept)["status"] == DONE


def test_cooldown_blocks_rapid_retries(tmp_path):
    r = make(tmp_path, cooldown=30)
    t = r.add_team("A", "#fff")
    r.start()
    assert r.submit(t["id"], "f", reject)["status"] == BAD
    rep = r.submit(t["id"], "f", reject)
    assert rep["status"] == ERROR and "Slow down" in rep["msg"]


def test_unknown_team_raises(tmp_path):
    r = make(tmp_path)
    r.add_team("A", "#fff")
    r.start()
    with pytest.raises(KeyError):
        r.submit("t99", "f", accept)


def test_reset_keeps_teams_new_wipes(tmp_path):
    r = make(tmp_path)
    t = r.add_team("A", "#fff")
    r.start()
    r.submit(t["id"], "f", accept)
    r.reset_race()
    assert r.team(t["id"])["level"] == 0 and r.state["events"] == [] and r.state["status"] == "running"
    r.new_ctf()
    assert r.state["teams"] == [] and r.state["status"] == "intake"


def test_state_survives_restart(tmp_path):
    r = make(tmp_path)
    r.add_team("A", "#fff")
    r.start(last_level=7)
    again = make(tmp_path)
    assert again.state["teams"][0]["name"] == "A" and again.state["last_level"] == 7
