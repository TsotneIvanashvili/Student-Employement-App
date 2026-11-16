// შეფასებები: საშუალო ვარსკვლავი და რაოდენობა (view public.ratings). ერთხელ ჩატვირთული რჩება მეხსიერებაში.
import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'

const cache = new Map() // ratee_id -> { avg, count } | null

export function useRatings(ids) {
  const key = [...new Set(ids.filter(Boolean))].sort().join(',')
  const [, bump] = useState(0)
  useEffect(() => {
    const missing = key.split(',').filter((id) => id && !cache.has(id))
    if (!missing.length) return
    missing.forEach((id) => cache.set(id, null))
    supabase
      .from('ratings')
      .select('*')
      .in('ratee_id', missing)
      .then(({ data }) => {
        ;(data ?? []).forEach((r) => cache.set(r.ratee_id, { avg: Number(r.avg), count: r.count }))
        bump((n) => n + 1)
      })
  }, [key])
  return (id) => cache.get(id) ?? null
}

// ახალი შეფასების შემდეგ ხელახლა ჩაიტვირთოს
export const forgetRating = (id) => cache.delete(id)
