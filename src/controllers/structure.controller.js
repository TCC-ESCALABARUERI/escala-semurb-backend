import * as TeamService from '../services/team.service.js'
import * as RegionService from '../services/region.service.js'
import * as HolidayService from '../services/holiday.service.js'
import * as OccasionService from '../services/occasion.service.js'
import * as ConfirmationService from '../services/confirmation.service.js'
import * as DashboardService from '../services/dashboard.service.js'

// Controllers pequenos agrupados: equipes, regiões, feriados, dias específicos, confirmações, dashboard
const id = req => req.valid.params.id

export const teams = {
  index: async (req, res) => res.json(await TeamService.list(req.user, req.valid.query)),
  show: async (req, res) => res.json(await TeamService.getById(req.user, id(req))),
  store: async (req, res) =>
    res.status(201).json(await TeamService.create(req.user, req.valid.body)),
  update: async (req, res) =>
    res.json(await TeamService.rename(req.user, id(req), req.valid.body.name)),
  destroy: async (req, res) => {
    await TeamService.remove(req.user, id(req))
    res.status(204).end()
  }
}

export const regions = {
  index: async (_req, res) => res.json(await RegionService.list()),
  store: async (req, res) => res.status(201).json(await RegionService.create(req.valid.body.name)),
  update: async (req, res) => res.json(await RegionService.rename(id(req), req.valid.body.name)),
  destroy: async (req, res) => {
    await RegionService.remove(id(req))
    res.status(204).end()
  }
}

export const holidays = {
  index: async (req, res) => res.json(await HolidayService.list(req.valid.query.year)),
  store: async (req, res) => res.status(201).json(await HolidayService.createMany(req.valid.body)),
  destroy: async (req, res) => {
    await HolidayService.remove(id(req))
    res.status(204).end()
  }
}

export const occasions = {
  index: async (req, res) =>
    res.json(await OccasionService.listForSector(req.user, req.valid.query)),
  destroy: async (req, res) => {
    await OccasionService.remove(req.user, id(req))
    res.status(204).end()
  }
}

export const confirmations = {
  index: async (req, res) => res.json(await ConfirmationService.list(req.user, req.valid.query)),
  remind: async (req, res) =>
    res.json(await ConfirmationService.remindPending(req.user, req.valid.query))
}

export const dashboard = {
  bySector: async (_req, res) => res.json(await DashboardService.employeesBySector()),
  byScale: async (req, res) =>
    res.json(await DashboardService.employeesByScale(req.user, req.valid.query))
}
