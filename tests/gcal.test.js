import test from 'node:test'
import assert from 'node:assert/strict'
import { toLessons } from '../src/lib/gcal.js'

process.env.TZ = 'Asia/Tbilisi'

test('Google events become weekly lectures or dated events, without duplicates', () => {
  const items = [
    { summary: 'Calculus', recurringEventId: 'r1', start: { dateTime: '2026-11-17T10:00:00+04:00' }, end: { dateTime: '2026-11-17T11:30:00+04:00' } },
    { summary: 'Calculus', recurringEventId: 'r1', start: { dateTime: '2026-11-24T10:00:00+04:00' }, end: { dateTime: '2026-11-24T11:30:00+04:00' } },
    { summary: 'Dentist', start: { dateTime: '2026-11-20T15:00:00+04:00' }, end: { dateTime: '2026-11-20T16:00:00+04:00' } },
    { summary: 'Holiday', start: { date: '2026-11-23' }, end: { date: '2026-11-24' } },
    { summary: 'Free block', transparency: 'transparent', start: { dateTime: '2026-11-18T09:00:00+04:00' }, end: { dateTime: '2026-11-18T10:00:00+04:00' } },
    { summary: 'Old', recurringEventId: 'r2', start: { dateTime: '2026-11-19T12:00:00+04:00' }, end: { dateTime: '2026-11-19T13:00:00+04:00' } },
  ]
  const existing = [{ weekday: 3, date: null, start_min: 720, end_min: 780 }]
  assert.deepEqual(toLessons(items, existing), [
    { title: 'Calculus', weekday: 1, date: null, start_min: 600, end_min: 690, type: 'lecture' },
    { title: 'Dentist', weekday: null, date: '2026-11-20', start_min: 900, end_min: 960, type: 'personal' },
  ])
})
