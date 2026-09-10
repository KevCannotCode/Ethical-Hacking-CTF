// Sound file lists and the QR code image.
import { get, text } from './_shared.js'

export const soundList = (kind) => get(`/sfx/${kind}`)
export const cues = () => get('/api/cues') // { finish, end } single-shot celebration sounds
export const qrSvg = () => text('/api/qr.svg')
