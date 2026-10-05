// Regras puras de escala (sem banco, sem HTTP) — fáceis de testar.
//
// Analogia: a escala é um "relógio" que gira a partir de start_date.
//  - Escala por ciclo (ex.: 12x36, 4x2): o ponteiro anda 1 casa por dia e,
//    nas primeiras `workDay` casas do ciclo, a pessoa trabalha.
//  - Escala semanal com folgas fixas (ex.: 5x2 folgando Sáb/Dom): o relógio é a
//    própria semana; trabalha em todo dia que não estiver em `unworkScale`.

import { badRequest } from '../../utils/AppError.js'

export const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

const FULL_TO_SHORT = {
  domingo: 'Dom',
  segunda: 'Seg',
  terca: 'Ter',
  terça: 'Ter',
  quarta: 'Qua',
  quinta: 'Qui',
  sexta: 'Sex',
  sabado: 'Sab',
  sábado: 'Sab'
}

/**
 * Interpreta o tipo de escala "NxM".
 * - Escala em HORAS quando N >= 12 e (N + M) fecha dias inteiros (múltiplo de 24):
 *   12x36 → ciclo 2 dias (1 trabalho, 1 folga); 24x48 → 1x2; 24x72 → 1x3.
 * - Caso contrário, N e M já são dias: 5x2, 6x1, 4x2, 14x14.
 */
export function parseScaleType(scaleType) {
  const match = /^(\d{1,2})x(\d{1,2})$/.exec(String(scaleType).trim())
  if (!match) throw badRequest('Tipo de escala inválido. Use o formato NxM (ex.: 12x36, 5x2)')

  const n = Number(match[1])
  const m = Number(match[2])
  if (n === 0 || m === 0) throw badRequest('Os dois lados da escala devem ser maiores que zero')

  const isHours = n >= 12 && (n + m) % 24 === 0
  if (!isHours) return { unit: 'days', workDay: n, unworkDay: m, cycleDays: n + m }

  const cycleDays = (n + m) / 24
  const workDay = Math.ceil(n / 24)
  const unworkDay = cycleDays - workDay
  if (unworkDay <= 0) throw badRequest(`A escala ${scaleType} não tem dia de folga no ciclo`)

  return { unit: 'hours', workDay, unworkDay, cycleDays }
}

/** Normaliza 'Domingo' | 'dom' | 'DOM' → 'Dom' */
export function normalizeWeekDay(day) {
  const raw = String(day).trim()
  const lower = raw.toLowerCase()
  if (FULL_TO_SHORT[lower]) return FULL_TO_SHORT[lower]
  const short = WEEK_DAYS.find(d => d.toLowerCase() === lower.slice(0, 3) && lower.length === 3)
  if (short) return short
  throw badRequest(`Dia da semana inválido: ${day}`)
}

/**
 * Folgas fixas só fazem sentido em escala semanal (dias, ciclo de 7)
 * e a quantidade de dias informados precisa bater com M.
 */
export function buildWeeklyDaysOff(parsed, days) {
  if (!days || days.length === 0) return null

  if (parsed.unit !== 'days' || parsed.cycleDays !== 7) {
    throw badRequest(
      'Folgas fixas só são permitidas em escalas semanais (N + M = 7, ex.: 5x2, 6x1)'
    )
  }
  const normalized = [...new Set(days.map(normalizeWeekDay))]
  if (normalized.length !== parsed.unworkDay) {
    throw badRequest(
      `A escala prevê ${parsed.unworkDay} folga(s) por semana, mas ${normalized.length} dia(s) foram informados`
    )
  }
  return normalized.sort((a, b) => WEEK_DAYS.indexOf(a) - WEEK_DAYS.indexOf(b))
}

// Datas tratadas como "dia de calendário": string 'YYYY-MM-DD' é usada como está;
// Date é convertido para o dia no fuso de São Paulo. Evita o bug do getDay() no fuso do servidor.
const SP_DAY = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' })

function toUtcDay(date) {
  const iso = date instanceof Date ? SP_DAY.format(date) : String(date).slice(0, 10)
  const [y, mo, d] = iso.split('-').map(Number)
  const ms = Date.UTC(y, mo - 1, d)
  if (Number.isNaN(ms)) throw badRequest(`Data inválida: ${date}`)
  return ms
}

const DAY_MS = 24 * 60 * 60 * 1000

/** O funcionário trabalha nesta data? */
export function isWorkingOn(scale, date) {
  const start = toUtcDay(scale.startDate)
  const target = toUtcDay(date)
  if (target < start) return false

  if (scale.unworkScale?.length) {
    const weekDay = WEEK_DAYS[new Date(target).getUTCDay()]
    return !scale.unworkScale.includes(weekDay)
  }

  const cycle = scale.workDay + scale.unworkDay
  const position = Math.round((target - start) / DAY_MS) % cycle
  return position < scale.workDay
}
