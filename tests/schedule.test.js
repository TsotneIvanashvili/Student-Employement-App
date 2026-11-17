import test from 'node:test'
import assert from 'node:assert/strict'
import { eventsOn, shiftFits, matchJob, freeSlots, layoutDay, weekdayOf, startOfWeek, addMonths, jobEvents, workBetween, fitsFreeTime } from '../src/lib/schedule.js'

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

test('fitInfo: full, partial, flexible and expired jobs', async () => {
  const { fitInfo, clashOf } = await import('../src/lib/schedule.js')
  const busy = [{ id: 'a', weekday: 0, date: null, start_min: 600, end_min: 840, skip_dates: [] }]
  const job = (shifts) => ({ id: 'j', shifts })
  assert.equal(fitInfo(job([{ day: 1, start: 10, end: 14 }]), busy, '2026-11-16').full, true)
  const partial = fitInfo(job([{ day: 0, start: 12, end: 16 }, { day: 1, start: 10, end: 14 }]), busy, '2026-11-16')
  assert.equal(partial.full, false)
  assert.equal(partial.fitting.length, 1)
  assert.equal(clashOf({ day: 0, start: 12, end: 16 }, busy).id, 'a')
  assert.equal(clashOf({ day: 0, start: 14, end: 16 }, busy), null)
  assert.equal(fitInfo(job([]), busy).flexible, true)
  assert.equal(fitInfo(job([]), busy).full, true)
  const old = fitInfo(job([{ date: '2026-01-01', start: 10, end: 12 }]), busy, '2026-11-16')
  assert.equal(old.expired, true)
  assert.equal(old.full, false)
})

test('workBetween counts hours or days of a job between two dates', () => {
  const weekly = { pay_unit: 'hour', shifts: [{ day: 0, start: 10, end: 14 }, { day: 2, start: 18, end: 21.5 }] }
  // 2026-11-16 is a Monday; Mon 16, Wed 18, Mon 23, Wed 25 → 4 + 3.5 + 4 + 3.5
  assert.equal(workBetween(weekly, '2026-11-16', '2026-11-25'), 15)
  assert.equal(workBetween({ ...weekly, pay_unit: 'day' }, '2026-11-16', '2026-11-25'), 4)
  assert.equal(workBetween({ pay_unit: 'hour', shifts: [{ date: '2026-11-20', start: 9, end: 17 }] }, '2026-11-16', '2026-12-15'), 8)
  assert.equal(workBetween({ pay_unit: 'hour', shifts: [] }, '2026-11-16', '2026-12-15'), 0)
  assert.equal(workBetween(weekly, '2026-11-20', '2026-11-19'), 0)
})

test('free-time filter: one shift inside the chosen days and hours is enough', () => {
  const free = { days: [0, 2], from: 14, to: 20 }
  const today = '2026-11-17'
  const job = (shifts) => ({ shifts })
  assert.equal(fitsFreeTime(job([{ day: 0, start: 15, end: 19 }]), free, today), true)
  assert.equal(fitsFreeTime(job([{ day: 0, start: 12, end: 16 }]), free, today), false, 'starts before free time')
  assert.equal(fitsFreeTime(job([{ day: 1, start: 15, end: 18 }]), free, today), false, 'wrong day')
  assert.equal(fitsFreeTime(job([{ day: 1, start: 15, end: 18 }, { day: 2, start: 14, end: 20 }]), free, today), true)
  assert.equal(fitsFreeTime(job([{ date: '2026-11-18', start: 15, end: 17 }]), free, today), true, 'dated Wednesday')
  assert.equal(fitsFreeTime(job([{ date: '2026-11-16', start: 15, end: 17 }]), free, today), false, 'past date')
  assert.equal(fitsFreeTime(job([]), free, today), true, 'flexible hours')
  assert.equal(fitsFreeTime(job([{ day: 4, start: 9, end: 12 }]), null, today), true, 'no filter')
})
