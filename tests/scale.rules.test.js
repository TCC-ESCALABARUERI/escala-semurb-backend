import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  parseScaleType,
  buildWeeklyDaysOff,
  isWorkingOn
} from '../src/services/rules/scale.rules.js'

test('parseScaleType: escalas em horas viram dias', () => {
  assert.deepEqual(parseScaleType('12x36'), {
    unit: 'hours',
    workDay: 1,
    unworkDay: 1,
    cycleDays: 2
  })
  assert.deepEqual(parseScaleType('24x48'), {
    unit: 'hours',
    workDay: 1,
    unworkDay: 2,
    cycleDays: 3
  })
  assert.deepEqual(parseScaleType('24x72'), {
    unit: 'hours',
    workDay: 1,
    unworkDay: 3,
    cycleDays: 4
  })
})

test('parseScaleType: escalas em dias', () => {
  assert.deepEqual(parseScaleType('5x2'), { unit: 'days', workDay: 5, unworkDay: 2, cycleDays: 7 })
  assert.deepEqual(parseScaleType('14x14'), {
    unit: 'days',
    workDay: 14,
    unworkDay: 14,
    cycleDays: 28
  })
})

test('parseScaleType: formatos inválidos', () => {
  assert.throws(() => parseScaleType('5-2'))
  assert.throws(() => parseScaleType('0x2'))
  assert.throws(() => parseScaleType('12x12')) // sem folga no ciclo
})

test('buildWeeklyDaysOff: normaliza e valida quantidade', () => {
  const p = parseScaleType('5x2')
  assert.deepEqual(buildWeeklyDaysOff(p, ['Domingo', 'sab']), ['Dom', 'Sab'])
  assert.throws(() => buildWeeklyDaysOff(p, ['Dom']))
  assert.throws(() => buildWeeklyDaysOff(parseScaleType('12x36'), ['Dom']))
  assert.equal(buildWeeklyDaysOff(p, []), null)
})

test('isWorkingOn: ciclo 12x36 alterna a partir do início', () => {
  const scale = { startDate: '2026-10-01', workDay: 1, unworkDay: 1, unworkScale: null }
  assert.equal(isWorkingOn(scale, '2026-09-30'), false) // antes do início
  assert.equal(isWorkingOn(scale, '2026-10-01'), true)
  assert.equal(isWorkingOn(scale, '2026-10-02'), false)
  assert.equal(isWorkingOn(scale, '2026-10-03'), true)
})

test('isWorkingOn: 5x2 com folgas fixas ignora o ciclo', () => {
  const scale = { startDate: '2026-10-01', workDay: 5, unworkDay: 2, unworkScale: ['Dom', 'Sab'] }
  assert.equal(isWorkingOn(scale, '2026-10-03'), false) // sábado
  assert.equal(isWorkingOn(scale, '2026-10-04'), false) // domingo
  assert.equal(isWorkingOn(scale, '2026-10-05'), true) // segunda
  assert.equal(isWorkingOn(scale, new Date('2026-10-09T23:30:00-03:00')), true) // sexta 23:30 em SP (já é sábado em UTC)
})

import { resolveDuty, calculateShift } from '../src/services/rules/scale.rules.js'

test('resolveDuty: dia específico vence escala e feriado', () => {
  const weekly = {
    startDate: '2026-10-01',
    scaleType: '5x2',
    workDay: 5,
    unworkDay: 2,
    unworkScale: ['Dom', 'Sab']
  }
  const holiday = { name: 'Dia das Crianças' }
  // 12/10/2026 é segunda
  assert.deepEqual(resolveDuty({ scale: weekly, date: '2026-10-12' }), {
    working: true,
    reason: 'Escala'
  })
  assert.equal(resolveDuty({ scale: weekly, date: '2026-10-12', holiday }).working, false)
  assert.equal(
    resolveDuty({ scale: weekly, date: '2026-10-12', holiday, occasion: { type: 'Hora extra' } })
      .working,
    true
  )
  assert.equal(
    resolveDuty({ scale: weekly, date: '2026-10-13', occasion: { type: 'Atestado' } }).working,
    false
  )
  assert.deepEqual(
    resolveDuty({ scale: weekly, date: '2026-10-13', occasion: { type: 'Outro' } }),
    { working: true, reason: 'Escala' }
  )
  assert.equal(
    resolveDuty({ scale: weekly, date: '2026-10-11', occasion: { type: 'Hora extra' } }).working,
    true
  ) // domingo
})

test('resolveDuty: feriado não afeta escala por ciclo (12x36)', () => {
  const cycle = {
    startDate: '2026-10-12',
    scaleType: '12x36',
    workDay: 1,
    unworkDay: 1,
    unworkScale: null
  }
  assert.equal(
    resolveDuty({ scale: cycle, date: '2026-10-12', holiday: { name: 'X' } }).working,
    true
  )
  assert.equal(resolveDuty({ scale: null, date: '2026-10-12' }).reason, 'Sem escala')
  assert.equal(
    resolveDuty({ scale: cycle, date: '2026-10-01' }).reason,
    'Escala ainda não iniciada'
  )
})

test('calculateShift: duração líquida e virada de dia', () => {
  assert.equal(
    calculateShift({ shiftStart: '08:00', shiftEnd: '17:00', shiftPause: '01:00' }).totalShift,
    '08:00'
  )
  assert.equal(
    calculateShift({ shiftStart: '19:00', shiftEnd: '07:00', shiftPause: '01:00' }).totalShift,
    '11:00'
  )
  assert.throws(() =>
    calculateShift({ shiftStart: '08:00', shiftEnd: '09:00', shiftPause: '01:00' })
  )
})

import { buildMonthSchedule, monthDays } from '../src/services/rules/scale.rules.js'

test('monthDays: fevereiro bissexto e mês de 31 dias', () => {
  assert.equal(monthDays(2028, 2).length, 29)
  assert.equal(monthDays(2026, 10).at(-1), '2026-10-31')
})

test('buildMonthSchedule: 5x2 em outubro/2026 com feriado e atestado', () => {
  const scale = {
    startDate: '2026-10-01',
    scaleType: '5x2',
    workDay: 5,
    unworkDay: 2,
    unworkScale: ['Dom', 'Sab']
  }
  const shift = { shiftStart: '08:00:00', shiftEnd: '17:00:00' }
  const result = buildMonthSchedule({
    scale,
    shift,
    year: 2026,
    month: 10,
    holidays: [{ day: '2026-10-12', name: 'Nossa Senhora Aparecida' }],
    occasions: [{ day: '2026-10-13', type: 'Atestado', description: null }]
  })
  // outubro/2026: 22 dias úteis − feriado − atestado = 20
  assert.equal(result.summary.workingDays, 20)
  assert.equal(result.days[0].hours.start, '08:00')
  assert.equal(result.days[11].reason, 'Feriado: Nossa Senhora Aparecida')
  assert.equal(result.days[12].reason, 'Atestado')
})
