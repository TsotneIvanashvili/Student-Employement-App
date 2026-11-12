import { test } from 'node:test'
import assert from 'node:assert/strict'
import { shiftFits, matchJobs, slotKey, formatShift } from '../src/lib/match.js'

const job = (id, pay, shifts) => ({ id, pay, shifts })

test('shift fits when no busy hour overlaps it', () => {
  const busy = new Set([slotKey(0, 9), slotKey(0, 10)])
  assert.equal(shiftFits({ day: 0, start: 11, end: 14 }, busy), true)
})

test('shift does not fit when one hour inside it is busy', () => {
  const busy = new Set([slotKey(0, 12)])
  assert.equal(shiftFits({ day: 0, start: 11, end: 14 }, busy), false)
})

test('end hour is exclusive: lecture starting when shift ends is fine', () => {
  const busy = new Set([slotKey(0, 14)])
  assert.equal(shiftFits({ day: 0, start: 11, end: 14 }, busy), true)
})

test('same hour on another day does not block', () => {
  const busy = new Set([slotKey(1, 12)])
  assert.equal(shiftFits({ day: 0, start: 11, end: 14 }, busy), true)
})

test('matchJobs drops jobs with no fitting shift and sorts by fit then pay', () => {
  const busy = new Set([slotKey(0, 10)])
  const jobs = [
    job('blocked', 20, [{ day: 0, start: 9, end: 12 }]),
    job('oneFitCheap', 5, [{ day: 1, start: 9, end: 12 }]),
    job('oneFitRich', 9, [{ day: 2, start: 9, end: 12 }]),
    job('twoFits', 6, [{ day: 3, start: 9, end: 12 }, { day: 4, start: 9, end: 12 }]),
  ]
  const ids = matchJobs(jobs, busy).map((m) => m.job.id)
  assert.deepEqual(ids, ['twoFits', 'oneFitRich', 'oneFitCheap'])
})

test('formatShift prints Georgian and English day names', () => {
  assert.equal(formatShift({ day: 0, start: 9, end: 13 }), 'ორშ 09:00–13:00')
  assert.equal(formatShift({ day: 6, start: 18, end: 22 }, 'en'), 'Sun 18:00–22:00')
})
