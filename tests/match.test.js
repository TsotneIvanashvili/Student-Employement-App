import { test } from 'node:test'
import assert from 'node:assert/strict'
import { shiftFits, matchJobs, slotKey, formatShift, dayOf } from '../src/lib/match.js'

const job = (id, pay, shifts) => ({ id, pay, shifts })
const freeHours = (day, from, to) => Array.from({ length: to - from }, (_, i) => slotKey(day, from + i))

test('shift fits when every hour of it is free', () => {
  const free = new Set(freeHours(0, 10, 14))
  assert.equal(shiftFits({ day: 0, start: 11, end: 14 }, free), true)
})

test('shift does not fit when one hour inside it is not free', () => {
  const free = new Set([...freeHours(0, 11, 12), ...freeHours(0, 13, 14)])
  assert.equal(shiftFits({ day: 0, start: 11, end: 14 }, free), false)
})

test('end hour is exclusive', () => {
  const free = new Set(freeHours(0, 11, 14))
  assert.equal(shiftFits({ day: 0, start: 11, end: 14 }, free), true)
})

test('free hours on another day do not count', () => {
  const free = new Set(freeHours(1, 11, 14))
  assert.equal(shiftFits({ day: 0, start: 11, end: 14 }, free), false)
})

test('dated shift uses its weekday (2026-11-21 is Saturday)', () => {
  assert.equal(dayOf({ date: '2026-11-21', start: 10, end: 12 }), 5)
  const free = new Set(freeHours(5, 10, 12))
  assert.equal(shiftFits({ date: '2026-11-21', start: 10, end: 12 }, free), true)
})

test('matchJobs drops past dated shifts, jobs with no fitting shift, and sorts by fit then pay', () => {
  const free = new Set([...freeHours(1, 9, 12), ...freeHours(2, 9, 12), ...freeHours(3, 9, 12), ...freeHours(4, 9, 12), ...freeHours(5, 9, 12)])
  const jobs = [
    job('blocked', 20, [{ day: 0, start: 9, end: 12 }]),
    job('oneFitCheap', 5, [{ day: 1, start: 9, end: 12 }]),
    job('oneFitRich', 9, [{ day: 2, start: 9, end: 12 }]),
    job('twoFits', 6, [{ day: 3, start: 9, end: 12 }, { day: 4, start: 9, end: 12 }]),
    job('pastGig', 50, [{ date: '2026-11-07', start: 9, end: 12 }]),
  ]
  const ids = matchJobs(jobs, free, '2026-11-12').map((m) => m.job.id)
  assert.deepEqual(ids, ['twoFits', 'oneFitRich', 'oneFitCheap'])
})

test('formatShift prints weekly and dated shifts', () => {
  assert.equal(formatShift({ day: 0, start: 9, end: 13 }), 'ორშ 09:00–13:00')
  assert.equal(formatShift({ day: 6, start: 18, end: 22 }, 'en'), 'Sun 18:00–22:00')
  assert.equal(formatShift({ date: '2026-11-21', start: 10, end: 18 }), '21 ნოე (შაბ) 10:00–18:00')
})

import { splitJobRefs } from '../src/lib/prompt.js'

test('splitJobRefs hides the JOBS line and returns id prefixes', () => {
  const r = splitJobRefs('ბარისტა გირჩევ.\nJOBS: 3f9a1c2e, b71d04aa')
  assert.equal(r.text, 'ბარისტა გირჩევ.')
  assert.deepEqual(r.refs, ['3f9a1c2e', 'b71d04aa'])
  assert.deepEqual(splitJobRefs('უბრალო ტექსტი'), { text: 'უბრალო ტექსტი', refs: [] })
})

import { splitReply } from '../src/lib/prompt.js'

test('splitReply extracts valid LESSON lines and hides them', () => {
  const r = splitReply('დავამატებ, დაადასტურე ქვემოთ.\nLESSON: {"title":"ლექცია","weekday":0,"date":null,"start":"17:00","end":"20:00"}\nLESSON: {"weekday":0,"date":"2026-11-20","start":"10:00","end":"12:00"}')
  assert.equal(r.text, 'დავამატებ, დაადასტურე ქვემოთ.')
  assert.deepEqual(r.lessons, [{ title: 'ლექცია', type: 'lecture', weekday: 0, date: null, start_min: 1020, end_min: 1200 }])
  const work = splitReply('LESSON: {"title":"სამსახური","type":"work","weekday":1,"date":null,"start":"10:00","end":"18:00"}').lessons[0]
  assert.equal(work.type, 'work')
  assert.equal(splitReply('LESSON: {"type":"hack","weekday":1,"date":null,"start":"10:00","end":"18:00"}').lessons[0].type, 'lecture')
  assert.equal(splitReply('კარგი\nLESS').text, 'კარგი')
  assert.equal(splitReply('LESSON: {"weekday":1,"date":null,"start":"20:00","end":"18:00"}').lessons.length, 0)
})
