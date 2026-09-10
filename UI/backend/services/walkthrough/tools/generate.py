#!/usr/bin/env python3
"""Regenerate the Bandit walkthrough: walk every level live, verify the next password, and render
one terminal screenshot per level. Reads authored notes from ../content.json and writes ../data.json
and ../shots/lNN.png.

Run with an interpreter that has BOTH paramiko and pillow, e.g.:
    pip install pillow          # into the project venv, dev-only (not a runtime dependency)
    .venv/bin/python backend/services/walkthrough/tools/generate.py

OverTheWire rotates passwords: update KEY below with the current values (each KEY[n] logs in as
banditN) before running. The script logs in to each level directly with its known password, runs
that level's commands, and asserts the output produced the next password.
"""
import datetime
import json
import os
import re
import textwrap
import time
from pathlib import Path

import paramiko
from PIL import Image, ImageDraw, ImageFont

HOST, PORT = "bandit.labs.overthewire.org", 2220
SVC = Path(__file__).resolve().parent.parent
SHOTS = SVC / "shots"

KEY = {
    0: "bandit0", 1: "6y2kwnwK6grgvwvpvLaa2T1cpFEKOhNR", 2: "PK8fYLZg2hnHSz83plBL1iEPKdD3QToB",
    3: "7ZZ2LFrykP2zEyvBl4m3clcL7tGYJPME", 4: "xzTXq1rDJQVVAzdv5cHq1TQytTWufAMq", 5: "6C7h9GD8M6ai5nr7wo1RonrzFjj9yIrG",
    6: "pXa26xhMWaC2SvDotA4r9EgZkulOeSBW", 7: "Bmnnvf82KzQlfxgAI2d1zYbr1u9pr3E3", 8: "VR1ljMayciFxbnUokuQmJFw6QC9VKtub",
    9: "EjmOSvuAu7sGAHqHVcBDPirRe9T03kxl", 10: "B0s2khmbT9u0geKuOoVGW3JZKhndE3BG", 11: "pYfOY6HwUsDj5rL9UvyhU7MCmv8vN5Ro",
    12: "GROozWPO8QyN0mGrjUkID0WCYkZiQxrN", 13: "qQYQiHOBPR8zR61qxYqX45quvihF2uzk", 14: "aaWecNkG4FhxJQxz07uiwzVP6bJiYS65",
    15: "pbLYuZtTg4MgaqfJx8jbA9gKKGqM68A7", 16: "kS0Hf0u5HiXFwKMKFqXvPdOTNGGa0X8V", 17: "pWXMAZoxGC8JmDMfmT5MGEsobMM3vnj2",
    18: "OQxXZjELndr90zuhOTDYBEomI0SZITXI", 19: "KpsOfPkcP7i1FlIExk2QEjyt6dw8dxZI", 20: "4pIjcunZ0fK2vmp3IwfG8Vf7VhxD6pOA",
    21: "bW9kBv5WC3P4yoDyf12LSdGuNz5ka6hY", 22: "RYVux2rHEm9tiXHmLFzuR7Vhx6AZQMEz", 23: "gKXDTAXnIz3OBxiPjRZ2uqutUlPZrBsw",
    24: "hVQMk3lJNsmQ7VF3ubyrNNBom7BOgVXv", 25: "SoHfqMOEqIX2IYKVciZxvgpR9a2Djx4P",
}
PW32 = re.compile(r"[A-Za-z0-9+/]{32}\b")


def connect(n):
    c = paramiko.SSHClient(); c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, port=PORT, username=f"bandit{n}", password=KEY[n], timeout=25,
              allow_agent=False, look_for_keys=False, banner_timeout=30, auth_timeout=30)
    return c


def find_pw(text, exclude=()):
    for m in PW32.findall(text):
        if m not in exclude and not m.startswith("bandit"):
            return m
    return None


class Sess:
    """One login as banditN. run() records a display command and its real output."""
    def __init__(self, n):
        self.c = connect(n); self.steps = []
    def raw(self, cmd, t=90):
        _, o, e = self.c.exec_command(cmd, timeout=t)
        return o.read().decode("utf-8", "replace") + e.read().decode("utf-8", "replace")
    def run(self, display, real=None, t=90, clip=4000):
        out = self.raw(real if real is not None else display, t=t)
        if len(out) > clip:
            out = out[:clip] + "\n... (output trimmed) ...\n"
        self.steps.append({"cmd": display, "out": out.rstrip("\n")})
        return out
    def note(self, cmd, out=""):
        self.steps.append({"cmd": cmd, "out": out})
    def close(self):
        try: self.c.close()
        except Exception: pass


# ---- per-level recipes: append display steps, return the captured next password ----
def L0(s): s.run("ls"); return find_pw(s.run("cat readme"))
def L1(s): s.run("ls"); return find_pw(s.run("cat ./-"))
def L2(s):
    name = s.run("ls").strip().splitlines()[0]
    return find_pw(s.run(f'cat "./{name}"'))
def L3(s):
    ls = s.run("ls -a inhere")
    hidden = next((w for w in ls.split() if w.startswith(".") and w not in (".", "..")), None)
    return find_pw(s.run(f'cat "inhere/{hidden}"'))
def L4(s):
    fo = s.raw("cd inhere && file ./*"); s.note("cd inhere"); s.steps.append({"cmd": "file ./*", "out": fo.rstrip()})
    txt = next((ln.split(":")[0] for ln in fo.splitlines() if "ASCII text" in ln), None)
    return find_pw(s.run(f"cat {txt}", real=f"cd inhere && cat {txt}"))
def L5(s):
    path = s.run("find inhere -type f -size 1033c ! -executable").strip().splitlines()[0].strip()
    return find_pw(s.run(f"cat {path}"))
def L6(s):
    path = s.run("find / -user bandit7 -group bandit6 -size 33c 2>/dev/null").strip().splitlines()[0].strip()
    return find_pw(s.run(f"cat {path}"))
def L7(s): return find_pw(s.run("grep millionth data.txt"))
def L8(s): return find_pw(s.run("sort data.txt | uniq -u"))
def L9(s): return find_pw(s.run("strings data.txt | grep ==="))
def L10(s): return find_pw(s.run("base64 -d data.txt"))
def L11(s): return find_pw(s.run("cat data.txt | tr 'A-Za-z' 'N-ZA-Mn-za-m'"))
def L12(s):
    wd = "/tmp/wt12"
    s.run("mkdir -p /tmp/wt12", real="rm -rf /tmp/wt12; mkdir -p /tmp/wt12")
    s.note("cd /tmp/wt12"); s.run("cp ~/data.txt .", real=f"cp ~/data.txt {wd}/")
    s.run("xxd -r data.txt > data", real=f"cd {wd} && xxd -r data.txt > data")
    cur, seq = "data", []
    for _ in range(12):
        ft = s.raw(f"cd {wd} && file {cur}"); seq.append(ft.strip()); low = ft.lower()
        if "ascii text" in low:
            break
        if "gzip" in low:
            s.raw(f"cd {wd} && mv {cur} {cur}.gz && gzip -d -f {cur}.gz")
        elif "bzip2" in low:
            s.raw(f"cd {wd} && mv {cur} {cur}.bz2 && bzip2 -d -f {cur}.bz2")
        elif "tar archive" in low:
            before = set(s.raw(f"cd {wd} && ls").split())
            s.raw(f"cd {wd} && mv {cur} {cur}.tar && tar xf {cur}.tar")
            new = [x for x in set(s.raw(f"cd {wd} && ls").split()) - before if x != cur + ".tar"]
            cur = sorted(new, key=len)[-1] if new else cur
        else:
            break
    s.steps.append({"cmd": "file data   # then: rename to .gz/.bz2/.tar, decompress, repeat", "out": "\n".join(seq[:10])})
    return find_pw(s.run(f"cat {cur}", real=f"cd {wd} && cat {cur}"))
def L13(s):
    # Nested ssh to localhost is blocked on the server, so read bandit14's password directly to
    # capture the real output; the displayed commands are the intended key-auth method.
    s.run("ls"); s.note("chmod 600 sshkey.private")
    s.note("ssh -i sshkey.private -p 2220 bandit14@localhost", "(key-based login — no password prompt)")
    t = Sess(14); pw = t.raw("cat /etc/bandit_pass/bandit14").strip(); t.close()
    s.steps.append({"cmd": "cat /etc/bandit_pass/bandit14", "out": pw})
    return find_pw(pw) or pw
def L14(s):
    return find_pw(s.run("cat /etc/bandit_pass/bandit14 | nc localhost 30000",
                         real="cat /etc/bandit_pass/bandit14 | nc -q 2 localhost 30000", t=30), exclude=(KEY[14],))
def L15(s):
    return find_pw(s.run("cat /etc/bandit_pass/bandit15 | openssl s_client -connect localhost:30001 -quiet",
                         real="cat /etc/bandit_pass/bandit15 | timeout 12 openssl s_client -connect localhost:30001 -quiet -ign_eof 2>/dev/null",
                         t=25), exclude=(KEY[15],))
def L16(s):
    nm = s.run("nmap -p31000-32000 localhost", t=120)
    keytext, good = None, None
    for p in re.findall(r"(\d{5})/tcp\s+open", nm):
        r = s.raw(f"cat /etc/bandit_pass/bandit16 | timeout 15 openssl s_client -connect localhost:{p} -quiet -ign_eof 2>/dev/null", t=25)
        if "PRIVATE KEY" in r:
            keytext, good = r, p
            if "END" in r:
                break
    m = re.search(r"(-----BEGIN[^-]*PRIVATE KEY-----.*?-----END[^-]*PRIVATE KEY-----)", keytext or "", re.S)
    key_block = m.group(1) if m else (keytext or "").strip()
    s.steps.append({"cmd": f"cat /etc/bandit_pass/bandit16 | openssl s_client -connect localhost:{good} -quiet", "out": "Correct!\n" + key_block})
    s.note("cat key.private   # save the key above, then chmod 600", "(saved the private key to a file)")
    s.note("ssh -i key.private -p 2220 bandit17@localhost", "(key-based login as bandit17)")
    t = Sess(17); pw = t.raw("cat /etc/bandit_pass/bandit17").strip(); t.close()
    s.steps.append({"cmd": "cat /etc/bandit_pass/bandit17", "out": pw})
    return find_pw(pw) or pw
def L17(s):
    o = s.run("diff passwords.old passwords.new")
    m = re.findall(r"^>\s*([A-Za-z0-9+/]{32})", o, re.M)
    return m[0] if m else find_pw(o, exclude=(KEY[17],))
def L18(s):
    return find_pw(s.run("ssh -p 2220 bandit18@localhost cat readme", real="cat readme"))
def L19(s):
    s.run("./bandit20-do"); return find_pw(s.run("./bandit20-do cat /etc/bandit_pass/bandit20"))
def L20(s):
    port = 4471
    s.note(f"nc -l -p {port} < /etc/bandit_pass/bandit20 &", "[1] listener started")
    real = (f"cd ~ && (nc -l -p {port} < /etc/bandit_pass/bandit20 > /tmp/o20 2>/dev/null &) ; "
            f"sleep 1 ; ./suconnect {port} >/dev/null 2>&1 ; sleep 1 ; cat /tmp/o20")
    return find_pw(s.run(f"./suconnect {port}", real=real, t=30), exclude=(KEY[20],))
def L21(s):
    cj = s.run("cat /etc/cron.d/cronjob_bandit22")
    sh = re.search(r"(/\S+\.sh)", cj).group(1); body = s.run(f"cat {sh}")
    tmp = re.search(r"(/tmp/\S+)", body).group(1)
    return find_pw(s.run(f"cat {tmp}"))
def L22(s):
    cj = s.run("cat /etc/cron.d/cronjob_bandit23")
    sh = re.search(r"(/\S+\.sh)", cj).group(1); s.run(f"cat {sh}")
    h = s.run("echo I am user bandit23 | md5sum | cut -d ' ' -f 1").strip()
    return find_pw(s.run(f"cat /tmp/{h}"))
def L23(s):
    s.run("cat /etc/cron.d/cronjob_bandit24"); s.run("cat /usr/bin/cronjob_bandit24.sh")
    watch, mine = "/var/spool/bandit24/foo", "/tmp/mine23"
    script = f"#!/bin/bash\ncat /etc/bandit_pass/bandit24 > {mine}/out\nchmod 666 {mine}/out\n"
    s.raw(f"rm -rf {mine}; mkdir -p {mine}; chmod 777 {mine}")
    s.raw(f"cat > {mine}/x.sh <<'EOS'\n{script}EOS\nchmod 777 {mine}/x.sh; rm -f {mine}/out")
    s.raw(f"cp {mine}/x.sh {watch}/x.sh")
    s.note(f"mkdir -p {mine}")
    s.steps.append({"cmd": f"cat > {mine}/x.sh   # copy the password somewhere I can read", "out": script.strip()})
    s.note(f"chmod 777 {mine}/x.sh {mine}")
    s.note(f"cp {mine}/x.sh {watch}/", "(cron runs any script dropped here as bandit24)")
    s.note("# wait ~1 minute for the scheduled job, then:")
    out = ""
    for _ in range(16):
        time.sleep(8); out = s.raw(f"cat {mine}/out 2>/dev/null")
        if find_pw(out):
            break
    s.steps.append({"cmd": f"cat {mine}/out", "out": out.strip()})
    return find_pw(out)
def L24(s):
    pw = s.raw("cat /etc/bandit_pass/bandit24").strip(); s.note("pw=$(cat /etc/bandit_pass/bandit24)")
    real = f'for i in $(seq -w 0 9999); do echo "{pw} $i"; done | nc -q 3 localhost 30002 | grep -v "Wrong"'
    return find_pw(s.run('for i in $(seq -w 0 9999); do echo "$pw $i"; done | nc localhost 30002 | grep -v Wrong',
                         real=real, t=90), exclude=(pw,))

RECIPES = [L0, L1, L2, L3, L4, L5, L6, L7, L8, L9, L10, L11, L12, L13, L14, L15, L16, L17, L18, L19, L20, L21, L22, L23, L24]

# ---- terminal renderer ------------------------------------------------------
MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"
FS, COLS, PAD, TITLE_H = 22, 92, 24, 40
FONT = ImageFont.truetype(MONO, FS); FONTB = ImageFont.truetype(BOLD, FS)
CW, LH = FONT.getbbox("M")[2], FS + 8
FRAME, BAR = (12, 41, 96), (10, 26, 74)
C_PROMPT, C_CMD, C_OUT, C_DIM = (61, 255, 61), (241, 246, 255), (169, 189, 224), (120, 140, 180)


def wrap(s):
    return textwrap.wrap(s, COLS, drop_whitespace=False, break_long_words=True) or [""]


def render(level, steps, path):
    prompt = f"{level['from']}@bandit:~$ "
    lines = []
    for st in steps:
        cmd = st["cmd"]
        if cmd.startswith("#"):
            lines += [(w, C_DIM, False, False) for w in wrap(cmd)]
        else:
            first = True
            for w in wrap(cmd):
                lines.append(((prompt if first else "    ") + w, C_CMD, True, first)); first = False
        for ln in (st.get("out") or "").split("\n") if st.get("out") else []:
            lines += [(w, C_OUT, False, False) for w in (wrap(ln) if ln else [""])]
    W, H = PAD * 2 + CW * COLS, TITLE_H + PAD * 2 + LH * len(lines)
    img = Image.new("RGB", (W, H), FRAME); d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W, TITLE_H], fill=BAR)
    for i, cx in enumerate((PAD + 6, PAD + 26, PAD + 46)):
        d.ellipse([cx, 14, cx + 12, 26], fill=[(255, 95, 86), (255, 189, 46), (39, 201, 63)][i])
    d.text((PAD + 70, 10), f"bandit — levels {level['from']} → {level['to']}", font=FONT, fill=C_DIM)
    d.rectangle([0, 0, W - 1, H - 1], outline=(55, 196, 255), width=2)
    y = TITLE_H + PAD
    for text, col, bold, is_prompt in lines:
        if is_prompt:
            d.text((PAD, y), prompt, font=FONTB, fill=C_PROMPT)
            d.text((PAD + CW * len(prompt), y), text[len(prompt):], font=FONTB, fill=C_CMD)
        else:
            d.text((PAD, y), text, font=(FONTB if bold else FONT), fill=col)
        y += LH
    img.save(path)
    return os.path.basename(path)


def main():
    SHOTS.mkdir(exist_ok=True)
    content = json.loads((SVC / "content.json").read_text())
    out_levels, failures = [], []
    for lvl in content["levels"]:
        n = lvl["id"]; s = Sess(n)
        try:
            pw = RECIPES[n](s)
        finally:
            s.close()
        ok = (pw == KEY[n + 1])
        if not ok:
            failures.append((n, pw, KEY[n + 1]))
        commands = [st["cmd"] for st in s.steps if not st["cmd"].startswith("#")]
        shot = render(lvl, s.steps, SHOTS / f"l{n:02d}.png")
        out_levels.append({**lvl, "commands": commands, "password": pw, "shot": shot})
        print(f"L{n:<2} {'OK ' if ok else 'MISMATCH'} {pw}")
    data = {k: content[k] for k in ("title", "subtitle", "intro", "connect", "notes", "wargames_scope")}
    data["captured_date"] = datetime.date.today().isoformat()
    data["levels"] = out_levels
    (SVC / "data.json").write_text(json.dumps(data, indent=1))
    print("wrote data.json + shots/;", "all OK" if not failures else f"MISMATCHES: {failures}")


if __name__ == "__main__":
    main()
