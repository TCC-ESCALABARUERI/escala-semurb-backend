import * as ReportService from '../services/report.service.js'
import * as ScheduleService from '../services/schedule.service.js'
import { sectorReport, teamReport, employeeReport } from '../views/reports/index.js'

// Controller escolhe a View: JSON (calendário) ou PDF (relatórios)

export async function mySchedule(req, res) {
  res.json(await ScheduleService.mine(req.user.registration, req.valid.query))
}

export async function myReport(req, res) {
  employeeReport(
    res,
    await ReportService.employee(req.user, req.user.registration, req.valid.query)
  )
}

export async function employeeSchedule(req, res) {
  res.json(
    await ScheduleService.ofEmployee(req.user, req.valid.params.registration, req.valid.query)
  )
}

export async function sector(req, res) {
  sectorReport(res, await ReportService.sector(req.user, req.valid.query))
}

export async function team(req, res) {
  teamReport(res, await ReportService.team(req.user, req.valid.params.id, req.valid.query))
}

export async function employee(req, res) {
  employeeReport(
    res,
    await ReportService.employee(req.user, req.valid.params.registration, req.valid.query)
  )
}
