// Base transport for every adapter. Nothing else under src/ may call fetch.
const json = async (res) => {
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || res.statusText)
  return body
}

export const get = (url) => fetch(url, { cache: 'no-store' }).then(json)
export const post = (url, body) =>
  fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) }).then(json)
export const del = (url) => fetch(url, { method: 'DELETE' }).then(json)
export const text = (url) => fetch(url).then((r) => r.text())
