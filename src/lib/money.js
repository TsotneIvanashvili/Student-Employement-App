// სადემონსტრაციო გადახდები: რეალური ფული არ მოძრაობს. ყველა თანხა სერვერზე ითვლება
// (hire, pay_period, finish_job, demo_topup, demo_withdraw); აქ მხოლოდ ჩვენება და შეცდომის ტექსტებია.
import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'
import { tr } from './i18n.js'

export const FEE = 0.1
export const lari = (n) => `${Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })} ₾`

// ბალანსი ყველგან ერთდროულად ახლდება: ყოველი ოპერაციის შემდეგ refreshMoney()
export const refreshMoney = () => window.dispatchEvent(new Event('sm-money'))
export function useBalance() {
  const [balance, setBalance] = useState(null)
  useEffect(() => {
    const load = () => supabase.rpc('my_balance').then(({ data }) => setBalance(Number(data ?? 0)))
    load()
    window.addEventListener('sm-money', load)
    return () => window.removeEventListener('sm-money', load)
  }, [])
  return balance
}

export function moneyError(error) {
  const m = error?.message ?? ''
  if (m.includes('insufficient balance')) return tr('ბალანსზე საკმარისი თანხა არ არის. ჯერ შეავსე ბალანსი.', 'Not enough balance. Top up first.')
  if (m.includes('monthly amount') || m.includes('invalid amount')) return tr('მიუთითე სამუშაოს რაოდენობა.', 'Enter the amount of work.')
  if (m.includes('limit')) return tr('სადემონსტრაციო ბალანსის ზღვარი 50 000 ₾-ია.', 'The demo balance limit is 50,000 ₾.')
  return tr('ვერ შესრულდა. სცადე თავიდან.', 'Could not complete. Try again.')
}

export const kindText = (k) =>
  ({
    topup: tr('ბალანსის შევსება', 'Top-up'),
    deposit: tr('დეპოზიტი', 'Deposit'),
    refund: tr('დეპოზიტის ნაშთი დაბრუნდა', 'Deposit returned'),
    earning: tr('ანაზღაურება', 'Earnings'),
    fee: tr('საათოს საკომისიო', 'Saato fee'),
    withdraw: tr('ბარათზე გატანა', 'Withdrawal'),
  })[k]

// ერთეული: საათი ან დღე
export const unitWord = (unit, n = 2) => (unit === 'day' ? tr('დღე', n === 1 ? 'day' : 'days') : tr('საათი', n === 1 ? 'hour' : 'hours'))
