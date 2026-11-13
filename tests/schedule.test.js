import test from 'node:test'
import assert from 'node:assert/strict'
import { eventsOn, shiftFits, matchJob, freeSlots, layoutDay, weekdayOf, startOfWeek, addMonths, jobEvents } from '../src/lib/schedule.js'

const mondayLesson = { id: 'a', weekday: 0, date: null, start_min: 13 * 60, end_min: 16 * 60, skip_dates: ['2026-11-16'] }
const oneOff = { id: 'b', weekday: null, date: '2026-11-21', start_min: 11 * 60, end_min: 12 * 60, skip_dates: [] }
const events = [mondayLesson, oneOff]

test('dates: 2026-11-16 is Monday, week starts Monday, months roll over', () => {
  assert.equal(weekdayOf('2026-11-16'), 0)
  assert.equal(startOfWeek('2026-11-22'), '2026-11-16')
  assert.equal(addMonths('2026-12-15', 1), '2027-01-01')
})

test('recurring lesson appears every Monday except skipped dates', () => {
  assert.equal(eventsOn(events, '2026-11-23').length, 1)
  assert.equal(eventsOn(events, '2026-11-16').length, 0)
  assert.equal(eventsOn(events, '2026-11-21').length, 1)
})

test('weekly shift fits only outside the lesson', () => {
  assert.equal(shiftFits({ day: 0, start: 16, end: 20 }, events), true)
  assert.equal(shiftFits({ day: 0, start: 15, end: 18 }, events), false)
  assert.equal(shiftFits({ day: 1, start: 9, end: 22 }, events), true)
})

test('dated gig respects one-off events and skipped lessons', () => {
  assert.equal(shiftFits({ date: '2026-11-21', start: 10, end: 14 }, events), false)
  assert.equal(shiftFits({ date: '2026-11-16', start: 13, end: 16 }, events), true)
})

test('accepted job does not conflict with itself', () => {
  const job = { id: 'j1', shifts: [{ day: 2, start: 16, end: 20 }] }
  const withWork = [...events, ...jobEvents(job)]
  assert.equal(matchJob(job, withWork, '2026-11-13').fitting.length, 1)
  const other = { id: 'j2', shifts: [{ day: 2, start: 18, end: 21 }] }
  assert.equal(matchJob(other, withWork, '2026-11-13').fitting.length, 0)
})

test('free slots exclude weekly lessons', () => {
  const free = freeSlots(events)
  assert.equal(free.has('0-13'), false)
  assert.equal(free.has('0-16'), true)
})

test('overlapping events are laid out in columns', () => {
  const out = layoutDay([
    { id: 1, start_min: 600, end_min: 720 },
    { id: 2, start_min: 660, end_min: 780 },
    { id: 3, start_min: 800, end_min: 860 },
  ])
  const byId = Object.fromEntries(out.map((e) => [e.id, e]))
  assert.deepEqual([byId[1].col, byId[2].col, byId[1].cols], [0, 1, 2])
  assert.deepEqual([byId[3].col, byId[3].cols], [0, 1])
})
