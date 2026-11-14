import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { navigate } from '../lib/router.jsx'
import InstallRow from './InstallRow.jsx'
import { Sheet, btn2 } from './ui.jsx'

// პროფილის ბოლო ბლოკი: აპად დაყენება, წესები, გასვლა და ანგარიშის წაშლა
export default function AccountActions({ profile }) {
  const [sheet, setSheet] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/', { replace: true })
  }
  async function remove() {
    setBusy(true)
    setError('')
    if (profile.cv_path) await supabase.storage.from('cvs').remove([profile.cv_path])
    const { error } = await supabase.rpc('delete_my_account')
    if (error) {
      setBusy(false)
      return setError('ვერ წაიშალა. სცადე თავიდან.')
    }
    await supabase.auth.signOut({ scope: 'local' })
    navigate('/', { replace: true })
  }

  return (
    <div className="space-y-3">
      <InstallRow />
      <p className="flex justify-center gap-5 text-[13px] text-muted">
        <a href="/terms" target="_blank" rel="noreferrer" className="hover:text-ink">წესები</a>
        <a href="/privacy" target="_blank" rel="noreferrer" className="hover:text-ink">კონფიდენციალურობა</a>
        <a href="/how" target="_blank" rel="noreferrer" className="hover:text-ink">დახმარება</a>
      </p>
      <button onClick={signOut} className={btn2}>გასვლა</button>
      <button onClick={() => setSheet(true)} className="w-full py-1 text-[14px] font-medium text-coral">ანგარიშის წაშლა</button>
      {sheet && (
        <Sheet onClose={busy ? undefined : () => setSheet(false)}>
          <h2 className="text-[22px] font-semibold">წავშალოთ ანგარიში?</h2>
          <p className="mt-1 text-[15px] text-muted">
            სამუდამოდ წაიშლება პროფილი{profile.role === 'employer' ? ', შენი ვაკანსიები და მათზე შემოსული განაცხადები' : ', სივი, განრიგი და განაცხადები'}. ამის დაბრუნება ვეღარ მოხერხდება.
          </p>
          {error && <p className="mt-2 text-[14px] font-medium text-coral">{error}</p>}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button disabled={busy} onClick={() => setSheet(false)} className={btn2}>გაუქმება</button>
            <button disabled={busy} onClick={remove} className="w-full rounded-xl bg-coral py-3 text-[15px] font-semibold text-white disabled:opacity-50">{busy ? 'იშლება…' : 'წაშლა'}</button>
          </div>
        </Sheet>
      )}
    </div>
  )
}
