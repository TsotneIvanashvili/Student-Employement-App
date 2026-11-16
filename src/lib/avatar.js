// პროფილის ფოტო: ბრაუზერში მცირდება (400×400 JPEG) და Supabase-ის avatars საქაღალდეში იტვირთება.
import { supabase } from './supabase.js'

export function shrinkImage(file, size = 400) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const s = Math.min(img.width, img.height)
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = size
      canvas.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size)
      URL.revokeObjectURL(img.src)
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('resize failed'))), 'image/jpeg', 0.85)
    }
    img.onerror = () => reject(new Error('not an image'))
    img.src = URL.createObjectURL(file)
  })
}

export async function saveAvatar(profileId, blob, oldUrl) {
  const path = `${profileId}/${Date.now()}.jpg`
  const { error } = await supabase.storage.from('avatars').upload(path, blob, { contentType: 'image/jpeg' })
  if (error) throw error
  const url = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
  const { error: e2 } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', profileId)
  if (e2) throw e2
  const old = oldUrl?.split('/avatars/')[1]
  if (old) supabase.storage.from('avatars').remove([old])
  return url
}

// რეგისტრაციისას არჩეული ფოტო ინახება ამ მოწყობილობაზე, სანამ ელფოსტას დაადასტურებს და პირველად შევა
const key = (email) => `sm_avatar_${email.toLowerCase()}`
export const blobToDataUrl = (blob) =>
  new Promise((resolve) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.readAsDataURL(blob)
  })
export function keepPendingAvatar(email, dataUrl) {
  try {
    localStorage.setItem(key(email), dataUrl)
  } catch {}
}
export async function uploadPendingAvatar(profile, email) {
  let dataUrl = null
  try {
    dataUrl = localStorage.getItem(key(email))
  } catch {}
  if (!dataUrl || profile.avatar_url) return null
  const blob = await (await fetch(dataUrl)).blob()
  const url = await saveAvatar(profile.id, blob)
  try {
    localStorage.removeItem(key(email))
  } catch {}
  return url
}
