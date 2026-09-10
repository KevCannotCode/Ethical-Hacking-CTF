// QR code + URL students open to submit flags.
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { qrSvg } from '@/adapters/index.js'

export default function JoinCard({ url }) {
  const [svg, setSvg] = useState('')
  useEffect(() => { qrSvg().then(setSvg).catch(() => {}) }, [url])
  return (
    <Card className="panel scanlines glow-cyan gap-3 border-2 py-4">
      <CardHeader><CardTitle className="neon-green font-pixel text-[18px] leading-[1.4]">Join & submit flags</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-[150px_1fr] items-center gap-x-4 gap-y-3">
        <div className="size-[150px] bg-white p-1.5 [&>svg]:block [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
        <span className="text-2xl leading-tight text-muted-foreground">Scan to join or create your team, then paste each password you find.</span>
        <div className="col-span-full text-2xl leading-tight text-neon-yellow [overflow-wrap:anywhere]">{url}</div>
      </CardContent>
    </Card>
  )
}
