import { Router } from 'express'
import {
  teams,
  regions,
  holidays,
  occasions,
  confirmations,
  dashboard
} from '../controllers/structure.controller.js'
import { authorize } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import { idParam } from '../validators/common.js'
import {
  nameBody,
  teamBody,
  sectorQuery,
  holidaysBody,
  yearQuery
} from '../validators/structure.validator.js'
import { periodQuery, confirmationQuery } from '../validators/employee.validator.js'
import { ROLES } from '../utils/token.js'

const MANAGERS = [ROLES.MASTER, ROLES.ADMIN]
const byId = { params: idParam }

// /teams — admin gerencia as do próprio setor
export const teamRoutes = Router()
  .use(authorize(...MANAGERS))
  .get('/', validate({ query: sectorQuery }), teams.index)
  .post('/', validate({ body: teamBody }), teams.store)
  .get('/:id', validate(byId), teams.show)
  .patch('/:id', validate({ ...byId, body: nameBody }), teams.update)
  .delete('/:id', validate(byId), teams.destroy)

// /regions — leitura para gestores, escrita só master
export const regionRoutes = Router()
  .get('/', authorize(...MANAGERS), regions.index)
  .post('/', authorize(...MANAGERS), validate({ body: nameBody }), regions.store)
  .patch('/:id', authorize(ROLES.MASTER), validate({ ...byId, body: nameBody }), regions.update)
  .delete('/:id', authorize(ROLES.MASTER), validate(byId), regions.destroy)

// /holidays — todos consultam, master mantém
export const holidayRoutes = Router()
  .get('/', validate({ query: yearQuery }), holidays.index)
  .post('/', authorize(ROLES.MASTER), validate({ body: holidaysBody }), holidays.store)
  .delete('/:id', authorize(ROLES.MASTER), validate(byId), holidays.destroy)

// /occasions — visão do setor por período
export const occasionRoutes = Router()
  .use(authorize(...MANAGERS))
  .get('/', validate({ query: periodQuery }), occasions.index)
  .delete('/:id', validate(byId), occasions.destroy)

// /confirmations — acompanhamento de leitura da escala
export const confirmationRoutes = Router()
  .use(authorize(...MANAGERS))
  .get('/', validate({ query: confirmationQuery }), confirmations.index)
  .post('/remind', validate({ query: sectorQuery }), confirmations.remind)

// /dashboard — números para gráficos
export const dashboardRoutes = Router()
  .get('/employees-by-sector', authorize(ROLES.MASTER), dashboard.bySector)
  .get(
    '/employees-by-scale',
    authorize(...MANAGERS),
    validate({ query: sectorQuery }),
    dashboard.byScale
  )
