// Dados de exemplo para desenvolvimento. Senha de todos: Semurb@123
import { sql } from '../src/database/db.js'
import { hashPassword } from '../src/utils/password.js'

const password = await hashPassword('Semurb@123')

await sql.begin(async tx => {
  const [sector] = await tx`insert into sector (name) values ('Fiscalização') returning id`
  const [adm] =
    await tx`insert into team (name, sector_id) values ('Fiscalização (ADM)', ${sector.id}) returning id`
  const [teamA] =
    await tx`insert into team (name, sector_id) values ('Equipe A', ${sector.id}) returning id`
  const [region] = await tx`insert into region (name) values ('Centro') returning id`

  await tx`insert into employee ${tx([
    {
      registration: 10001,
      name: 'Ana Admin',
      email: 'ana@semurb.dev',
      password,
      phone: '11999990001',
      position: 'Coordenadora',
      sectorId: sector.id,
      teamId: adm.id,
      regionId: region.id,
      isAdmin: true,
      mustChangePassword: false
    },
    {
      registration: 20001,
      name: 'Bruno Fiscal',
      email: 'bruno@semurb.dev',
      password,
      phone: '11999990002',
      position: 'Fiscal',
      sectorId: sector.id,
      teamId: teamA.id,
      regionId: region.id,
      isAdmin: false,
      mustChangePassword: false
    }
  ])}`
})

// Feriados nacionais de 2026 (exemplo)
await sql`insert into holiday ${sql([
  { day: '2026-01-01', name: 'Confraternização Universal' },
  { day: '2026-04-21', name: 'Tiradentes' },
  { day: '2026-05-01', name: 'Dia do Trabalho' },
  { day: '2026-09-07', name: 'Independência do Brasil' },
  { day: '2026-10-12', name: 'Nossa Senhora Aparecida' },
  { day: '2026-11-02', name: 'Finados' },
  { day: '2026-11-15', name: 'Proclamação da República' },
  { day: '2026-11-20', name: 'Dia da Consciência Negra' },
  { day: '2026-12-25', name: 'Natal' }
])} on conflict (day) do nothing`

console.log('Seed aplicado. Logins: 10001 (admin) e 20001 (funcionário), senha Semurb@123')
await sql.end()
