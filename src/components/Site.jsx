import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { CONTACT_EMAIL } from '../lib/config.js'
import { formatShift, todayISO } from '../lib/match.js'
import { Link } from '../lib/router.jsx'
import { DOTS } from './BigCalendar.jsx'
import { CompanyLogo } from './JobCard.jsx'
import { Badge, Icon, btn, btn2, card } from './ui.jsx'

// საჯარო გვერდები: მთავარი, როგორ მუშაობს + კითხვები, ჩვენ შესახებ, წესები, კონფიდენციალურობა, 404.

export function Logo({ className = 'text-[24px]' }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight text-ink ${className}`}>
      <span className="grid h-[1.4em] w-[1.4em] place-items-center rounded-[0.4em] bg-brand text-on-brand">
        <Icon name="calendar" className="h-[0.85em] w-[0.85em]" strokeWidth={3} />
      </span>
      <span>shift<span className="text-muted">mate</span></span>
    </span>
  )
}

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Shiftmate` : 'Shiftmate — სამსახური შენს თავისუფალ დროს'
  }, [title])
}

const NAV = [['/how', 'როგორ მუშაობს'], ['/about', 'ჩვენ შესახებ']]

function Layout({ signedIn, children }) {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/" aria-label="Shiftmate, მთავარი"><Logo className="text-[20px] sm:text-[24px]" /></Link>
          <nav className="hidden items-center gap-7 text-[15px] font-medium text-muted md:flex">
            {NAV.map(([to, text]) => <Link key={to} to={to} className="hover:text-ink">{text}</Link>)}
          </nav>
          <div className="flex items-center gap-2">
            {signedIn ? (
              <Link to="/" className="rounded-xl bg-brand px-4 py-2 text-[14px] font-semibold text-on-brand hover:bg-brand-dark">აპში გადასვლა</Link>
            ) : (
              <>
                <Link to="/login" className="rounded-xl px-3 py-2 text-[14px] font-semibold hover:bg-fill">შესვლა</Link>
                <Link to="/register" className="rounded-xl bg-brand px-4 py-2 text-[14px] font-semibold text-on-brand hover:bg-brand-dark">დაწყება</Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-line bg-bg">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
          <div>
            <Logo className="text-[20px]" />
            <p className="mt-2 max-w-xs text-[14px] text-muted">დამატებითი სამუშაო შენს თავისუფალ დროში.</p>
          </div>
          <nav className="grid grid-cols-2 gap-x-10 gap-y-2 text-[14px] text-muted">
            <Link to="/how" className="hover:text-ink">როგორ მუშაობს</Link>
            <Link to="/terms" className="hover:text-ink">წესები და პირობები</Link>
            <Link to="/about" className="hover:text-ink">ჩვენ შესახებ</Link>
            <Link to="/privacy" className="hover:text-ink">კონფიდენციალურობა</Link>
          </nav>
        </div>
        <p className="border-t border-line py-4 text-center text-[13px] text-quiet">© {new Date().getFullYear()} Shiftmate</p>
      </footer>
    </div>
  )
}

export function CalendarMock() {
  const days = ['ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ', 'კვი']
  const cells = [
    [['lesson', 'სამსახური']], [['lesson', 'ლექცია']], [['lesson', 'სამსახური']], [['lesson', 'ლექცია'], ['work', 'ბარისტა']], [['lesson', 'სამსახური']], [['work', 'ღონისძიება']], [['lesson', 'ოჯახი']],
  ]
  return (
    <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-line" aria-hidden="true">
      <div className="grid grid-cols-7 border-b border-line bg-bg">
        {days.map((d) => <span key={d} className="py-1.5 text-center text-[11px] text-muted">{d}</span>)}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((list, i) => (
          <div key={i} className="min-h-[86px] min-w-0 space-y-1 border-r border-line p-1 last:border-r-0">
            <span className={`ml-auto grid h-5 w-5 place-items-center rounded-md text-[11px] ${i === 4 ? 'bg-brand text-on-brand' : ''}`}>{16 + i}</span>
            {list.map(([tone, title]) => (
              <span key={title} className="flex items-center gap-1 text-[10px]"><i className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOTS[tone]}`} /><span className="truncate">{title}</span></span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

const SEEKER_STEPS = [
  ['calendar', 'ჩაწერე, როდის ხარ დაკავებული', 'სწავლა, ძირითადი სამსახური ან სხვა საქმე. ერთხელ ჩაწერ და ყოველ კვირა თავისით მეორდება.'],
  ['search', 'ნახე მხოლოდ შესაფერისი ვაკანსიები', 'სიაში რჩება ის ცვლები, რომლებიც შენს თავისუფალ დროში ჯდება: მუდმივი ან 1–2 დღიანი.'],
  ['send', 'გაგზავნე სივი ერთი დაჭერით', 'თუ აგიყვანენ, ცვლები თავისით ჩნდება შენს კალენდარში.'],
]
const EMPLOYER_STEPS = [
  ['plus', 'დაამატე ვაკანსია ცვლის საათებით', 'მონიშნე დღეები და საათები კალენდარზე, ან მიუთითე კონკრეტული თარიღი ერთჯერადი სამუშაოსთვის.'],
  ['inbox', 'მიიღე განაცხადები', 'გწერენ მხოლოდ ისინი, ვისაც შენი ცვლის დროს ნამდვილად სცალია. სივი და ტელეფონი ერთ ადგილას ჩანს.'],
  ['users', 'აიყვანე და დაგეგმე', 'ცვლების კალენდარში ჩანს, ვინ მუშაობს რომელ დღეს.'],
]

const Steps = ({ steps }) => (
  <ol className="space-y-4">
    {steps.map(([icon, title, text], i) => (
      <li key={title} className="flex gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand-deep"><Icon name={icon} className="h-5 w-5" /></span>
        <div>
          <p className="text-[16px] font-semibold">{i + 1}. {title}</p>
          <p className="text-[15px] text-muted">{text}</p>
        </div>
      </li>
    ))}
  </ol>
)

export function Home({ signedIn }) {
  usePageTitle('')
  const [jobs, setJobs] = useState([])
  useEffect(() => {
    supabase.from('jobs').select('id, title, company, district, pay, kind, shifts').eq('is_open', true).order('created_at', { ascending: false }).limit(30)
      // ვადაგასული ერთჯერადი სამუშაოები მთავარ გვერდზე არ ჩანს
      .then(({ data }) => setJobs((data ?? []).map((j) => ({ ...j, shifts: j.shifts.filter((s) => !s.date || s.date >= todayISO()) })).filter((j) => j.shifts.length).slice(0, 6)))
  }, [])

  return (
    <Layout signedIn={signedIn}>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:py-20">
        <div>
          <h1 className="text-[36px] font-semibold leading-[1.1] tracking-tight sm:text-[52px]">იმუშავე მაშინ, როცა თავისუფალი ხარ</h1>
          <p className="mt-4 max-w-md text-[17px] text-muted">სწავლობ, მუშაობ თუ სხვა საქმე გაქვს: ჩაწერე, როდის ხარ დაკავებული, და Shiftmate გაჩვენებს დამატებით სამუშაოს მხოლოდ შენს თავისუფალ დროში.</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link to="/register" className={`${btn} flex items-center justify-center gap-2 px-6 sm:w-auto`}><Icon name="search" className="h-5 w-5" />ვეძებ სამსახურს</Link>
            <Link to="/register?role=employer" className={`${btn2} flex items-center justify-center gap-2 px-6 sm:w-auto`}><Icon name="users" className="h-5 w-5" />ვეძებ თანამშრომლებს</Link>
          </div>
          <p className="mt-3 text-[13px] text-quiet">რეგისტრაცია უფასოა და ერთ წუთს გრძელდება.</p>
        </div>
        <div className="flex justify-center lg:justify-end lg:[&>div]:scale-110 lg:[&>div]:origin-right"><CalendarMock /></div>
      </section>

      <section className="border-y border-line bg-bg">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-12 sm:px-6 md:grid-cols-3">
          {[
            ['calendar', 'კალენდარი წყვეტს', 'ვაკანსიებს ვფილტრავთ შენი განრიგის მიხედვით. აღარ მოგიწევს კითხვა: „რა საათებშია?“'],
            ['bolt', 'მუდმივი ან 1–2 დღიანი', 'ყოველკვირეული ცვლები სტაბილური შემოსავლისთვის ან ერთჯერადი სამუშაო, როცა ახლავე გჭირდება.'],
            ['ai', 'AI ასისტენტი', 'მისწერე „ორშაბათს 10-დან 6-მდე სამსახურში ვარ“ და განრიგს თავად შეგივსებს, შემდეგ კი საუკეთესო ვაკანსიებს გირჩევს.'],
          ].map(([icon, title, text]) => (
            <div key={title} className={`${card} p-6`}>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-fill"><Icon name={icon} className="h-6 w-6" /></span>
              <h2 className="mt-4 text-[18px] font-semibold">{title}</h2>
              <p className="mt-1 text-[15px] text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-[28px] font-semibold tracking-tight sm:text-[34px]">როგორ მუშაობს</h2>
        <div className="mt-8 grid gap-10 md:grid-cols-2">
          <div>
            <p className="mb-4 text-[13px] font-semibold uppercase tracking-wide text-quiet">თუ სამსახურს ეძებ</p>
            <Steps steps={SEEKER_STEPS} />
          </div>
          <div>
            <p className="mb-4 text-[13px] font-semibold uppercase tracking-wide text-quiet">თუ თანამშრომელს ეძებ</p>
            <Steps steps={EMPLOYER_STEPS} />
          </div>
        </div>
        <Link to="/how" className="mt-8 inline-block text-[15px] font-semibold underline underline-offset-4">დეტალურად და ხშირი კითხვები</Link>
      </section>

      {jobs.length > 0 && (
        <section className="border-t border-line bg-bg">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-[28px] font-semibold tracking-tight sm:text-[34px]">ბოლოს დამატებული ვაკანსიები</h2>
            <ul className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <li key={job.id}>
                  <Link to="/register" className={`${card} flex h-full items-start gap-3 p-4 transition hover:border-ink/30`}>
                    <CompanyLogo name={job.company} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-[16px] font-semibold">{job.title}</span>
                        <span className="shrink-0 text-[15px] font-semibold">{Number(job.pay)} ₾<span className="text-[12px] font-medium text-muted">/სთ</span></span>
                      </span>
                      <span className="block truncate text-[14px] text-muted">{job.company} · {job.district}</span>
                      <span className="mt-2 flex flex-wrap gap-1.5">
                        <Badge tone={job.kind === 'gig' ? 'amber' : 'sky'}>{job.kind === 'gig' ? '1–2 დღიანი' : 'მუდმივი'}</Badge>
                        <Badge>{formatShift(job.shifts[0])}{job.shifts.length > 1 ? ` +${job.shifts.length - 1}` : ''}</Badge>
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-14 text-center sm:px-6">
        <h2 className="text-[28px] font-semibold tracking-tight sm:text-[34px]">დაიწყე დღესვე</h2>
        <p className="mx-auto mt-2 max-w-md text-[16px] text-muted">შეავსე განრიგი ერთხელ და შესაფერისი სამუშაო თავად გიპოვის.</p>
        <Link to="/register" className={`${btn} mt-6 inline-block px-8 sm:w-auto`}>ანგარიშის შექმნა</Link>
      </section>
    </Layout>
  )
}

const FAQ = [
  ['Shiftmate ფასიანია?', 'ამჟამად რეგისტრაცია, ვაკანსიის განთავსება და განაცხადის გაგზავნა უფასოა. თუ ეს შეიცვლება, წინასწარ შეგატყობინებთ.'],
  ['როგორ ირჩევა, რომელი ვაკანსია „მერგება“?', 'ცვლა გერგება, თუ მისი არცერთი საათი არ ემთხვევა იმ დროს, რომელიც განრიგში დაკავებულად გაქვს ჩაწერილი, და არც უკვე მიღებულ სამუშაოს.'],
  ['ვინ შეიძლება დარეგისტრირდეს?', 'ნებისმიერი სრულწლოვანი ადამიანი, ვისაც დამატებითი სამუშაო უნდა: სტუდენტი, დასაქმებული თუ სხვა. ასევე ნებისმიერი კომპანია ან ინდივიდუალური მეწარმე, ვინც თანამშრომელს ეძებს.'],
  ['როგორ ვიღებ ანაზღაურებას?', 'ანაზღაურებაზე პირდაპირ დამსაქმებელს უთანხმდები. Shiftmate ამჟამად გადახდებს არ ამუშავებს და თანხას არ ინახავს.'],
  ['ვინ ხედავს ჩემს სივს და ტელეფონს?', 'მხოლოდ ის დამსაქმებლები, რომელთა ვაკანსიაზეც განაცხადი გააგზავნე. სხვა მომხმარებლები შენს მონაცემებს ვერ ხედავენ.'],
  ['რას აკეთებს AI ასისტენტი?', 'გირჩევს ვაკანსიებს შენი თავისუფალი დროის მიხედვით და შეუძლია განრიგში დაკავებული დრო ჩაგიწეროს. ნებისმიერ ცვლილებას ჯერ შენ ადასტურებ.'],
  ['შემიძლია ტელეფონზე აპად დაყენება?', 'კი. პროფილის გვერდზე დააჭირე „ტელეფონზე აპად დაყენება“-ს და მიჰყევი ინსტრუქციას.'],
  ['როგორ წავშალო ანგარიში?', 'პროფილის გვერდის ბოლოში არის „ანგარიშის წაშლა“. ანგარიშთან ერთად იშლება შენი განრიგი, სივი, განაცხადები და ვაკანსიები.'],
]

export function How({ signedIn }) {
  usePageTitle('როგორ მუშაობს')
  return (
    <Layout signedIn={signedIn}>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-[34px] font-semibold tracking-tight sm:text-[42px]">როგორ მუშაობს</h1>
        <p className="mt-3 text-[17px] text-muted">Shiftmate აკავშირებს ადამიანებს, ვისაც დამატებითი სამუშაო უნდა, და დამსაქმებლებს, ვისაც კონკრეტულ საათებში სჭირდებათ თანამშრომელი.</p>

        <h2 className="mb-4 mt-10 text-[22px] font-semibold">თუ სამსახურს ეძებ</h2>
        <Steps steps={SEEKER_STEPS} />
        <h2 className="mb-4 mt-10 text-[22px] font-semibold">თუ თანამშრომელს ეძებ</h2>
        <Steps steps={EMPLOYER_STEPS} />

        <h2 className="mb-4 mt-12 text-[26px] font-semibold tracking-tight">ხშირი კითხვები</h2>
        <div className="divide-y divide-line rounded-2xl border border-line">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[16px] font-semibold [&::-webkit-details-marker]:hidden">
                {q}
                <Icon name="chevron" className="h-5 w-5 shrink-0 text-quiet transition group-open:rotate-90" />
              </summary>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{a}</p>
            </details>
          ))}
        </div>
        {!signedIn && <Link to="/register" className={`${btn} mt-10 inline-block px-8 text-center sm:w-auto`}>ანგარიშის შექმნა</Link>}
      </div>
    </Layout>
  )
}

function Contact() {
  if (!CONTACT_EMAIL) return null
  return (
    <>
      <h2>კონტაქტი</h2>
      <p>კითხვების, შენიშვნების ან პრობლემის შემთხვევაში მოგვწერე: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
    </>
  )
}

// გრძელი ტექსტის გვერდი (ჩვენ შესახებ, წესები, კონფიდენციალურობა)
function Article({ signedIn, title, updated, children }) {
  usePageTitle(title)
  return (
    <Layout signedIn={signedIn}>
      <article className="mx-auto max-w-3xl px-4 py-12 text-[16px] leading-relaxed sm:px-6 [&_a]:font-semibold [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mb-2 [&_h2]:mt-8 [&_h2]:text-[20px] [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_p]:mt-2 [&_p]:text-muted [&_ul]:mt-2 [&_ul]:space-y-1 [&_ul]:text-muted">
        <h1 className="text-[34px] font-semibold leading-tight tracking-tight sm:text-[42px]">{title}</h1>
        {updated && <p className="!mt-2 text-[14px] !text-quiet">ბოლო განახლება: {updated}</p>}
        {children}
      </article>
    </Layout>
  )
}

export function About({ signedIn }) {
  return (
    <Article signedIn={signedIn} title="ჩვენ შესახებ">
      <p>ბევრ ადამიანს უნდა დამატებითი შემოსავალი, მაგრამ სწავლას, ძირითად სამსახურს ან ოჯახს ვერ გადადებს. ვაკანსიების უმეტესობაში კი არ წერია, რომელ დღეებსა და საათებშია სამუშაო, ამიტომ შესაფერისის პოვნა დროის კარგვად იქცევა.</p>
      <p>Shiftmate ამ პრობლემას კალენდრით წყვეტს: შენ წერ, როდის ხარ დაკავებული, დამსაქმებელი წერს, როდის სჭირდება ადამიანი, და პლატფორმა მხოლოდ იმ ვაკანსიებს გაჩვენებს, რომლებიც შენს თავისუფალ დროში ჯდება.</p>
      <h2>რისი გვჯერა</h2>
      <ul>
        <li>სამუშაო უნდა ერგებოდეს ადამიანის ცხოვრებას და არა პირიქით.</li>
        <li>ვაკანსიაში დღეები და საათები ისეთივე მნიშვნელოვანია, როგორც ანაზღაურება.</li>
        <li>შენი მონაცემები შენია: სივს მხოლოდ ის დამსაქმებელი ხედავს, ვისაც თავად უგზავნი.</li>
      </ul>
      <p>Shiftmate თბილისში შეიქმნა და ახლა საწყის ეტაპზეა. შენი აზრი პროდუქტს უკეთესს გახდის.</p>
      <Contact />
    </Article>
  )
}

export function Terms({ signedIn }) {
  return (
    <Article signedIn={signedIn} title="წესები და პირობები" updated="14 ნოემბერი 2026">
      <p>Shiftmate-ის გამოყენებით ეთანხმები ამ წესებს. თუ არ ეთანხმები, გთხოვთ, პლატფორმა არ გამოიყენო.</p>
      <h2>1. რა არის Shiftmate</h2>
      <p>Shiftmate არის ონლაინ პლატფორმა, სადაც დამსაქმებლები აქვეყნებენ ვაკანსიებს ცვლის დღეებითა და საათებით, ხოლო სამუშაოს მაძიებლები პოულობენ მათ თავისუფალ დროზე მორგებულ სამუშაოს. Shiftmate არ არის დამსაქმებელი, დასაქმების სააგენტო ან შრომითი ხელშეკრულების მხარე.</p>
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
        <li>განაცხადის გაგზავნით მაძიებელი თანახმაა, რომ ამ ვაკანსიის დამსაქმებელმა ნახოს მისი სახელი, სივი, წერილი და ტელეფონის ნომერი.</li>
        <li>დამსაქმებელი კანდიდატის მონაცემებს მხოლოდ დასაქმების მიზნით იყენებს.</li>
      </ul>
      <h2>4. შრომითი ურთიერთობა და ანაზღაურება</h2>
      <p>სამუშაო პირობებზე, ხელშეკრულებასა და ანაზღაურებაზე მხარეები პირდაპირ თანხმდებიან. Shiftmate ამჟამად გადახდებს არ ამუშავებს, თანხას არ ინახავს და მხარეებს შორის ანგარიშსწორებაზე პასუხს არ აგებს. გადასახადებსა და კანონმდებლობის დაცვაზე პასუხისმგებელია თითოეული მხარე.</p>
      <h2>5. AI ასისტენტი</h2>
      <p>ასისტენტის რეკომენდაციები ავტომატურად გენერირდება და შეიძლება შეიცავდეს უზუსტობას. გადაწყვეტილებას ყოველთვის შენ იღებ, ვაკანსიის დეტალები კი მის გვერდზე გადაამოწმე.</p>
      <h2>6. რა არ შეიძლება</h2>
      <ul>
        <li>სხვისი სახელით რეგისტრაცია ან ყალბი ინფორმაციის განთავსება.</li>
        <li>სხვა მომხმარებლების მონაცემების შეგროვება ან არამიზნობრივი გამოყენება.</li>
        <li>პლატფორმის მუშაობის ხელის შეშლა ან უსაფრთხოების გვერდის ავლა.</li>
      </ul>
      <p>წესების დარღვევისას შეგვიძლია ვაკანსია წავშალოთ ან ანგარიში შევზღუდოთ.</p>
      <h2>7. პასუხისმგებლობის შეზღუდვა</h2>
      <p>პლატფორმა მოწოდებულია „როგორც არის“. ჩვენ არ ვამოწმებთ თითოეულ მომხმარებელსა და ვაკანსიას და არ ვიძლევით გარანტიას, რომ სამუშაოს იპოვი ან თანამშრომელს აიყვან. კანონით დაშვებულ ფარგლებში, Shiftmate არ აგებს პასუხს მომხმარებლებს შორის წარმოშობილ დავებსა და ზიანზე.</p>
      <h2>8. ანგარიშის გაუქმება</h2>
      <p>ანგარიშის წაშლა ნებისმიერ დროს შეგიძლია პროფილის გვერდიდან.</p>
      <h2>9. ცვლილებები და სამართალი</h2>
      <p>წესები შეიძლება განახლდეს. მნიშვნელოვან ცვლილებას საიტზე გამოვაქვეყნებთ. წესებზე ვრცელდება საქართველოს კანონმდებლობა.</p>
      <Contact />
    </Article>
  )
}

export function Privacy({ signedIn }) {
  return (
    <Article signedIn={signedIn} title="კონფიდენციალურობის პოლიტიკა" updated="14 ნოემბერი 2026">
      <p>აქ აღწერილია, რა მონაცემებს ვაგროვებთ, რისთვის ვიყენებთ და როგორ შეგიძლია მათი მართვა.</p>
      <h2>1. რა მონაცემებს ვაგროვებთ</h2>
      <ul>
        <li><b>ანგარიში:</b> სახელი და გვარი, ელფოსტა, როლი (მაძიებელი ან დამსაქმებელი), კომპანიის სახელი.</li>
        <li><b>სივი:</b> გამოცდილება, უნარები, ენები და, სურვილის შემთხვევაში, PDF ფაილი.</li>
        <li><b>განრიგი:</b> დრო, რომელსაც დაკავებულად ჩაწერ, და მისი სახელწოდება.</li>
        <li><b>განაცხადები:</b> რომელ ვაკანსიაზე გააგზავნე, წერილი და ტელეფონის ნომერი.</li>
        <li><b>ვაკანსიები:</b> დამსაქმებლის მიერ გამოქვეყნებული ინფორმაცია.</li>
        <li><b>ასისტენტთან მიმოწერა:</b> შენი შეტყობინებები და კვირის თავისუფალი საათები პასუხის მოსამზადებლად.</li>
      </ul>
      <h2>2. რისთვის ვიყენებთ</h2>
      <ul>
        <li>ანგარიშის შესაქმნელად და შესასვლელად.</li>
        <li>ვაკანსიების შენს თავისუფალ დროზე მოსარგებად.</li>
        <li>შენი განაცხადის დამსაქმებლისთვის გადასაცემად.</li>
        <li>პლატფორმის უსაფრთხოებისა და გამართული მუშაობისთვის.</li>
      </ul>
      <p>მონაცემებს არ ვყიდით და სარეკლამო მიზნით მესამე პირებს არ გადავცემთ.</p>
      <h2>3. ვინ ხედავს შენს მონაცემებს</h2>
      <ul>
        <li>სივს, წერილსა და ტელეფონს ხედავს მხოლოდ იმ ვაკანსიის დამსაქმებელი, რომელზეც განაცხადი გააგზავნე.</li>
        <li>განრიგს მხოლოდ შენ ხედავ. დამსაქმებელი ხედავს მხოლოდ იმას, რომ მის ცვლაზე აყვანილი ხარ.</li>
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
      <p>შენს მოწყობილობაზე ვინახავთ მხოლოდ შესვლის სესიას და მცირე პარამეტრებს (მაგალითად, ნანახი გაქვს თუ არა გზამკვლევი). სარეკლამო ან თვალთვალის ქუქიებს არ ვიყენებთ.</p>
      <h2>6. რამდენ ხანს ვინახავთ</h2>
      <p>მონაცემები ინახება, სანამ ანგარიში აქტიურია. ანგარიშის წაშლისას იშლება პროფილი, სივი, განრიგი, განაცხადები და შენი ვაკანსიები.</p>
      <h2>7. შენი უფლებები</h2>
      <ul>
        <li>მონაცემების ნახვა და შესწორება პროფილის გვერდზე.</li>
        <li>ანგარიშისა და მონაცემების წაშლა პროფილის გვერდიდან.</li>
        <li>მონაცემთა დამუშავებაზე ინფორმაციის მოთხოვნა და საჩივრის წარდგენა პერსონალურ მონაცემთა დაცვის სამსახურში.</li>
      </ul>
      <h2>8. ცვლილებები</h2>
      <p>პოლიტიკა შეიძლება განახლდეს. მნიშვნელოვან ცვლილებას საიტზე გამოვაქვეყნებთ.</p>
      <Contact />
    </Article>
  )
}

export function NotFound({ signedIn }) {
  usePageTitle('გვერდი ვერ მოიძებნა')
  return (
    <Layout signedIn={signedIn}>
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <p className="text-[72px] font-semibold leading-none tracking-tight">404</p>
        <h1 className="mt-4 text-[22px] font-semibold">გვერდი ვერ მოიძებნა</h1>
        <p className="mt-2 text-[15px] text-muted">ბმული შეიძლება მოძველდა ან არასწორად აიკრიფა.</p>
        <Link to="/" className={`${btn} mt-6 inline-block px-8 sm:w-auto`}>მთავარ გვერდზე</Link>
      </div>
    </Layout>
  )
}
