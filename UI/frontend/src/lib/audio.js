// Sound effects and background music for the display. Preferences persist in localStorage. No React.
const KEY = 'ctf-audio'
const prefs = Object.assign({ sfx: true, music: false }, read())
const lists = { fail: [], success: [], music: [] }
const cues = { finish: null, end: null } // single-shot celebration sounds, one URL each
const BGM_VOLUME = 0.35
const DUCK = 0.2          // music drops to 20% while a sound effect plays
const CROSSFADE_SEC = 3   // overlap between background tracks so the loop never cuts
let bgm = null
let playing = 0           // sound effects in flight; music stays ducked while > 0

function read() { try { return JSON.parse(localStorage.getItem(KEY)) || {} } catch { return {} } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(prefs)) } catch { /* private mode */ } }

// Smoothly moves an HTMLAudio element's volume over `ms` so changes are heard as a swell, not a click.
function fadeTo(el, target, ms = 150) {
  clearInterval(el._fade)
  target = Math.max(0, Math.min(1, target))
  const steps = Math.max(1, Math.round(ms / 40))
  const step = (target - el.volume) / steps
  let k = 0
  el._fade = setInterval(() => {
    k += 1
    el.volume = Math.max(0, Math.min(1, el.volume + step))
    if (k >= steps) { el.volume = target; clearInterval(el._fade) }
  }, 40)
}

function playOne(url) {
  if (!prefs.sfx || !url) return
  const a = new Audio(url)
  const done = () => { playing = Math.max(0, playing - 1); if (!playing) bgm?.duck(false) }
  a.addEventListener('ended', done)
  a.addEventListener('error', done)
  playing += 1
  bgm?.duck(true)
  a.play().catch(done)
}

function play(list) {
  if (list.length) playOne(list[Math.floor(Math.random() * list.length)])
}

// Background music: two elements crossfaded track-to-track so a playlist loops seamlessly.
function filePlayer(urls) {
  let a = new Audio()
  let b = new Audio()
  a.preload = b.preload = 'auto'
  let i = 0
  let ducked = false
  let swapping = false
  let timer = null
  const vol = () => (ducked ? BGM_VOLUME * DUCK : BGM_VOLUME)

  function begin(el, idx, ms) {
    el.src = urls[idx]
    el.currentTime = 0
    el.volume = 0
    el.play().catch(() => {})
    fadeTo(el, vol(), ms)
  }
  function tick() {
    const d = a.duration
    if (!swapping && urls.length > 1 && d && d - a.currentTime <= CROSSFADE_SEC) {
      swapping = true
      i = (i + 1) % urls.length
      begin(b, i, CROSSFADE_SEC * 1000) // next track fades in
      fadeTo(a, 0, CROSSFADE_SEC * 1000) // current track fades out
      setTimeout(() => { a.pause(); [a, b] = [b, a]; swapping = false }, CROSSFADE_SEC * 1000)
    }
  }
  return {
    start() {
      if (urls.length === 1) a.loop = true
      begin(a, 0, 150)
      timer = setInterval(tick, 250)
    },
    stop() {
      clearInterval(timer); clearInterval(a._fade); clearInterval(b._fade)
      a.pause(); b.pause()
    },
    duck(on) {
      ducked = on
      fadeTo(a, vol())
      if (swapping) fadeTo(b, vol())
    },
  }
}

// Built-in 8-bit loop, used when sfx/music/ holds no files.
function chiptune() {
  const ctx = new AudioContext()
  const master = ctx.createGain()
  const LEVEL = 0.07
  master.gain.value = LEVEL
  master.connect(ctx.destination)
  const lead = [0, 3, 7, 12, 10, 7, 3, 0, 5, 8, 12, 15, 12, 8, 5, 3, 0, 3, 7, 10, 12, 10, 7, 3, -2, 1, 5, 8, 10, 8, 5, 1]
  const bass = [0, 0, 7, 7, 5, 5, 3, 3, 0, 0, 7, 7, -2, -2, 3, 3]
  const step = 0.14, root = 220, len = lead.length * step
  let stopped = false
  let next = ctx.currentTime + 0.05
  const note = (freq, t, dur, type) => {
    const o = ctx.createOscillator(), g = ctx.createGain()
    o.type = type
    o.frequency.value = freq
    g.gain.setValueAtTime(1, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + dur)
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur)
  }
  const bar = (t) => {
    lead.forEach((s, i) => note(root * 2 * 2 ** (s / 12), t + i * step, step * 0.9, 'square'))
    bass.forEach((s, i) => note((root / 2) * 2 ** (s / 12), t + i * step * 2, step * 1.8, 'triangle'))
  }
  const tick = () => {
    if (stopped) return
    while (next < ctx.currentTime + 1) { bar(next); next += len }
    setTimeout(tick, 250)
  }
  return {
    start() { tick() },
    stop() { stopped = true; ctx.close() },
    duck(on) { master.gain.setTargetAtTime(on ? LEVEL * DUCK : LEVEL, ctx.currentTime, 0.05) },
  }
}

function startMusic() {
  if (bgm) return
  bgm = lists.music.length ? filePlayer(lists.music) : chiptune()
  bgm.start()
  if (playing) bgm.duck(true)
}
function stopMusic() { if (bgm) { bgm.stop(); bgm = null } }

export const audio = {
  get sfx() { return prefs.sfx },
  get music() { return prefs.music },
  async load(fetchList, fetchCues) {
    ;[lists.fail, lists.success, lists.music] = await Promise.all(['fail', 'success', 'music'].map(fetchList))
    if (fetchCues) Object.assign(cues, await fetchCues().catch(() => ({})))
  },
  resume() { if (prefs.music) startMusic() }, // call after a user gesture
  playFail() { play(lists.fail) },
  playOk() { play(lists.success) },
  playFinish() { playOne(cues.finish) }, // a team reaches the final flag
  playEnd() { playOne(cues.end) },        // the whole CTF is over
  toggleSfx() { prefs.sfx = !prefs.sfx; save(); return prefs.sfx },
  toggleMusic() { prefs.music = !prefs.music; save(); prefs.music ? startMusic() : stopMusic(); return prefs.music },
}
