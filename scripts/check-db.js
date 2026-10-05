// Confere se o banco do DATABASE_URL está com o schema atual: npm run db:check
import { sql } from '../src/database/db.js'

const expected = {
  sector: [],
  region: [],
  team: [],
  shift: [],
  employee: ['must_change_password'],
  scale: ['unwork_scale'],
  confirmation: [],
  notification: [],
  validation: ['code_hash', 'attempts'],
  occasion: ['type', 'start_time', 'end_time', 'responsible'],
  holiday: ['day', 'name'],
  profile: ['mime_type']
}

const rows = await sql`
  select table_name, column_name from information_schema.columns where table_schema = 'public'`
const columns = new Map()
for (const r of rows) columns.set(r.tableName, [...(columns.get(r.tableName) ?? []), r.columnName])

let ok = true
for (const [table, cols] of Object.entries(expected)) {
  const existing = columns.get(table)
  const missing = existing ? cols.filter(c => !existing.includes(c)) : ['(tabela inexistente)']
  console.log(
    `${missing.length ? '✗' : '✓'} ${table}${missing.length ? ` — faltando: ${missing.join(', ')}` : ''}`
  )
  if (missing.length) ok = false
}
const obsolete =
  (columns.get('scale') ?? []).includes('use_occasions') ||
  (columns.get('occasion') ?? []).includes('title')
if (obsolete) {
  ok = false
  console.log(
    '✗ colunas antigas encontradas — rode src/database/migrations/001_occasion_holiday.sql'
  )
}
console.log(ok ? '\nBanco atualizado.' : '\nBanco desatualizado.')
await sql.end()
process.exit(ok ? 0 : 1)
