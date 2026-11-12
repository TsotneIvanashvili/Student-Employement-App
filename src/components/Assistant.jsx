import { useState } from 'react'
import { buildSystemPrompt, chat } from '../lib/ollama.js'

const RECOMMEND = {
  ka: 'ჩემი გრაფიკით რომელი სამსახური მირჩევ?',
  en: 'Which job do you recommend for my schedule?',
}

export default function Assistant({ user, matches, hasSchedule }) {
  const [open, setOpen] = useState(false)
  const [lang, setLang] = useState('ka')
  const [model, setModel] = useState('llama3.2')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function send(text) {
    if (!text.trim() || loading) return
    const history = [...messages, { role: 'user', content: text }]
    setMessages([...history, { role: 'assistant', content: '' }])
    setInput('')
    setError('')
    setLoading(true)
    try {
      await chat({
        model,
        system: buildSystemPrompt({ user, matches, lang }),
        messages: history,
        onToken: (full) => setMessages([...history, { role: 'assistant', content: full }]),
      })
    } catch (e) {
      setMessages(history)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        data-tour="assistant"
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-30 rounded-full bg-accent px-5 py-3 font-semibold text-white shadow-lg hover:opacity-90"
      >
        {open ? 'დახურვა' : 'AI ასისტენტი'}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-30 flex h-[560px] w-[380px] max-w-[calc(100vw-3rem)] flex-col rounded-3xl border border-line bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-line p-4">
            <div>
              <h2 className="font-bold">AI ასისტენტი</h2>
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="mt-1 w-32 rounded border border-line px-2 text-xs text-muted"
                aria-label="Ollama model"
              />
            </div>
            <div className="flex overflow-hidden rounded-lg border border-line text-sm">
              {['ka', 'en'].map((l) => (
                <button key={l} onClick={() => setLang(l)} className={`px-3 py-1 ${lang === l ? 'bg-navy text-white' : ''}`}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
            {messages.length === 0 && (
              <div className="space-y-3 text-muted">
                <p>
                  {hasSchedule
                    ? `${matches.length} ვაკანსია ერგება შენს გრაფიკს. დამისვი კითხვა ან სთხოვე რჩევა.`
                    : 'ჯერ კალენდარში ლექციები მონიშნე, რომ შენს გრაფიკზე მორგებული რჩევა მოგცე.'}
                </p>
                {lang === 'ka' && (
                  <p className="text-xs text-quiet">llama3.2 ქართულად შეიძლება უხეშად წეროს. EN უფრო სტაბილურია.</p>
                )}
              </div>
            )}
            {messages.map((m, i) => (
              <p
                key={i}
                className={`whitespace-pre-wrap rounded-2xl p-3 ${m.role === 'user' ? 'ml-8 bg-accent text-white' : 'mr-8 bg-mist'}`}
              >
                {m.content || '…'}
              </p>
            ))}
            {error && (
              <p className="rounded-2xl bg-red-50 p-3 text-red-700">
                {import.meta.env.DEV ? (
                  <>Ollama-სთან კავშირი ვერ დამყარდა. ტერმინალში გაუშვი <code>ollama serve</code> და <code>ollama pull {model}</code>.</>
                ) : (
                  <>ონლაინ ვერსიაში AI ასისტენტი არ მუშაობს: მას კომპიუტერზე გაშვებული Ollama სჭირდება. გაუშვი პროექტი ლოკალურად (<code>npm run dev</code>).</>
                )}
                <br />
                <span className="text-xs">{error}</span>
              </p>
            )}
          </div>

          <div className="space-y-2 border-t border-line p-3">
            <button
              onClick={() => send(RECOMMEND[lang])}
              disabled={!hasSchedule || loading}
              className="w-full rounded-xl bg-mist py-2 text-sm font-semibold disabled:opacity-50"
            >
              შემირჩიე სამსახური
            </button>
            <form onSubmit={(e) => { e.preventDefault(); send(input) }} className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={lang === 'en' ? 'Ask something…' : 'დაწერე კითხვა…'}
                className="flex-1 rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <button disabled={loading} className="rounded-xl bg-accent px-4 text-sm font-semibold text-white disabled:opacity-50">
                ↑
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
