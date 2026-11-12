import { useState } from 'react'
import { buildSystemPrompt, chat } from '../lib/ollama.js'

const RECOMMEND = {
  ka: 'ჩემი გრაფიკით რომელი სამსახური მირჩევ?',
  en: 'Which job do you recommend for my schedule?',
}

export default function Assistant({ user, matches, hasSchedule }) {
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
    <section className="flex min-h-[calc(100dvh-10rem)] flex-col">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">AI ასისტენტი</h2>
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="mt-1 w-28 rounded-lg border border-line bg-white px-2 py-0.5 text-xs text-muted"
            aria-label="Ollama model"
          />
        </div>
        <div className="flex rounded-full bg-white p-1 text-sm shadow-sm">
          {['ka', 'en'].map((l) => (
            <button key={l} onClick={() => setLang(l)} className={`rounded-full px-3 py-1 font-semibold ${lang === l ? 'bg-ink text-white' : 'text-muted'}`}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-3 text-[15px]">
        {messages.length === 0 && (
          <div className="rounded-3xl bg-white p-4 text-muted shadow-sm">
            <p>
              {hasSchedule
                ? `${matches.length} ვაკანსია ერგება შენს გრაფიკს. სთხოვე რჩევა ან დასვი კითხვა.`
                : 'ჯერ კალენდარში ლექციები მონიშნე, რომ შენს გრაფიკზე მორგებული რჩევა მოგცე.'}
            </p>
            {lang === 'ka' && <p className="mt-2 text-xs text-quiet">llama3.2 ქართულად შეიძლება უხეშად წეროს. EN უფრო სტაბილურია.</p>}
          </div>
        )}
        {messages.map((m, i) => (
          <p
            key={i}
            className={`whitespace-pre-wrap rounded-3xl px-4 py-3 ${m.role === 'user' ? 'ml-10 rounded-br-md bg-brand text-white' : 'mr-10 rounded-bl-md bg-white shadow-sm'}`}
          >
            {m.content || '…'}
          </p>
        ))}
        {error && (
          <p className="rounded-3xl bg-coral/10 p-4 text-sm text-coral">
            {import.meta.env.DEV ? (
              <>Ollama-სთან კავშირი ვერ დამყარდა. ტერმინალში გაუშვი <code>ollama serve</code> და <code>ollama pull {model}</code>.</>
            ) : (
              <>ონლაინ ვერსიაში AI ასისტენტი არ მუშაობს: მას კომპიუტერზე გაშვებული Ollama სჭირდება. გაუშვი პროექტი ლოკალურად (<code>npm run dev</code>).</>
            )}
          </p>
        )}
      </div>

      <div className="sticky bottom-20 mt-4 space-y-2 bg-bg pt-2">
        <button
          onClick={() => send(RECOMMEND[lang])}
          disabled={!hasSchedule || loading}
          className="w-full rounded-2xl bg-brand-soft py-3 text-sm font-semibold text-brand disabled:opacity-50"
        >
          შემირჩიე სამსახური
        </button>
        <form onSubmit={(e) => { e.preventDefault(); send(input) }} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={lang === 'en' ? 'Ask something…' : 'დაწერე კითხვა…'}
            className="min-w-0 flex-1 rounded-2xl border border-line bg-white px-4 py-3 text-base outline-none focus:border-brand"
          />
          <button disabled={loading} aria-label="გაგზავნა" className="rounded-2xl bg-brand px-5 font-semibold text-white disabled:opacity-50">
            ↑
          </button>
        </form>
      </div>
    </section>
  )
}
