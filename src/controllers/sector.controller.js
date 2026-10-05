import * as SectorService from '../services/sector.service.js'

export async function index(_req, res) {
  res.json(await SectorService.list())
}

export async function show(req, res) {
  res.json(await SectorService.getById(req.valid.params.id))
}

export async function store(req, res) {
  res.status(201).json(await SectorService.create(req.valid.body.name))
}

export async function update(req, res) {
  res.json(await SectorService.rename(req.valid.params.id, req.valid.body.name))
}

export async function destroy(req, res) {
  await SectorService.remove(req.valid.params.id)
  res.status(204).end()
}
