import * as EmployeeService from '../services/employee.service.js'
import * as OccasionService from '../services/occasion.service.js'
import * as DutyService from '../services/duty.service.js'

const reg = req => req.valid.params.registration

export async function index(req, res) {
  res.json(await EmployeeService.list(req.user, req.valid.query))
}

export async function show(req, res) {
  res.json(await EmployeeService.getById(req.user, reg(req)))
}

export async function store(req, res) {
  res.status(201).json(await EmployeeService.create(req.user, req.valid.body))
}

export async function update(req, res) {
  res.json(await EmployeeService.update(req.user, reg(req), req.valid.body))
}

export async function destroy(req, res) {
  await EmployeeService.remove(req.user, reg(req))
  res.status(204).end()
}

export async function resetPassword(req, res) {
  await EmployeeService.resetPassword(req.user, reg(req))
  res.json({
    message: 'Senha redefinida para a matrícula. O funcionário deverá trocá-la no próximo acesso.'
  })
}

export async function setScale(req, res) {
  res.json(await EmployeeService.setScale(req.user, reg(req), req.valid.body))
}

export async function setShift(req, res) {
  res.json(await EmployeeService.setShift(req.user, reg(req), req.valid.body))
}

export async function occasions(req, res) {
  res.json(await OccasionService.listForEmployee(req.user, reg(req), req.valid.query))
}

export async function createOccasion(req, res) {
  res.status(201).json(await OccasionService.create(req.user, reg(req), req.valid.body))
}

export async function onDuty(req, res) {
  res.json(await DutyService.onDuty(req.user, req.valid.query))
}
