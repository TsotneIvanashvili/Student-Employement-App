import { useState } from 'react'

const TEST_USER = { name: 'ნინო ბერიძე', email: 'nino.test@example.com', university: 'თსუ', year: '2', hours: '15' }
const field = 'w-full rounded-2xl border border-line bg-white px-4 py-3.5 text-base outline-none focus:border-brand'

export default function Register({ onDone }) {
  const [form, setForm] = useState({ name: '', email: '', university: '', year: '1', hours: '15' })
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  function submit(e) {
    e.preventDefault()
    onDone({ ...form, hours: Number(form.hours) })
  }

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-bg px-5 pb-10 pt-12">
      <div className="mb-8">
        <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-brand text-xl font-bold text-white">ც</div>
        <h1 className="text-3xl font-bold leading-tight">სამსახური, რომელიც ლექციებს არ ეჯახება</h1>
        <p className="mt-3 text-muted">დარეგისტრირდი და გაჩვენებთ მხოლოდ შენს თავისუფალ საათებზე მორგებულ ცვლებს.</p>
      </div>

      <button
        type="button"
        onClick={() => setForm(TEST_USER)}
        className="mb-6 w-full rounded-2xl border-2 border-dashed border-brand/40 bg-brand-soft py-3.5 font-semibold text-brand active:scale-[0.99]"
      >
        სატესტო მონაცემების ჩასმა
      </button>

      <form onSubmit={submit} className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold">სახელი</span>
          <input required className={field} value={form.name} onChange={set('name')} placeholder="მაგ. ნინო" />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold">ელფოსტა</span>
          <input required type="email" inputMode="email" className={field} value={form.email} onChange={set('email')} placeholder="nino@example.com" />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold">უნივერსიტეტი</span>
          <input required className={field} value={form.university} onChange={set('university')} placeholder="მაგ. თსუ" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">კურსი</span>
            <select className={field} value={form.year} onChange={set('year')}>
              {[1, 2, 3, 4].map((y) => <option key={y} value={y}>{y} კურსი</option>)}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">საათი/კვირა</span>
            <input required type="number" inputMode="numeric" min="2" max="40" className={field} value={form.hours} onChange={set('hours')} />
          </label>
        </div>

        <button className="mt-2 w-full rounded-2xl bg-brand py-4 text-base font-semibold text-white shadow-lg shadow-brand/25 active:scale-[0.99]">
          რეგისტრაცია
        </button>
        <p className="text-center text-xs text-quiet">დემო: მონაცემები მხოლოდ შენს ბრაუზერში ინახება.</p>
      </form>
    </div>
  )
}
