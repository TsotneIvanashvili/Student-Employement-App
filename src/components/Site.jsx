import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { CONTACT_EMAIL } from '../lib/config.js'
import { todayISO } from '../lib/match.js'
import { Link } from '../lib/router.jsx'
import { catName, dayShort, payText, setLang, tr, useLang } from '../lib/i18n.js'
import { fmtShift } from './Jobs.jsx'
import { Avatar, Badge, Icon, Segmented, btn, btn2, card } from './ui.jsx'

// საჯარო გვერდები: მთავარი, როგორ მუშაობს + კითხვები, ჩვენ შესახებ, წესები, კონფიდენციალურობა, 404.

export function Logo({ className = 'text-[22px]' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 font-bold tracking-[-0.01em] text-ink ${className}`}>
      <span className="grid h-[2em] w-[2em] place-items-center rounded-[0.63em] bg-brand text-[0.95em] text-on-brand">S</span>
      <span>ShiftMate</span>
    </span>
  )
}

export function usePageTitle(title) {
  const lang = useLang()
  useEffect(() => {
    document.title = title ? `${title} · ShiftMate` : tr('ShiftMate — სამუშაო შენს თავისუფალ დროს', 'ShiftMate — work that fits your free time')
  }, [title, lang])
}

const LangSwitch = () => {
  const lang = useLang()
  return <div className="w-[104px]"><Segmented size="sm" value={lang} onChange={setLang} options={[['ka', 'ქართ'], ['en', 'ENG']]} /></div>
}

function Layout({ signedIn, children }) {
  useLang()
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="glass sticky top-0 z-20 border-b border-line">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/" aria-label="ShiftMate"><Logo className="text-[17px] sm:text-[19px]" /></Link>
          <nav className="hidden items-center gap-7 text-[15px] font-medium text-muted md:flex">
            <Link to="/how" className="text-muted hover:text-ink">{tr('როგორ მუშაობს', 'How it works')}</Link>
            <Link to="/about" className="text-muted hover:text-ink">{tr('ჩვენ შესახებ', 'About')}</Link>
          </nav>
          <div className="flex items-center gap-2">
            <span className="hidden sm:block"><LangSwitch /></span>
            {signedIn ? (
              <Link to="/" className="rounded-[14px] bg-brand px-4 py-2.5 text-[14px] font-semibold text-on-brand hover:bg-brand-dark">{tr('აპში გადასვლა', 'Open the app')}</Link>
            ) : (
              <>
                <Link to="/login" className="rounded-[14px] px-3 py-2.5 text-[14px] font-semibold text-ink hover:bg-fill">{tr('შესვლა', 'Log in')}</Link>
                <Link to="/register" className="rounded-[14px] bg-brand px-4 py-2.5 text-[14px] font-semibold text-on-brand hover:bg-brand-dark">{tr('დაწყება', 'Get started')}</Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
          <div>
            <Logo className="text-[17px]" />
            <p className="mt-3 max-w-xs text-[14px] text-muted">{tr('სტუდენტური დასაქმების პორტალი.', 'The student job portal.')}</p>
            <div className="mt-4 sm:hidden"><LangSwitch /></div>
          </div>
          <nav className="grid grid-cols-2 gap-x-10 gap-y-2 text-[14px]">
            <Link to="/how" className="text-muted hover:text-ink">{tr('როგორ მუშაობს', 'How it works')}</Link>
            <Link to="/terms" className="text-muted hover:text-ink">{tr('წესები და პირობები', 'Terms')}</Link>
            <Link to="/about" className="text-muted hover:text-ink">{tr('ჩვენ შესახებ', 'About')}</Link>
            <Link to="/privacy" className="text-muted hover:text-ink">{tr('კონფიდენციალურობა', 'Privacy')}</Link>
          </nav>
        </div>
        <p className="border-t border-line py-4 text-center text-[13px] text-quiet">© {new Date().getFullYear()} ShiftMate</p>
      </footer>
    </div>
  )
}

// მთავარი გვერდის ილუსტრაცია: ტელეფონის ეკრანის მსგავსი კვირის თავისუფალი დრო
export function CalendarMock() {
  useLang()
  const busy = [[[10, 14]], [[9, 13], [18, 20]], [[10, 14]], [[9, 12]], [[10, 13]], [], []]
  const n = [2, 1, 3, 2, 4, 5, 3]
  return (
    <div className="w-full max-w-[360px] rounded-[28px] bg-white p-[18px] shadow-card ring-1 ring-line" aria-hidden="true">
      <p className="text-[13px] text-muted">{tr('თავისუფალი საათები ამ კვირაში', 'Free hours this week')}</p>
      <p className="text-[30px] font-bold leading-[1.1] tracking-[-0.02em]">74 <span className="text-[15px] font-semibold text-muted">{tr('სთ', 'h')}</span></p>
      <div className="mt-3.5 grid grid-cols-7 gap-1.5">
        {busy.map((list, d) => (
          <div key={d} className={`flex flex-col items-center gap-1.5 rounded-2xl pb-1.5 pt-2 ${d === 5 ? 'bg-brand-soft' : ''}`}>
            <span className="text-[11px] font-semibold">{dayShort(d)}</span>
            <span className="relative block h-[84px] w-3.5 overflow-hidden rounded-[7px] bg-brand">
              {list.map(([a, b]) => <span key={a} className="absolute inset-x-0 bg-field" style={{ top: `${((a - 8) / 14) * 100}%`, height: `${((b - a) / 14) * 100}%` }} />)}
            </span>
            <span className="text-[12px] font-bold text-brand-deep">{n[d]}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3 rounded-[18px] bg-bg p-3">
        <Avatar name="Coffee Lab" size={40} radius={13} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-semibold">{tr('ბარისტა შაბათ-კვირას', 'Weekend barista')}</span>
          <span className="mt-1 flex gap-1.5"><Badge tone="green">2/2 {tr('ცვლა ერგება', 'shifts fit')}</Badge></span>
        </span>
        <span className="text-[14px] font-semibold">12 ₾<span className="text-[11px] text-muted">{tr('/სთ', '/hr')}</span></span>
      </div>
    </div>
  )
}

const seekerSteps = () => [
  ['calendar', tr('აირჩიე, როდის ხარ თავისუფალი', "Pick when you're free"), tr('მონიშნე დღეები და საათები. სურვილისამებრ ლექციები კალენდარში ჩაწერე ან Google Calendar-დან შემოიტანე.', 'Pick the days and hours. If you like, add your lectures to the calendar or import them from Google Calendar.')],
  ['search', tr('ნახე მხოლოდ შესაფერისი ვაკანსიები', 'See only the jobs that fit'), tr('სიაში რჩება ის ცვლები, რომლებიც შენს თავისუფალ დროში ჯდება: მუდმივი, ერთჯერადი ან თავისუფალი გრაფიკით.', 'The list keeps only shifts that fit your free time: weekly, one-off or flexible.')],
  ['send', tr('გაგზავნე განაცხადი ერთი დაჭერით', 'Apply in one tap'), tr('თუ აგიყვანენ, ცვლები თავისით ჩნდება შენს კალენდარში. სამუშაოს ბოლოს ერთმანეთს აფასებთ.', 'If you are hired, the shifts appear in your calendar. When the work is done you rate each other.')],
]
const employerSteps = () => [
  ['plus', tr('დაამატე ვაკანსია ცვლის საათებით', 'Post a job with its shift hours'), tr('აირჩიე კვირის დღეები და საათები, ერთი თარიღი ან თავისუფალი გრაფიკი. ანაზღაურება საათში, დღეში ან ფიქსირებული.', 'Pick weekdays and hours, a single date or flexible hours. Pay per hour, per day or a fixed amount.')],
  ['inbox', tr('მიიღე განაცხადები', 'Get applications'), tr('გწერენ მხოლოდ ისინი, ვისაც შენი ცვლის დროს ნამდვილად სცალია. სივი, ტელეფონი და შეფასება ერთ ადგილას ჩანს.', 'Only people who are free during your shifts apply. CV, phone and rating are in one place.')],
  ['users', tr('აიყვანე, დაგეგმე, შეაფასე', 'Hire, plan, rate'), tr('ცვლების კალენდარში ჩანს, ვინ მუშაობს რომელ დღეს. სამუშაოს დასრულების შემდეგ თანამშრომელს აფასებ.', 'The shift calendar shows who works which day. When the work is done you rate the worker.')],
]

const Steps = ({ steps }) => (
  <ol className="space-y-3">
    {steps.map(([icon, title, text], i) => (
      <li key={title} className={`${card} flex gap-3.5 p-4`}>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-brand-soft text-brand-deep"><Icon name={icon} className="h-5 w-5" /></span>
        <div>
          <p className="text-[15px] font-semibold">{i + 1}. {title}</p>
          <p className="text-[14px] text-muted">{text}</p>
        </div>
      </li>
    ))}
  </ol>
)

export function Home({ signedIn }) {
  useLang()
  usePageTitle('')
  const [jobs, setJobs] = useState([])
  useEffect(() => {
    supabase.from('jobs').select('id, title, company, district, remote, pay, pay_unit, category, kind, shifts').eq('is_open', true).order('created_at', { ascending: false }).limit(30)
      // ვადაგასული ერთჯერადი სამუშაოები მთავარ გვერდზე არ ჩანს
      .then(({ data }) => setJobs((data ?? []).map((j) => ({ ...j, live: j.shifts.filter((s) => !s.date || s.date >= todayISO()) })).filter((j) => j.live.length || !j.shifts.length).slice(0, 6)))
  }, [])

  return (
    <Layout signedIn={signedIn}>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:py-20">
        <div>
          <h1 className="text-[36px] font-bold leading-[1.1] tracking-[-0.02em] [text-wrap:balance] sm:text-[52px]">{tr('სამსახური, რომელიც ლექციებს არ ეჯახება', "Student jobs that don't clash with your lectures")}</h1>
          <p className="mt-4 max-w-md text-[17px] text-muted [text-wrap:pretty]">{tr('სტუდენტური დასაქმების პორტალი: აირჩიე, რომელ დღეებსა და საათებში ხარ თავისუფალი, და ShiftMate გაჩვენებს მხოლოდ იმ ვაკანსიებს, რომლებიც ლექციებს არ ეჯახება.', "A student job portal: pick the days and hours you are free, and ShiftMate shows only the jobs that don't clash with your lectures.")}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link to="/register" className={`${btn} px-6 text-center sm:w-auto`}>{tr('სტუდენტი ვარ', "I'm a student")}</Link>
            <Link to="/register?role=employer" className={`${btn2} px-6 text-center !text-ink sm:w-auto`}>{tr('ვქირაობ', "I'm hiring")}</Link>
          </div>
          <p className="mt-3 text-[13px] text-quiet">{tr('რეგისტრაცია უფასოა და ერთ წუთს გრძელდება.', 'Signing up is free and takes a minute.')}</p>
        </div>
        <div className="flex justify-center lg:justify-end"><CalendarMock /></div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-3 px-4 pb-14 sm:px-6 md:grid-cols-3">
        {[
          ['calendar', 'bg-sky-soft text-sky', tr('კალენდარი წყვეტს', 'Your calendar decides'), tr('ვაკანსიებს ვფილტრავთ შენი განრიგის მიხედვით და გაჩვენებთ, რომელი ცვლა ემთხვევა რას.', 'We filter jobs by your schedule and show which shift clashes with what.')],
          ['star', 'bg-amber-soft text-amber', tr('შეფასებები ორივე მხარეს', 'Ratings on both sides'), tr('დასრულებული სამუშაოს შემდეგ დამსაქმებელი და თანამშრომელი ერთმანეთს 1–5 ვარსკვლავით აფასებენ.', 'After a finished job the employer and the worker rate each other from 1 to 5 stars.')],
          ['ai', 'bg-brand-soft text-brand-deep', tr('AI ასისტენტი', 'AI assistant'), tr('მისწერე „ორშაბათს 10-დან 6-მდე სამსახურში ვარ“ და კალენდარს თავად შეგივსებს, მერე კი საუკეთესო ვაკანსიებს გირჩევს.', 'Write "I work Monday 10 to 6" and it fills in your calendar, then suggests the best jobs.')],
        ].map(([icon, tone, title, text]) => (
          <div key={title} className={`${card} p-5`}>
            <span className={`grid h-11 w-11 place-items-center rounded-[14px] ${tone}`}><Icon name={icon} className="h-[22px] w-[22px]" /></span>
            <h2 className="mt-3.5 text-[17px] font-bold">{title}</h2>
            <p className="mt-1 text-[14px] text-muted">{text}</p>
          </div>
        ))}
      </section>

      <section className="border-y border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-[28px] font-bold tracking-[-0.02em] sm:text-[34px]">{tr('როგორ მუშაობს', 'How it works')}</h2>
          <div className="mt-7 grid gap-8 md:grid-cols-2">
            <div>
              <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-quiet">{tr('თუ სამუშაოს ეძებ', 'If you want work')}</p>
              <Steps steps={seekerSteps()} />
            </div>
            <div>
              <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-quiet">{tr('თუ თანამშრომელს ეძებ', "If you're hiring")}</p>
              <Steps steps={employerSteps()} />
            </div>
          </div>
          <Link to="/how" className="mt-7 inline-block text-[15px] font-semibold underline underline-offset-4">{tr('დეტალურად და ხშირი კითხვები', 'Details and FAQ')}</Link>
        </div>
      </section>

      {jobs.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-[28px] font-bold tracking-[-0.02em] sm:text-[34px]">{tr('ბოლოს დამატებული ვაკანსიები', 'Latest jobs')}</h2>
          <ul className="mt-6 grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <li key={job.id}>
                <Link to="/register" className={`${card} flex h-full items-center gap-3 p-3.5 text-ink transition hover:ring-2 hover:ring-brand/40`}>
                  <Avatar name={job.company} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[15px] font-semibold">{job.title}</span>
                      <span className="shrink-0 text-[15px] font-semibold tabular-nums">{payText(job)}</span>
                    </span>
                    <span className="block truncate text-[13px] text-muted">{job.company} · {job.remote ? tr('დისტანციური', 'Remote') : job.district}</span>
                    <span className="mt-2 flex flex-wrap gap-1.5">
                      <Badge>{catName(job.category)}</Badge>
                      <Badge tone="sky">{job.live.length ? `${fmtShift(job.live[0])}${job.live.length > 1 ? ` +${job.live.length - 1}` : ''}` : tr('თავისუფალი გრაფიკი', 'Flexible hours')}</Badge>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 pb-16 text-center sm:px-6">
        <h2 className="text-[28px] font-bold tracking-[-0.02em] sm:text-[34px]">{tr('დაიწყე დღესვე', 'Start today')}</h2>
        <p className="mx-auto mt-2 max-w-md text-[16px] text-muted">{tr('შეავსე კალენდარი ერთხელ და შესაფერისი სამუშაო თავად გიპოვის.', 'Fill in your calendar once and the right work finds you.')}</p>
        <Link to="/register" className={`${btn} mt-6 inline-block px-8 sm:w-auto`}>{tr('ანგარიშის შექმნა', 'Create an account')}</Link>
      </section>
    </Layout>
  )
}

const faq = () => [
  [tr('ShiftMate ფასიანია?', 'Does ShiftMate cost anything?'), tr('ამჟამად რეგისტრაცია, ვაკანსიის განთავსება და განაცხადის გაგზავნა უფასოა. თუ ეს შეიცვლება, წინასწარ შეგატყობინებთ.', 'Signing up, posting jobs and applying are free right now. If that changes, we will tell you in advance.')],
  [tr('როგორ ირჩევა, რომელი ვაკანსია „მერგება“?', 'How do you decide which jobs "fit"?'), tr('ცვლა გერგება, თუ მისი არცერთი საათი არ ემთხვევა იმ დროს, რომელიც კალენდარში დაკავებულად გაქვს ჩაწერილი. ვაკანსიის გვერდზე ჩანს, რომელი ცვლა რას ემთხვევა.', 'A shift fits if none of its hours overlap the busy time in your calendar. The job page shows which shift clashes with what.')],
  [tr('ვინ შეიძლება დარეგისტრირდეს?', 'Who can sign up?'), tr('სრულწლოვანი სტუდენტები (რეგისტრაციისას უნივერსიტეტს უთითებ) და ნებისმიერი კომპანია ან ინდივიდუალური მეწარმე, ვინც სტუდენტს ეძებს ნახევარ განაკვეთზე ან ერთჯერად სამუშაოზე.', 'Adult university students (you name your university when you sign up), and any company or sole trader looking for a student for part-time or one-off work.')],
  [tr('როგორ ვიღებ ანაზღაურებას?', 'How do I get paid?'), tr('დამსაქმებელი აყვანისას თანხას დეპოზიტად დებს. სამუშაოს შემდეგ (საათობრივზე ყოველთვიურად) თანხა შენს ბალანსზე ჩაირიცხება, 10%-იანი საკომისიოს გამოკლებით. ჯერ ეს სადემონსტრაციო რეჟიმია: რეალური ფული არ მოძრაობს.', 'The employer puts the pay on deposit when hiring you. After the work (hourly: every month) it lands in your balance, minus a 10% fee. For now this is a demo: no real money moves.')],
  [tr('როგორ მუშაობს შეფასება?', 'How do ratings work?'), tr('როცა დამსაქმებელი დაადასტურებს, რომ სამუშაო დასრულდა, ორივე მხარე ერთმანეთს 1–5 ვარსკვლავით აფასებს. საშუალო შეფასება ჩანს პროფილზე და ვაკანსიებზე.', 'When the employer confirms the work is done, both sides rate each other from 1 to 5 stars. The average shows on profiles and job posts.')],
  [tr('ვინ ხედავს ჩემს სივს და ტელეფონს?', 'Who sees my CV and phone number?'), tr('მხოლოდ ის დამსაქმებლები, რომელთა ვაკანსიაზეც განაცხადი გააგზავნე.', 'Only the employers whose jobs you applied to.')],
  [tr('რას აკეთებს AI ასისტენტი?', 'What does the AI assistant do?'), tr('გირჩევს ვაკანსიებს შენი თავისუფალი დროის მიხედვით და შეუძლია კალენდარში დაკავებული დრო ჩაგიწეროს. ნებისმიერ ცვლილებას ჯერ შენ ადასტურებ.', 'It suggests jobs that fit your free time and can add busy time to your calendar. You confirm every change first.')],
  [tr('როგორ წავშალო ანგარიში?', 'How do I delete my account?'), tr('პროფილის გვერდზე არის „ანგარიშის წაშლა“. ანგარიშთან ერთად იშლება შენი კალენდარი, სივი, განაცხადები და ვაკანსიები.', 'Your profile page has "Delete account". Your calendar, CV, applications and job posts are deleted with it.')],
]

export function How({ signedIn }) {
  useLang()
  usePageTitle(tr('როგორ მუშაობს', 'How it works'))
  return (
    <Layout signedIn={signedIn}>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-[34px] font-bold tracking-[-0.02em] sm:text-[42px]">{tr('როგორ მუშაობს', 'How it works')}</h1>
        <p className="mt-3 text-[17px] text-muted">{tr('ShiftMate აკავშირებს სტუდენტებს და დამსაქმებლებს, ვისაც კონკრეტულ საათებში სჭირდებათ თანამშრომელი.', 'ShiftMate connects students with employers who need someone at specific hours.')}</p>
        <h2 className="mb-3 mt-10 text-[22px] font-bold">{tr('თუ სამუშაოს ეძებ', 'If you want work')}</h2>
        <Steps steps={seekerSteps()} />
        <h2 className="mb-3 mt-10 text-[22px] font-bold">{tr('თუ თანამშრომელს ეძებ', "If you're hiring")}</h2>
        <Steps steps={employerSteps()} />
        <h2 className="mb-3 mt-12 text-[26px] font-bold tracking-[-0.01em]">{tr('ხშირი კითხვები', 'FAQ')}</h2>
        <div className={`${card} divide-y divide-fill`}>
          {faq().map(([q, a]) => (
            <details key={q} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[16px] font-semibold [&::-webkit-details-marker]:hidden">
                {q}
                <Icon name="chevron" className="h-5 w-5 shrink-0 text-quiet transition group-open:rotate-90" />
              </summary>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{a}</p>
            </details>
          ))}
        </div>
        {!signedIn && <Link to="/register" className={`${btn} mt-10 inline-block px-8 text-center sm:w-auto`}>{tr('ანგარიშის შექმნა', 'Create an account')}</Link>}
      </div>
    </Layout>
  )
}

function Contact() {
  if (!CONTACT_EMAIL) return null
  return (
    <>
      <h2>{tr('კონტაქტი', 'Contact')}</h2>
      <p>{tr('კითხვების, შენიშვნების ან პრობლემის შემთხვევაში მოგვწერე:', 'For questions, feedback or problems, write to')} <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
    </>
  )
}

// გრძელი ტექსტის გვერდი (ჩვენ შესახებ, წესები, კონფიდენციალურობა)
function Article({ signedIn, title, updated, children }) {
  usePageTitle(title)
  return (
    <Layout signedIn={signedIn}>
      <article className="mx-auto max-w-3xl px-4 py-12 text-[16px] leading-relaxed sm:px-6 [&_a]:font-semibold [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mb-2 [&_h2]:mt-8 [&_h2]:text-[20px] [&_h2]:font-bold [&_li]:ml-5 [&_li]:list-disc [&_p]:mt-2 [&_p]:text-muted [&_ul]:mt-2 [&_ul]:space-y-1 [&_ul]:text-muted">
        <h1 className="text-[34px] font-bold leading-tight tracking-[-0.02em] sm:text-[42px]">{title}</h1>
        {updated && <p className="!mt-2 text-[14px] !text-quiet">{tr('ბოლო განახლება', 'Last updated')}: {updated}</p>}
        {children}
      </article>
    </Layout>
  )
}

export function About({ signedIn }) {
  const lang = useLang()
  return (
    <Article signedIn={signedIn} title={tr('ჩვენ შესახებ', 'About us')}>
      {lang === 'en' ? (
        <>
          <p>Most students need an income but cannot skip their lectures. Most job ads do not say which days and hours the work is, so finding something that fits wastes time.</p>
          <p>ShiftMate solves this with a calendar: you write when you are busy, the employer writes when they need someone, and you only see jobs that fit your free time.</p>
          <h2>What we believe</h2>
          <ul>
            <li>Work should fit people's lives, not the other way round.</li>
            <li>Days and hours matter as much as pay.</li>
            <li>Your data is yours: only the employers you apply to see your CV.</li>
          </ul>
          <p>ShiftMate was made in Tbilisi and is at an early stage. Your feedback makes it better.</p>
        </>
      ) : (
        <>
          <p>სტუდენტების უმეტესობას შემოსავალი სჭირდება, მაგრამ ლექციებს ვერ გააცდენს. ვაკანსიების უმეტესობაში კი არ წერია, რომელ დღეებსა და საათებშია სამუშაო, ამიტომ შესაფერისის პოვნა დროის კარგვად იქცევა.</p>
          <p>ShiftMate ამ პრობლემას კალენდრით წყვეტს: შენ წერ, როდის ხარ დაკავებული, დამსაქმებელი წერს, როდის სჭირდება ადამიანი, და მხოლოდ იმ ვაკანსიებს ხედავ, რომლებიც შენს თავისუფალ დროში ჯდება.</p>
          <h2>რისი გვჯერა</h2>
          <ul>
            <li>სამუშაო უნდა ერგებოდეს ადამიანის ცხოვრებას და არა პირიქით.</li>
            <li>ვაკანსიაში დღეები და საათები ისეთივე მნიშვნელოვანია, როგორც ანაზღაურება.</li>
            <li>შენი მონაცემები შენია: სივს მხოლოდ ის დამსაქმებელი ხედავს, ვისაც თავად უგზავნი.</li>
          </ul>
          <p>ShiftMate თბილისში შეიქმნა და საწყის ეტაპზეა. შენი აზრი პროდუქტს უკეთესს გახდის.</p>
        </>
      )}
      <Contact />
    </Article>
  )
}

export function Terms({ signedIn }) {
  const lang = useLang()
  return (
    <Article signedIn={signedIn} title={tr('წესები და პირობები', 'Terms and conditions')} updated={tr('16 ნოემბერი 2026', '16 November 2026')}>
      {lang === 'en' ? (
        <>
          <p>By using ShiftMate you agree to these terms. If you do not agree, please do not use the platform.</p>
          <h2>1. What ShiftMate is</h2>
          <p>ShiftMate is an online platform where employers post jobs with their shift days and hours, and students find work that fits around their lectures. ShiftMate is not an employer, a recruitment agency or a party to any employment contract.</p>
          <h2>2. Your account</h2>
          <ul>
            <li>You must be 18 or older to sign up.</li>
            <li>The information you give must be true and up to date.</li>
            <li>You are responsible for keeping your password safe. One person uses one account.</li>
          </ul>
          <h2>3. Job posts and applications</h2>
          <ul>
            <li>The employer is responsible for the accuracy of a job post: role, pay, place, days and hours.</li>
            <li>Posts that are illegal, discriminatory, misleading or that ask for payment up front are not allowed.</li>
            <li>By applying, a student agrees that the employer of that job may see their name, CV, note and phone number.</li>
            <li>The employer uses candidate data only for hiring.</li>
          </ul>
          <h2>4. Employment and pay</h2>
          <p>The parties agree working conditions and contracts directly. Payments in ShiftMate are currently a <b>demo</b>: balances, deposits and payouts are for illustration only, no real money is charged, held or paid out, and ShiftMate is not responsible for settlements between the parties. In the demo, the employer puts the pay aside as a deposit when hiring, and the worker is credited after the work is confirmed, minus a 10% ShiftMate fee. Each party is responsible for taxes and legal compliance.</p>
          <h2>5. Ratings</h2>
          <p>After the employer marks work as done, both parties can rate each other once with 1 to 5 stars and short tags. Ratings must be honest and based on the actual work. Ratings are visible to signed-in users and cannot be edited.</p>
          <h2>6. AI assistant</h2>
          <p>The assistant's suggestions are generated automatically and may be inaccurate. You always make the decision; check the details on the job page.</p>
          <h2>7. What is not allowed</h2>
          <ul>
            <li>Signing up in someone else's name or posting false information.</li>
            <li>Collecting other users' data or using it for other purposes.</li>
            <li>Interfering with the platform or getting around its security.</li>
          </ul>
          <p>If these terms are broken we may remove a job post or restrict an account.</p>
          <h2>8. Limitation of liability</h2>
          <p>The platform is provided "as is". We do not check every user and job, and we do not guarantee that you will find work or someone to hire. To the extent allowed by law, ShiftMate is not liable for disputes or damage between users.</p>
          <h2>9. Closing your account</h2>
          <p>You can delete your account at any time from your profile page.</p>
          <h2>10. Changes and law</h2>
          <p>These terms may be updated. We will publish important changes on the site. These terms are governed by the law of Georgia.</p>
        </>
      ) : (
        <>
          <p>ShiftMate-ის გამოყენებით ეთანხმები ამ წესებს. თუ არ ეთანხმები, გთხოვთ, პლატფორმა არ გამოიყენო.</p>
          <h2>1. რა არის ShiftMate</h2>
          <p>ShiftMate არის ონლაინ პლატფორმა, სადაც დამსაქმებლები აქვეყნებენ ვაკანსიებს ცვლის დღეებითა და საათებით, ხოლო სტუდენტები პოულობენ ლექციებზე მორგებულ სამუშაოს. ShiftMate არ არის დამსაქმებელი, დასაქმების სააგენტო ან შრომითი ხელშეკრულების მხარე.</p>
          <h2>2. ანგარიში</h2>
          <ul>
            <li>რეგისტრაცია შეუძლია 18 წელს მიღწეულ პირს.</li>
            <li>მითითებული ინფორმაცია უნდა იყოს ნამდვილი და აქტუალური.</li>
            <li>პაროლის უსაფრთხოებაზე პასუხისმგებელი ხარ შენ. ერთი ადამიანი ერთ ანგარიშს იყენებს.</li>
          </ul>
          <h2>3. ვაკანსიები და განაცხადები</h2>
          <ul>
            <li>დამსაქმებელი პასუხისმგებელია ვაკანსიის სისწორეზე: პოზიცია, ანაზღაურება, ადგილი, დღეები და საათები.</li>
            <li>აკრძალულია უკანონო, დისკრიმინაციული, შეცდომაში შემყვანი ან წინასწარი გადახდის მომთხოვნი განცხადებები.</li>
            <li>განაცხადის გაგზავნით სტუდენტი თანახმაა, რომ ამ ვაკანსიის დამსაქმებელმა ნახოს მისი სახელი, სივი, წერილი და ტელეფონის ნომერი.</li>
            <li>დამსაქმებელი კანდიდატის მონაცემებს მხოლოდ დასაქმების მიზნით იყენებს.</li>
          </ul>
          <h2>4. შრომითი ურთიერთობა და ანაზღაურება</h2>
          <p>სამუშაო პირობებსა და ხელშეკრულებაზე მხარეები პირდაპირ თანხმდებიან. ShiftMate-ში გადახდები ჯერ <b>სადემონსტრაციოა</b>: ბალანსი, დეპოზიტი და ჩარიცხვები მხოლოდ საჩვენებელია, რეალური ფული არ ჩამოიჭრება, არ ინახება და არ ირიცხება, და ShiftMate მხარეებს შორის ანგარიშსწორებაზე პასუხს არ აგებს. დემოში დამსაქმებელი აყვანისას თანხას დეპოზიტად დებს, მუშაკს კი ნამუშევრის დადასტურების შემდეგ ერიცხება, ShiftMate-ის 10%-იანი საკომისიოს გამოკლებით. გადასახადებსა და კანონმდებლობის დაცვაზე პასუხისმგებელია თითოეული მხარე.</p>
          <h2>5. შეფასებები</h2>
          <p>როცა დამსაქმებელი სამუშაოს დასრულებულად მონიშნავს, ორივე მხარეს შეუძლია ერთხელ შეაფასოს მეორე 1–5 ვარსკვლავით და მოკლე ნიშნებით. შეფასება უნდა იყოს გულწრფელი და რეალურ სამუშაოს ეფუძნებოდეს. შეფასებებს ხედავენ ავტორიზებული მომხმარებლები და მათი შეცვლა შეუძლებელია.</p>
          <h2>6. AI ასისტენტი</h2>
          <p>ასისტენტის რეკომენდაციები ავტომატურად გენერირდება და შეიძლება შეიცავდეს უზუსტობას. გადაწყვეტილებას ყოველთვის შენ იღებ, ვაკანსიის დეტალები კი მის გვერდზე გადაამოწმე.</p>
          <h2>7. რა არ შეიძლება</h2>
          <ul>
            <li>სხვისი სახელით რეგისტრაცია ან ყალბი ინფორმაციის განთავსება.</li>
            <li>სხვა მომხმარებლების მონაცემების შეგროვება ან არამიზნობრივი გამოყენება.</li>
            <li>პლატფორმის მუშაობის ხელის შეშლა ან უსაფრთხოების გვერდის ავლა.</li>
          </ul>
          <p>წესების დარღვევისას შეგვიძლია ვაკანსია წავშალოთ ან ანგარიში შევზღუდოთ.</p>
          <h2>8. პასუხისმგებლობის შეზღუდვა</h2>
          <p>პლატფორმა მოწოდებულია „როგორც არის“. ჩვენ არ ვამოწმებთ თითოეულ მომხმარებელსა და ვაკანსიას და არ ვიძლევით გარანტიას, რომ სამუშაოს იპოვი ან თანამშრომელს აიყვან. კანონით დაშვებულ ფარგლებში, ShiftMate არ აგებს პასუხს მომხმარებლებს შორის წარმოშობილ დავებსა და ზიანზე.</p>
          <h2>9. ანგარიშის გაუქმება</h2>
          <p>ანგარიშის წაშლა ნებისმიერ დროს შეგიძლია პროფილის გვერდიდან.</p>
          <h2>10. ცვლილებები და სამართალი</h2>
          <p>წესები შეიძლება განახლდეს. მნიშვნელოვან ცვლილებას საიტზე გამოვაქვეყნებთ. წესებზე ვრცელდება საქართველოს კანონმდებლობა.</p>
        </>
      )}
      <Contact />
    </Article>
  )
}

export function Privacy({ signedIn }) {
  const lang = useLang()
  return (
    <Article signedIn={signedIn} title={tr('კონფიდენციალურობის პოლიტიკა', 'Privacy policy')} updated={tr('16 ნოემბერი 2026', '16 November 2026')}>
      {lang === 'en' ? (
        <>
          <p>This explains what data we collect, why we use it and how you can manage it.</p>
          <h2>1. What we collect</h2>
          <ul>
            <li><b>Account:</b> full name, email, role (student or employer), company name, university, faculty and year of study, the field you want to work in, and your language choice.</li>
            <li><b>CV:</b> experience, skills, languages and, if you choose, a PDF file.</li>
            <li><b>Calendar:</b> the time you mark as busy, its name and type.</li>
            <li><b>Applications:</b> which jobs you applied to, your note and phone number.</li>
            <li><b>Ratings:</b> stars and tags you give and receive, and the name of the person or company who gave them.</li>
            <li><b>Profile:</b> your photo (if you add one) and skills.</li>
            <li><b>Messages:</b> chat messages between a worker and the employer who hired them.</li>
            <li><b>Demo payments:</b> deposits, payouts and fees recorded in your demo balance.</li>
            <li><b>Job posts:</b> what employers publish.</li>
            <li><b>Assistant chats:</b> your messages and your weekly free hours, to prepare an answer.</li>
          </ul>
          <h2>2. Why we use it</h2>
          <ul>
            <li>To create your account and let you log in.</li>
            <li>To match jobs to your free time.</li>
            <li>To pass your application to the employer.</li>
            <li>To show ratings, and to keep the platform safe and working.</li>
          </ul>
          <p>We do not sell data or give it to third parties for advertising.</p>
          <h2>3. Who sees your data</h2>
          <ul>
            <li>Your CV, note and phone number are seen only by the employers whose jobs you applied to.</li>
            <li>Only you see your calendar. An employer only sees that you are hired for their shift.</li>
            <li>Ratings and your average rating are visible to signed-in users.</li>
            <li>Your photo, skills and work history are seen by employers you applied to. Chat messages are seen only by the worker and the employer in that chat.</li>
            <li>Published job posts are public.</li>
          </ul>
          <h2>4. Service providers</h2>
          <p>We use these services to run the platform. They process data on our behalf and may be located outside Georgia:</p>
          <ul>
            <li>Supabase: database, sign-in and file storage.</li>
            <li>Vercel: website hosting.</li>
            <li>Groq: generating the AI assistant's answers. It receives your message and free hours, without your name or email.</li>
          </ul>
          <h2>5. Data stored in your browser</h2>
          <p>On your device we only store your sign-in session and small settings (for example your language and whether you have seen the guide). We do not use advertising or tracking cookies.</p>
          <h2>6. How long we keep it</h2>
          <p>Data is kept while your account is active. Deleting your account deletes your profile, CV, calendar, applications, ratings and job posts.</p>
          <h2>7. Your rights</h2>
          <ul>
            <li>See and correct your data on your profile page.</li>
            <li>Delete your account and data from your profile page.</li>
            <li>Ask about how your data is processed and complain to the Personal Data Protection Service of Georgia.</li>
          </ul>
          <h2>8. Changes</h2>
          <p>This policy may be updated. We will publish important changes on the site.</p>
        </>
      ) : (
        <>
          <p>აქ აღწერილია, რა მონაცემებს ვაგროვებთ, რისთვის ვიყენებთ და როგორ შეგიძლია მათი მართვა.</p>
          <h2>1. რა მონაცემებს ვაგროვებთ</h2>
          <ul>
            <li><b>ანგარიში:</b> სახელი და გვარი, ელფოსტა, როლი (სტუდენტი ან დამსაქმებელი), კომპანიის სახელი, უნივერსიტეტი, ფაკულტეტი და კურსი, სასურველი სფერო და ენა.</li>
            <li><b>სივი:</b> გამოცდილება, უნარები, ენები და, სურვილის შემთხვევაში, PDF ფაილი.</li>
            <li><b>კალენდარი:</b> დრო, რომელსაც დაკავებულად ჩაწერ, მისი სახელწოდება და ტიპი.</li>
            <li><b>განაცხადები:</b> რომელ ვაკანსიაზე გააგზავნე, წერილი და ტელეფონის ნომერი.</li>
            <li><b>შეფასებები:</b> ვარსკვლავები და ნიშნები, რომლებსაც აძლევ და იღებ, და შემფასებლის სახელი.</li>
            <li><b>პროფილი:</b> შენი ფოტო (თუ დაამატებ) და უნარები.</li>
            <li><b>შეტყობინებები:</b> ჩატი მუშაკსა და იმ დამსაქმებელს შორის, რომელმაც ის აიყვანა.</li>
            <li><b>სადემონსტრაციო გადახდები:</b> დეპოზიტები, ჩარიცხვები და საკომისიოები შენს სადემონსტრაციო ბალანსზე.</li>
            <li><b>ვაკანსიები:</b> დამსაქმებლის მიერ გამოქვეყნებული ინფორმაცია.</li>
            <li><b>ასისტენტთან მიმოწერა:</b> შენი შეტყობინებები და კვირის თავისუფალი საათები პასუხის მოსამზადებლად.</li>
          </ul>
          <h2>2. რისთვის ვიყენებთ</h2>
          <ul>
            <li>ანგარიშის შესაქმნელად და შესასვლელად.</li>
            <li>ვაკანსიების შენს თავისუფალ დროზე მოსარგებად.</li>
            <li>შენი განაცხადის დამსაქმებლისთვის გადასაცემად.</li>
            <li>შეფასებების საჩვენებლად, პლატფორმის უსაფრთხოებისა და გამართული მუშაობისთვის.</li>
          </ul>
          <p>მონაცემებს არ ვყიდით და სარეკლამო მიზნით მესამე პირებს არ გადავცემთ.</p>
          <h2>3. ვინ ხედავს შენს მონაცემებს</h2>
          <ul>
            <li>სივს, წერილსა და ტელეფონს ხედავს მხოლოდ იმ ვაკანსიის დამსაქმებელი, რომელზეც განაცხადი გააგზავნე.</li>
            <li>კალენდარს მხოლოდ შენ ხედავ. დამსაქმებელი ხედავს მხოლოდ იმას, რომ მის ცვლაზე აყვანილი ხარ.</li>
            <li>შეფასებებს და საშუალო შეფასებას ხედავენ ავტორიზებული მომხმარებლები.</li>
            <li>შენს ფოტოს, უნარებსა და სამუშაო ისტორიას ხედავენ ის დამსაქმებლები, ვისაც განაცხადი გაუგზავნე. ჩატს ხედავენ მხოლოდ მასში მყოფი მუშაკი და დამსაქმებელი.</li>
            <li>გამოქვეყნებული ვაკანსიები საჯაროა.</li>
          </ul>
          <h2>4. მომსახურების მომწოდებლები</h2>
          <p>პლატფორმის მუშაობისთვის ვიყენებთ შემდეგ სერვისებს, რომლებიც მონაცემებს ჩვენი დავალებით ამუშავებენ და შეიძლება საქართველოს ფარგლებს გარეთ მდებარეობდნენ:</p>
          <ul>
            <li>Supabase: მონაცემთა ბაზა, ავტორიზაცია და ფაილების შენახვა.</li>
            <li>Vercel: საიტის ჰოსტინგი.</li>
            <li>Groq: AI ასისტენტის პასუხების გენერაცია. მას გადაეცემა შეტყობინების ტექსტი და თავისუფალი საათები, სახელისა და ელფოსტის გარეშე.</li>
          </ul>
          <h2>5. ბრაუზერში შენახული მონაცემები</h2>
          <p>შენს მოწყობილობაზე ვინახავთ მხოლოდ შესვლის სესიას და მცირე პარამეტრებს (მაგალითად, ენას და ნანახი გაქვს თუ არა გზამკვლევი). სარეკლამო ან თვალთვალის ქუქიებს არ ვიყენებთ.</p>
          <h2>6. რამდენ ხანს ვინახავთ</h2>
          <p>მონაცემები ინახება, სანამ ანგარიში აქტიურია. ანგარიშის წაშლისას იშლება პროფილი, სივი, კალენდარი, განაცხადები, შეფასებები და შენი ვაკანსიები.</p>
          <h2>7. შენი უფლებები</h2>
          <ul>
            <li>მონაცემების ნახვა და შესწორება პროფილის გვერდზე.</li>
            <li>ანგარიშისა და მონაცემების წაშლა პროფილის გვერდიდან.</li>
            <li>მონაცემთა დამუშავებაზე ინფორმაციის მოთხოვნა და საჩივრის წარდგენა პერსონალურ მონაცემთა დაცვის სამსახურში.</li>
          </ul>
          <h2>8. ცვლილებები</h2>
          <p>პოლიტიკა შეიძლება განახლდეს. მნიშვნელოვან ცვლილებას საიტზე გამოვაქვეყნებთ.</p>
        </>
      )}
      <Contact />
    </Article>
  )
}

export function NotFound({ signedIn }) {
  useLang()
  usePageTitle(tr('გვერდი ვერ მოიძებნა', 'Page not found'))
  return (
    <Layout signedIn={signedIn}>
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <p className="text-[72px] font-bold leading-none tracking-[-0.02em]">404</p>
        <h1 className="mt-4 text-[22px] font-bold">{tr('გვერდი ვერ მოიძებნა', 'Page not found')}</h1>
        <p className="mt-2 text-[15px] text-muted">{tr('ბმული შეიძლება მოძველდა ან არასწორად აიკრიფა.', 'The link may be old or mistyped.')}</p>
        <Link to="/" className={`${btn} mt-6 inline-block px-8 sm:w-auto`}>{tr('მთავარ გვერდზე', 'Go home')}</Link>
      </div>
    </Layout>
  )
}
