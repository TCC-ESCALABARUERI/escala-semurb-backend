import bcrypt from 'bcrypt'
import { env } from '../config/env.js'

export const hashPassword = plain => bcrypt.hash(plain, env.saltRounds)
export const comparePassword = (plain, hash) => bcrypt.compare(plain, hash)
