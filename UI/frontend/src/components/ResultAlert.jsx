// Verdict panel on the phone after a submission.
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert.jsx'

const BANDIT = 'bandit.labs.overthewire.org -p 2220'
const tone = {
  ok: 'border-neon-green text-neon-green glow-green',
  bad: 'border-neon-red text-neon-red shadow-[0_0_16px_var(--neon-red)]',
}
const headline = { ok: (r) => `bandit${r.target} unlocked`, bad: () => 'Nope', done: () => 'Finished' }

export default function ResultAlert({ result, lastLevel }) {
  const r = result
  return (
    <Alert className={`border-[3px] bg-well/80 ${tone[r.status] || 'border-neon-yellow text-neon-yellow glow-yellow'}`}>
      <AlertTitle className="font-pixel text-[20px] leading-[1.4]">{(headline[r.status] || (() => 'Hmm'))(r)}</AlertTitle>
      <AlertDescription className="grid gap-2 text-[24px] text-foreground">
        <span>{r.msg}</span>
        {r.status === 'ok' && r.level < lastLevel && (
          <>
            <span>Log in as bandit{r.level} and hunt the next one:</span>
            <code className="block text-[18px] text-neon-yellow [overflow-wrap:anywhere]">ssh bandit{r.level}@{BANDIT}</code>
          </>
        )}
      </AlertDescription>
    </Alert>
  )
}
