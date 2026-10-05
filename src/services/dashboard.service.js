import * as Employee from '../models/employee.model.js'
import { scopedSector } from './access.js'

export const employeesBySector = () => Employee.countBySector()

export const employeesByScale = (user, { sectorId }) =>
  Employee.countByScaleType(scopedSector(user, sectorId))
