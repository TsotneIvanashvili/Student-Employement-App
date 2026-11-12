// დემო ვაკანსიები: კომპანიები გამოგონილია.
// day: 0 = ორშაბათი ... 6 = კვირა; start/end: საათი (end არ შედის).
export const JOBS = [
  {
    id: 'barista',
    title: 'ბარისტა',
    company: 'Coffee Lab (დემო)',
    district: 'ვაკე',
    pay: 7,
    shifts: [
      { day: 0, start: 16, end: 20 },
      { day: 2, start: 16, end: 20 },
      { day: 5, start: 10, end: 15 },
    ],
  },
  {
    id: 'store',
    title: 'კონსულტანტი მაღაზიაში',
    company: 'City Store (დემო)',
    district: 'საბურთალო',
    pay: 6.5,
    shifts: [
      { day: 1, start: 17, end: 21 },
      { day: 3, start: 17, end: 21 },
      { day: 6, start: 12, end: 18 },
    ],
  },
  {
    id: 'waiter',
    title: 'ოფიციანტი',
    company: 'Restaurant Mtsvane (დემო)',
    district: 'ძველი თბილისი',
    pay: 6,
    shifts: [
      { day: 4, start: 18, end: 22 },
      { day: 5, start: 18, end: 22 },
      { day: 6, start: 18, end: 22 },
    ],
  },
  {
    id: 'callcenter',
    title: 'call-ცენტრის ოპერატორი',
    company: 'Call Point (დემო)',
    district: 'დიდუბე',
    pay: 8,
    shifts: [
      { day: 0, start: 9, end: 13 },
      { day: 2, start: 9, end: 13 },
      { day: 4, start: 9, end: 13 },
    ],
  },
  {
    id: 'warehouse',
    title: 'საწყობის ასისტენტი',
    company: 'Logi Hub (დემო)',
    district: 'ისანი',
    pay: 7,
    shifts: [
      { day: 1, start: 8, end: 12 },
      { day: 3, start: 8, end: 12 },
    ],
  },
  {
    id: 'smm',
    title: 'SMM ასისტენტი',
    company: 'Startup Studio (დემო)',
    district: 'დისტანციური',
    pay: 9,
    shifts: [
      { day: 0, start: 19, end: 22 },
      { day: 3, start: 19, end: 22 },
    ],
  },
  {
    id: 'tutor',
    title: 'მათემატიკის რეპეტიტორი',
    company: 'Tutor Club (დემო)',
    district: 'ვაკე',
    pay: 15,
    shifts: [
      { day: 1, start: 15, end: 17 },
      { day: 4, start: 15, end: 17 },
    ],
  },
  {
    id: 'reception',
    title: 'სასტუმროს რეცეფციონისტი',
    company: 'Hotel Aurora (დემო)',
    district: 'ძველი თბილისი',
    pay: 8,
    shifts: [
      { day: 5, start: 8, end: 14 },
      { day: 6, start: 8, end: 14 },
    ],
  },
  {
    id: 'events',
    title: 'ივენთის ასისტენტი',
    company: 'Event Pro (დემო)',
    district: 'სხვადასხვა',
    pay: 10,
    shifts: [{ day: 5, start: 14, end: 20 }],
  },
  {
    id: 'library',
    title: 'ბიბლიოთეკის ასისტენტი',
    company: 'University Library (დემო)',
    district: 'ვაკე',
    pay: 6,
    shifts: [
      { day: 0, start: 13, end: 16 },
      { day: 2, start: 13, end: 16 },
      { day: 4, start: 13, end: 16 },
    ],
  },
]
