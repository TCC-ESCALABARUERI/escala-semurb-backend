import {
  MONTHS,
  formatDate,
  hhmm,
  createDocument,
  header,
  section,
  keyValues,
  table,
  offColor,
  finish
} from './layout.js'

const period = ({ month, year }) => `${MONTHS[month - 1]}/${year}`
const scaleLabel = e =>
  e.scale
    ? `${e.scale.scaleType}${e.scale.unworkScale ? ` (folga ${e.scale.unworkScale.join('/')})` : ''}`
    : 'Sem escala'
const shiftLabel = e => (e.shift ? `${hhmm(e.shift.shiftStart)}–${hhmm(e.shift.shiftEnd)}` : '—')

const employeeColumns = [
  { header: 'Matrícula', width: 0.1, value: e => e.registration },
  { header: 'Nome', width: 0.24, value: e => e.name },
  { header: 'Equipe', width: 0.16, value: e => e.team?.name },
  { header: 'Escala', width: 0.16, value: scaleLabel },
  { header: 'Turno', width: 0.11, value: shiftLabel },
  {
    header: 'Trab./Folga',
    width: 0.1,
    value: e => (e.scale ? `${e.monthSummary.workingDays}/${e.monthSummary.offDays}` : '—')
  },
  { header: 'Status', width: 0.13, value: e => e.confirmation?.status ?? '—' }
]

const occasionColumns = [
  { header: 'Data', width: 0.12, value: o => formatDate(o.day) },
  { header: 'Funcionário', width: 0.3, value: o => o.employeeName },
  { header: 'Tipo', width: 0.18, value: o => o.type },
  {
    header: 'Horário',
    width: 0.12,
    value: o => (o.startTime ? `${hhmm(o.startTime)}–${hhmm(o.endTime)}` : '—')
  },
  { header: 'Descrição', width: 0.28, value: o => o.description }
]

function holidaysSection(doc, holidays) {
  if (holidays.length === 0) return
  section(doc, 'Feriados do mês (folga para escalas semanais)')
  table(
    doc,
    [
      { header: 'Data', width: 0.2, value: h => formatDate(h.day) },
      { header: 'Feriado', width: 0.8, value: h => h.name }
    ],
    holidays
  )
}

export function sectorReport(res, data) {
  const doc = createDocument(
    res,
    `relatorio-setor-${data.sector.id}-${data.year}-${data.month}.pdf`,
    'Relatório do setor'
  )
  header(doc, `Relatório do setor · ${data.sector.name}`, period(data))

  const pending = data.employees.filter(e => e.confirmation?.status === 'Pendente').length
  section(doc, 'Resumo')
  keyValues(doc, [
    ['Funcionários', data.employees.length],
    ['Equipes', data.teams.length],
    ['Com escala', data.employees.filter(e => e.scale).length],
    ['Confirmações pendentes', pending],
    ['Dias específicos no mês', data.occasions.length],
    ['Feriados no mês', data.holidays.length]
  ])

  for (const team of data.teams) {
    const members = data.employees.filter(e => e.teamId === team.id)
    section(doc, `${team.name} (${members.length})`)
    table(doc, employeeColumns, members, { emptyText: 'Equipe sem funcionários.' })
  }
  const noTeam = data.employees.filter(e => !e.teamId)
  if (noTeam.length) {
    section(doc, `Sem equipe (${noTeam.length})`)
    table(doc, employeeColumns, noTeam)
  }

  section(doc, 'Dias específicos do mês')
  table(doc, occasionColumns, data.occasions)
  holidaysSection(doc, data.holidays)
  finish(doc)
}

export function teamReport(res, data) {
  const doc = createDocument(
    res,
    `relatorio-equipe-${data.team.id}-${data.year}-${data.month}.pdf`,
    'Relatório da equipe'
  )
  header(
    doc,
    `Relatório da equipe · ${data.team.name}`,
    `${data.sector?.name ?? ''} · ${period(data)}`
  )

  section(doc, 'Funcionários')
  table(doc, employeeColumns, data.employees, { emptyText: 'Equipe sem funcionários.' })
  section(doc, 'Dias específicos do mês')
  table(doc, occasionColumns, data.occasions)
  holidaysSection(doc, data.holidays)
  finish(doc)
}

export function employeeReport(res, data) {
  const e = data.employee
  const s = data.schedule
  const doc = createDocument(
    res,
    `escala-${e.registration}-${data.year}-${data.month}.pdf`,
    'Escala do funcionário'
  )
  header(doc, `Escala mensal · ${e.name}`, `Matrícula ${e.registration} · ${period(data)}`)

  section(doc, 'Dados')
  keyValues(doc, [
    ['Setor', e.sector?.name],
    ['Equipe', e.team?.name],
    ['Cargo', e.position],
    ['Região', e.region?.name],
    ['Escala', scaleLabel(e)],
    ['Início da escala', formatDate(e.scale?.startDate)],
    ['Turno', shiftLabel(e)],
    ['Confirmação', e.confirmation?.status],
    ['Dias de trabalho', s.summary.workingDays],
    ['Dias de folga', s.summary.offDays]
  ])

  section(doc, 'Calendário')
  table(
    doc,
    [
      { header: 'Data', width: 0.14, value: d => formatDate(d.day) },
      { header: 'Dia', width: 0.08, value: d => d.weekDay },
      {
        header: 'Situação',
        width: 0.14,
        value: d => (d.working ? 'Trabalho' : 'Folga'),
        color: offColor
      },
      {
        header: 'Horário',
        width: 0.14,
        value: d => (d.hours ? `${d.hours.start}–${d.hours.end}` : '—')
      },
      {
        header: 'Motivo',
        width: 0.5,
        value: d => (d.occasion?.description ? `${d.reason} · ${d.occasion.description}` : d.reason)
      }
    ],
    s.days
  )
  finish(doc)
}
