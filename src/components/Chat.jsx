import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { todayISO } from '../lib/match.js'
import { monthShort, tr, useLang } from '../lib/i18n.js'
import { Avatar, Icon } from './ui.jsx'

// წაუკითხავი შეტყობინებები თითო განაცხადზე; ცოცხლად ახლდება
export function useUnread(me) {
  const [map, setMap] = useState({})
  useEffect(() => {
    if (!me) return
    const load = () =>
      supabase.from('messages').select('application_id').eq('seen', false).neq('sender_id', me).then(({ data }) => {
        const m = {}
        for (const r of data ?? []) m[r.application_id] = (m[r.application_id] ?? 0) + 1
        setMap(m)
      })
    load()
    const ch = supabase.channel(`unread-${me}-${Math.random().toString(36).slice(2)}`).on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, load).subscribe()
    window.addEventListener('sm-seen', load)
    return () => {
      supabase.removeChannel(ch)
      window.removeEventListener('sm-seen', load)
    }
  }, [me])
  return map
}

const time = (ts) => {
  const d = new Date(ts)
  const hm = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return todayISO(d) === todayISO() ? hm : `${d.getDate()} ${monthShort(d.getMonth())}, ${hm}`
}

// ჩატი მაძიებელსა და დამსაქმებელს შორის. ბაზა უშვებს მხოლოდ აყვანის შემდეგ (RLS).
export function Chat({ app, me, title, subtitle, avatar, onClose }) {
  useLang()
  const [msgs, setMsgs] = useState(null)
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const end = useRef(null)

  useEffect(() => {
    const markSeen = () =>
      supabase.from('messages').update({ seen: true }).eq('application_id', app).eq('seen', false).neq('sender_id', me).then(() => window.dispatchEvent(new Event('sm-seen')))
    supabase.from('messages').select('*').eq('application_id', app).order('created_at').then(({ data }) => {
      setMsgs(data ?? [])
      markSeen()
    })
    const ch = supabase
      .channel(`chat-${app}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `application_id=eq.${app}` }, ({ new: m }) => {
        setMsgs((list) => (list?.some((x) => x.id === m.id) ? list : [...(list ?? []), m]))
        if (m.sender_id !== me) markSeen()
      })
      .subscribe()
    const esc = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => {
      supabase.removeChannel(ch)
      window.removeEventListener('keydown', esc)
    }
  }, [app, me]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' })
  }, [msgs])

  async function send(e) {
    e.preventDefault()
    const body = text.trim()
    if (!body) return
    setText('')
    setError('')
    const { data, error } = await supabase.from('messages').insert({ application_id: app, body }).select().single()
    if (error) {
      setText(body)
      return setError(tr('ვერ გაიგზავნა. სცადე თავიდან.', 'Could not send. Try again.'))
    }
    setMsgs((list) => (list?.some((x) => x.id === data.id) ? list : [...(list ?? []), data]))
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-ink/40 animate-fade sm:items-center sm:p-6" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} className="flex h-dvh w-full flex-col overflow-hidden bg-bg sm:h-[min(720px,90dvh)] sm:max-w-lg sm:rounded-[28px] sm:shadow-[0_20px_60px_rgba(21,24,30,.25)]">
        <header className="flex items-center gap-3 border-b border-line bg-white px-3 pb-3 pt-[max(env(safe-area-inset-top),12px)] sm:pt-3">
          <button onClick={onClose} aria-label={tr('დახურვა', 'Close')} className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-fill"><Icon name="back" className="h-5 w-5" strokeWidth={2.5} /></button>
          <Avatar name={title} src={avatar} size={40} radius={20} />
          <span className="min-w-0">
            <span className="block truncate text-[16px] font-bold">{title}</span>
            <span className="block truncate text-[13px] text-muted">{subtitle}</span>
          </span>
        </header>
        <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
          {msgs?.length === 0 && <p className="mx-auto mt-10 max-w-xs text-center text-[14px] text-muted">{tr('აქ შეგიძლიათ შეთანხმდეთ დეტალებზე: დრო, მისამართი, რა უნდა წამოიღოს.', 'Agree the details here: time, address, what to bring.')}</p>}
          {msgs?.map((m) => {
            const mine = m.sender_id === me
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-[20px] px-3.5 py-2 ${mine ? 'rounded-br-md bg-ink text-white' : 'rounded-bl-md bg-white text-ink shadow-[0_1px_2px_rgba(21,24,30,.06)]'}`}>
                  <p className="whitespace-pre-wrap break-words text-[15px]">{m.body}</p>
                  <p className={`mt-0.5 text-right text-[11px] ${mine ? 'text-white/60' : 'text-quiet'}`}>{time(m.created_at)}</p>
                </div>
              </div>
            )
          })}
          <div ref={end} />
        </div>
        {error && <p className="px-4 pb-1 text-[13px] font-medium text-coral">{error}</p>}
        <form onSubmit={send} className="flex items-end gap-2 border-t border-line bg-white px-3 pb-[max(env(safe-area-inset-bottom),12px)] pt-3">
          <textarea
            rows={1}
            maxLength={2000}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send(e)}
            aria-label={tr('შეტყობინება', 'Message')}
            placeholder={tr('დაწერე შეტყობინება…', 'Write a message…')}
            className="max-h-32 min-h-[46px] flex-1 resize-none rounded-[22px] bg-bg px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-ink/15"
          />
          <button disabled={!text.trim()} aria-label={tr('გაგზავნა', 'Send')} className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-full bg-ink text-white disabled:opacity-30"><Icon name="send" className="h-5 w-5" /></button>
        </form>
      </div>
    </div>
  )
}

// „ჩატი“ ღილაკი წაუკითხავების რიცხვით
export function ChatButton({ unread = 0, onClick, dark }) {
  useLang()
  return (
    <button onClick={onClick} className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-semibold transition active:scale-[.98] ${dark ? 'bg-white/10 text-white' : 'bg-fill text-ink hover:bg-line'}`}>
      <Icon name="chat" className="h-5 w-5" />
      {tr('ჩატი', 'Chat')}
      {unread > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-coral px-1.5 text-[11px] font-bold text-white">{unread}</span>}
    </button>
  )
}
