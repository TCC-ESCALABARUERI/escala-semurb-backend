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

console.log('Seed aplicado. Logins: 10001 (admin) e 20001 (funcionário), senha Semurb@123')
await sql.end()
