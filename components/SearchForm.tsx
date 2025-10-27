
'use client'
import { useState } from 'react'
import { StateCode, CheckResponse } from '@/lib/types'

const STATES: StateCode[] = ['TX','AZ','OH','OK','NJ','WA']

export default function SearchForm() {
  const [state, setState] = useState<StateCode>('TX')
  const [cpt, setCpt] = useState('')
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CheckResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    const params = new URLSearchParams({ state })
    if (cpt) params.set('cpt', cpt.trim())
    if (!cpt && keyword) params.set('keyword', keyword.trim())
    try {
      const res = await fetch(`/api/check?${params.toString()}`)
      if (!res.ok) {
        let parsed: any = null
        try {
          parsed = await res.json()
        } catch {
          parsed = null
        }

        if (res.status === 404 && parsed?.matchQuality) {
          setResult(parsed as CheckResponse)
          setError(parsed.disclaimers?.[0] || 'No match')
        } else {
          setResult(null)
          setError(parsed?.error || `Request failed (${res.status})`)
        }
      } else {
        const data = (await res.json()) as CheckResponse
        setResult(data)
      }
    } catch (err:any) {
      setError(err.message || 'Network error')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-1">
            <label className="block text-sm mb-1">State</label>
            <select className="input" value={state} onChange={e=>setState(e.target.value as StateCode)}>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm mb-1">CPT/HCPCS</label>
            <input className="input" placeholder="27447" value={cpt} onChange={e=>setCpt(e.target.value)} />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm mb-1">or Keyword</label>
            <input className="input" placeholder="knee arthroplasty" value={keyword} onChange={e=>setKeyword(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            className={`btn ${loading ? 'cursor-wait opacity-80' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <SpinnerIcon />
                Checking…
              </>
            ) : (
              'Check Now'
            )}
          </button>
          <span className="text-xs text-neutral-500">Tip: Try CPT first for exact results.</span>
        </div>
      </form>

      {result && (
        <div className="mt-6">
          <ResultView data={result} />
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

function Badge({children}:{children: React.ReactNode}) {
  return <span className="badge mr-2">{children}</span>
}

function ResultView({ data }: { data: CheckResponse }) {
  if (!data.matchQuality) {
    return null
  }

  if (data.matchQuality === 'NONE') {
    return (
      <div className="mt-4">
        <h3 className="font-semibold">No WISeR rule found</h3>
        <p className="text-sm text-neutral-500">Try a different term or verify with your MAC/CMS.</p>
        {data.suggestions && (
          <ul className="mt-2 text-sm list-disc pl-5">
            {data.suggestions.map(s => <li key={s.cpt}><span className="font-mono">{s.cpt}</span> — {s.description}</li>)}
          </ul>
        )}
      </div>
    )
  }

  const rule = data.rule
  if (!rule) {
    return (
      <div className="mt-4">
        <p className="text-sm text-red-600">No rule data available for this response.</p>
      </div>
    )
  }
  return (
    <div className="mt-4 space-y-3">
      <div className="p-4 border rounded-xl dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{rule.description} <span className="font-mono text-neutral-500">({rule.cpt})</span></h3>
          <Badge>{rule.requiresPA === 'YES' ? 'PA Required' : rule.requiresPA}</Badge>
        </div>
        <div className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          <p>Program: {rule.program}</p>
          <p>Effective: {new Date(rule.effectiveDate).toLocaleDateString()}</p>
          <p>States: {rule.states.map(s => <Badge key={s}>{s}</Badge>)}</p>
        </div>
        <div className="mt-3">
          <Checklist ruleId={rule.id} items={rule.documentation} />
        </div>
        <div className="mt-3">
          <Feedback ruleId={rule.id} />
        </div>
      </div>
    </div>
  )
}

function Checklist({ ruleId, items }:{ ruleId:string; items:any[] }) {
  const [checked, setChecked] = useState<string[]>([])
  const toggle = (id:string) => setChecked(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])

  async function exportNow(type:'email'|'pdf') {
    const res = await fetch('/api/export', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        destination: type === 'email' ? 'email':'pdf',
        email: type==='email' ? 'you@example.com' : undefined,
        ruleId, checkedItems: checked
      })
    })
    const data = await res.json()
    alert(type==='email' ? 'Checklist emailed (demo)!' : 'PDF generated (demo)!')
    console.log(data)
  }

  return (
    <div>
      <h4 className="font-semibold mb-2">Documentation Checklist</h4>
      <ul className="space-y-2">
        {items.map(it => (
          <li key={it.id} className="flex items-start gap-2">
            <input type="checkbox" className="mt-1" checked={checked.includes(it.id)} onChange={()=>toggle(it.id)} />
            <div>
              <p>{it.label} {it.required && <span className="text-xs text-neutral-500">(required)</span>}</p>
              {it.helpText && <p className="text-xs text-neutral-500">{it.helpText}</p>}
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex gap-2">
        <button className="btn" onClick={()=>exportNow('email')}>Email Checklist</button>
        <button className="btn" onClick={()=>exportNow('pdf')}>Download PDF</button>
      </div>
    </div>
  )
}

function Feedback({ ruleId }:{ ruleId:string }){
  const [sent, setSent] = useState(false)
  const [signal, setSignal] = useState<'up'|'down'|'none'>('none')
  const [comment, setComment] = useState('')
  async function submit(){
    await fetch('/api/feedback',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ ruleId, signal: signal==='none'? 'up' : signal, comment })
    })
    setSent(true)
  }
  if (sent) return <p className="text-xs text-green-600 mt-2">Thanks for the feedback!</p>
  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 text-sm">
        <button className="btn" onClick={()=>setSignal('up')}>👍 Accurate</button>
        <button className="btn" onClick={()=>setSignal('down')}>👎 Needs fix</button>
        <input className="input" placeholder="Optional note" value={comment} onChange={e=>setComment(e.target.value)} />
        <button className="btn" onClick={submit}>Send</button>
      </div>
    </div>
  )
}

function SpinnerIcon() {
  return (
    <svg
      className="mr-2 h-4 w-4 animate-spin text-neutral-500"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      role="presentation"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  )
}
