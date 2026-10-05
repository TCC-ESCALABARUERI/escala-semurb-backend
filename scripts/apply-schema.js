// Aplica src/database/schema.sql no banco do DATABASE_URL (use em banco vazio)
import { readFile } from 'node:fs/promises'
import { sql } from '../src/database/db.js'

const schema = await readFile(new URL('../src/database/schema.sql', import.meta.url), 'utf8')
await sql.unsafe(schema)
console.log('Schema aplicado com sucesso')
await sql.end()
