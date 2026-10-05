import postgres from 'postgres'
import { env } from '../config/env.js'

// postgres.camel: colunas snake_case do banco viram camelCase no JS (e vice-versa nos helpers sql(obj))
export const sql = postgres(env.databaseUrl, {
  max: env.dbMaxConnections,
  idle_timeout: 20,
  prepare: false, // necessário com pooler (Neon/PgBouncer)
  transform: postgres.camel,
  onnotice: () => {},
  // date (oid 1082) chega como 'YYYY-MM-DD' em vez de Date em UTC (evita deslocar o dia)
  types: { date: { to: 1082, from: [1082], serialize: x => x, parse: x => x } }
})
