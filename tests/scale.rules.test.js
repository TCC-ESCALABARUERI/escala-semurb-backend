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
