import { useState } from 'react'

const field = 'w-full rounded-xl border border-line bg-white px-4 py-3 outline-none focus:border-accent'

export default function Register({ onDone }) {
  const [form, setForm] = useState({ name: '', email: '', university: '', year: '1', hours: '15' })
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  function submit(e) {
    e.preventDefault()
    onDone({ ...form, hours: Number(form.hours) })
  }

  return (
    <div className="min-h-screen grid place-items-center bg-mist px-4 py-10">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-line bg-paper p-8 shadow-sm space-y-5">
        <div>
          <p className="text-sm font-semibold text-accent">დემო</p>
          <h1 className="mt-1 text-3xl font-bold">შექმენი ანგარიში</h1>
          <p className="mt-2 text-muted">ორ წუთში გაჩვენებთ ცვლებს, რომლებიც შენს ლექციებს არ ეჯახება.</p>
        </div>

        <label className="block space-y-1">
          <span className="text-sm font-semibold">სახელი</span>
          <input required className={field} value={form.name} onChange={set('name')} placeholder="მაგ. ნინო" />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-semibold">ელფოსტა</span>
          <input required type="email" className={field} value={form.email} onChange={set('email')} placeholder="nino@example.com" />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-semibold">უნივერსიტეტი</span>
          <input required className={field} value={form.university} onChange={set('university')} placeholder="მაგ. თსუ" />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block space-y-1">
            <span className="text-sm font-semibold">კურსი</span>
            <select className={field} value={form.year} onChange={set('year')}>
              {[1, 2, 3, 4].map((y) => <option key={y} value={y}>{y} კურსი</option>)}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold">საათი კვირაში</span>
            <input required type="number" min="2" max="40" className={field} value={form.hours} onChange={set('hours')} />
          </label>
        </div>

        <button className="w-full rounded-xl bg-accent py-3 font-semibold text-white hover:opacity-90">
          რეგისტრაცია
        </button>
        <p className="text-center text-xs text-quiet">მონაცემები მხოლოდ შენს ბრაუზერში ინახება.</p>
      </form>
    </div>
  )
}
