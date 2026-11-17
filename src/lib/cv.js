// სივიდან პროფილის შევსება: PDF-ის ტექსტი ბრაუზერში ამოიღება (pdf.js), შემდეგ /api/cv მას ველებად აქცევს.
// არაფერი ინახება ავტომატურად: მომხმარებელი ჯერ ხედავს და ასწორებს.
import { supabase } from './supabase.js'

async function pdfText(data) {
  const pdfjs = await import('pdfjs-dist')
  const { default: worker } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = worker
  const doc = await pdfjs.getDocument({ data, isEvalSupported: false }).promise
  let text = ''
  for (let i = 1; i <= Math.min(doc.numPages, 4); i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    text += content.items.map((it) => it.str + (it.hasEOL ? '\n' : ' ')).join('') + '\n'
  }
  return text.replace(/[ \t]+/g, ' ').trim().slice(0, 12000)
}

// file: ახლად არჩეული PDF; ან path: უკვე ატვირთული სივი (cvs საცავში)
export async function readCv({ file, path }) {
  let bytes
  if (file) bytes = new Uint8Array(await file.arrayBuffer())
  else {
    const { data, error } = await supabase.storage.from('cvs').download(path)
    if (error) throw error
    bytes = new Uint8Array(await data.arrayBuffer())
  }
  const text = await pdfText(bytes)
  if (text.length < 40) throw new Error('empty')
  const { data: session } = await supabase.auth.getSession()
  const res = await fetch('/api/cv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.session?.access_token ?? ''}` },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) throw new Error(String(res.status))
  return res.json()
}
