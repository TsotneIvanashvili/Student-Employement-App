import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { tr, useLang } from '../lib/i18n.js'
import { STATUS_TONE, statusText } from './Applicants.jsx'
import { Chat } from './Chat.jsx'
import { listBox, openJob } from './Jobs.jsx'
import { EscrowLine } from './Wallet.jsx'
import { Avatar, Badge, Empty, Title, btn } from './ui.jsx'

// მაძიებლის ინბოქსი: ჩატები (აყვანის შემდეგ) და გაგზავნილი განაცხადები სტატუსით
export default function SeekerInbox({ profile, applications, unread, onFindJobs }) {
  useLang()
  const [last, setLast] = useState({})
  const [chat, setChat] = useState(null)
  const active = applications.filter((a) => ['accepted', 'done'].includes(a.status))
  const others = applications.filter((a) => !['accepted', 'done'].includes(a.status))
  const ids = active.map((a) => a.id).join(',')
  const unreadTotal = Object.values(unread).reduce((a, b) => a + b, 0)

  useEffect(() => {
    if (!ids) return
    supabase.from('messages').select('application_id, body, sender_id, created_at').in('application_id', ids.split(',')).order('created_at', { ascending: false }).limit(200).then(({ data }) => {
      const m = {}
      for (const r of data ?? []) m[r.application_id] ??= r
      setLast(m)
    })
  }, [ids, unreadTotal, chat])

  if (!applications.length) {
    return (
      <div className="mx-auto max-w-3xl">
        <Title>{tr('ინბოქსი', 'Inbox')}</Title>
        <Empty icon="inbox" title={tr('ჯერ ცარიელია', 'Nothing here yet')} text={tr('როცა ვაკანსიაზე განაცხადს გააგზავნი, აქ ნახავ პასუხს. აყვანის შემდეგ დამსაქმებელს აქვე მისწერ.', 'When you apply for a job, the reply shows up here. Once hired, you can message the employer here.')} action={<button onClick={onFindJobs} className={`${btn} px-6`}>{tr('ვაკანსიების ნახვა', 'Browse jobs')}</button>} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Title>{tr('ინბოქსი', 'Inbox')}</Title>
      {active.length > 0 && (
        <section>
          <h2 className="mb-2.5 px-1 text-[17px] font-bold">{tr('ჩატები', 'Chats')}</h2>
          <ul className={listBox}>
            {active.map((a) => {
              const m = last[a.id]
              const n = unread[a.id] ?? 0
              return (
                <li key={a.id}>
                  <button onClick={() => setChat(a)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-bg sm:px-5" data-chat-row>
                    <Avatar name={a.jobs.company} size={46} radius={23} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-[16px] font-bold">{a.jobs.company}</span>
                        <Badge tone={STATUS_TONE[a.status]}>{statusText(a.status, 'seeker')}</Badge>
                      </span>
                      <span className="block truncate text-[13px] text-muted">{a.jobs.title}</span>
                      <span className={`block truncate text-[14px] ${n ? 'font-semibold text-ink' : 'text-muted'}`}>
                        {m ? `${m.sender_id === profile.id ? tr('შენ: ', 'You: ') : ''}${m.body}` : tr('აგიყვანეს. მისწერე დამსაქმებელს.', "You're hired. Say hello to the employer.")}
                      </span>
                      <span className="mt-1 block"><EscrowLine applicationId={a.id} /></span>
                    </span>
                    {n > 0 && <span className="grid h-6 min-w-6 place-items-center rounded-full bg-coral px-1.5 text-[12px] font-bold text-white">{n}</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}
      {others.length > 0 && (
        <section>
          <h2 className="mb-2.5 px-1 text-[17px] font-bold">{tr('განაცხადები', 'Applications')}</h2>
          <ul className={listBox}>
            {others.map((a) => (
              <li key={a.id}>
                <button onClick={() => openJob(a.jobs.id)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-bg sm:px-5">
                  <Avatar name={a.jobs.company} size={42} radius={21} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-bold">{a.jobs.title}</span>
                    <span className="block truncate text-[13px] text-muted">{a.jobs.company}</span>
                  </span>
                  <Badge tone={STATUS_TONE[a.status]}>{statusText(a.status, 'seeker')}</Badge>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {chat && <Chat app={chat.id} me={profile.id} title={chat.jobs.company} subtitle={chat.jobs.title} onClose={() => setChat(null)} />}
    </div>
  )
}
