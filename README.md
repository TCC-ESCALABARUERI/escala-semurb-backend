# Escala SEMURB — API

API para gestão de escalas de trabalho da SEMURB: cadastro de setores, equipes e funcionários, definição de escala (12x36, 5x2…) e turno, confirmação de leitura da escala, notificações e relatórios em PDF.

> Projeto originado no TCC e reestruturado (v2) com arquitetura MVC em camadas, PostgreSQL puro (Neon) e controle de acesso por perfil.

## Stack

Node.js 20+ · Express 5 · PostgreSQL (postgres.js) · Zod · JWT · bcrypt · Multer · PDFKit · Nodemailer

## Arquitetura

MVC adaptado para API REST: a **View** é a resposta JSON e entra uma camada de **Service** para as regras de negócio.

```
requisição → routes → middlewares (auth, validate) → controller → service → model → PostgreSQL
                                                           ↘ rules (funções puras, testadas)
```

| Camada | Responsabilidade | Não pode |
|---|---|---|
| `routes/` | URL + verbo + middlewares de cada endpoint | conter lógica |
| `middlewares/` | autenticação, autorização por perfil, validação, upload, erros | acessar regras de negócio |
| `validators/` | schemas Zod do que entra na API | — |
| `controllers/` | ler `req`, chamar o service, montar `res` | ter SQL ou regra |
| `services/` | regras de negócio, transações, orquestração entre models | conhecer `req`/`res` |
| `services/rules/` | regras puras (cálculo de escala) | fazer I/O |
| `models/` | SQL de uma tabela/agregado | decidir regra |
| `views/` | layout dos relatórios em PDF (a "View" do MVC; o resto responde JSON) | buscar dados |

```
src/
├── app.js               # monta o Express (exportado também para a Vercel)
├── server.js            # sobe o servidor local
├── config/env.js        # variáveis de ambiente validadas
├── database/            # conexão e schema.sql
├── database/migrations/ # alterações para bancos já existentes
├── models/  services/  controllers/  routes/  validators/  middlewares/  utils/
└── views/reports/       # PDFs (PDFKit)
api/index.js             # entrada serverless (Vercel)
scripts/                 # apply-schema, seed, check-db, hash-password
tests/                   # node --test (regras de escala)
docs/                    # guia de migração de rotas v1→v2 e api.http (REST Client)
.github/workflows/ci.yml # testes + prettier a cada push
```

## Perfis

| Perfil | Origem | Escopo |
|---|---|---|
| `master` | credencial no `.env` (fora do banco) | tudo |
| `admin` | `employee.is_admin = true` | apenas o próprio setor (vem do token) |
| `employee` | demais funcionários | apenas os próprios dados (`/me`) |

O token carrega `sub` (matrícula), `role` e `sectorId`. Nenhuma rota confia em matrícula vinda da URL para decidir permissão.

## Regras de escala

- `NxM` em **dias** (5x2, 6x1, 4x2) ou em **horas** quando `N ≥ 12` e `N+M` é múltiplo de 24: 12x36 → 1 dia de trabalho / 1 de folga; 24x48 → 1/2; 24x72 → 1/3.
- **Folgas fixas** (ex.: 5x2 folgando Sáb/Dom) só em escalas semanais (`N+M = 7`), e a quantidade de dias deve ser igual a `M`. Com folgas fixas, vale o dia da semana; sem elas, vale o ciclo contado a partir de `start_date`.
- Datas são tratadas como dia de calendário no fuso `America/Sao_Paulo`.

## Como rodar

```bash
cp .env.example .env          # preencha DATABASE_URL e JWT_SECRET
npm install
npm run db:schema             # cria as tabelas (banco vazio)
npm run db:seed               # dados de exemplo (opcional)
npm run db:check              # confere se o banco está com o schema atual
npm run hash -- "senhaMaster" # cole o resultado em MASTER_PASSWORD_HASH
npm run dev
npm test
```

Para testar as rotas pelo VS Code, abra `docs/api.http` com a extensão **REST Client**.

Usuários do seed (apenas desenvolvimento): `10001` (admin) e `20001` (funcionário), senha `Semurb@123`.

## Endpoints (prefixo `/api`)

Perfis: **M** = master · **A** = admin (só o próprio setor) · **F** = funcionário.

| Método | Rota | Perfis |
|---|---|---|
| GET | `/health` | público |
| POST | `/auth/login` | público |
| POST | `/auth/password/forgot` · `/auth/password/verify` · `/auth/password/reset` | público |
| GET | `/me` | M A F |
| PATCH | `/me` · `/me/password` | A F |
| POST | `/me/scale/confirm` | A F |
| GET | `/me/notifications?unread=true` · `/me/occasions?from&to` | A F |
| PATCH | `/me/notifications/:id/read` · `/me/notifications/read-all` | A F |
| GET · PUT · DELETE | `/me/photo` | A F |
| GET | `/sectors` · `/sectors/:id` | M A |
| POST · PATCH · DELETE | `/sectors` · `/sectors/:id` | M |
| GET · POST | `/teams?sectorId` | M A |
| GET · PATCH · DELETE | `/teams/:id` | M A |
| GET · POST | `/regions` | M A |
| PATCH · DELETE | `/regions/:id` | M |
| GET · POST | `/employees?sectorId&teamId&regionId&search` | M A |
| GET · PATCH | `/employees/:registration` | M A |
| DELETE | `/employees/:registration` | M |
| POST | `/employees/:registration/password-reset` | M A |
| PUT | `/employees/:registration/scale` · `/employees/:registration/shift` | M A |
| GET · POST | `/employees/:registration/occasions` | M A |
| GET | `/employees/on-duty?date=AAAA-MM-DD&teamId` | M A |
| GET | `/occasions?from&to&type` · DELETE `/occasions/:id` | M A |
| GET | `/confirmations?status=Pendente` · POST `/confirmations/remind` | M A |
| GET | `/holidays?year` | M A F |
| POST · DELETE | `/holidays` · `/holidays/:id` | M |
| GET | `/dashboard/employees-by-sector` | M |
| GET | `/dashboard/employees-by-scale` | M A |
| GET | `/me/schedule?year&month` (JSON) · `/me/report?year&month` (PDF) | A F |
| GET | `/employees/:registration/schedule?year&month` | M A |
| GET | `/reports/sector?year&month&sectorId` · `/reports/teams/:id` · `/reports/employees/:registration` (PDF) | M A |

Migração do frontend v1 → v2: [`docs/MIGRACAO-ROTAS.md`](docs/MIGRACAO-ROTAS.md).

### Primeiro acesso

Funcionário criado recebe senha = matrícula e `mustChangePassword: true`. Até trocar (`PATCH /me/password`, que devolve um token novo), o token só acessa `GET /me` e a troca de senha; o resto responde `403` com `details.code = PASSWORD_CHANGE_REQUIRED`.

### Dias específicos e feriados

Ordem de prioridade para saber se alguém trabalha num dia (da exceção mais específica para a regra geral):

1. **Dia específico** do funcionário: `Hora extra` e `Alteração de turno` → trabalha; `Atestado`, `Falta` e `Folga` → não trabalha; `Outro` → só anotação.
2. **Feriado**: folga apenas para escalas semanais (ex.: 5x2). A política fica em `holidayAppliesTo()` em `scale.rules.js`.
3. **Escala base**: ciclo NxM ou folgas fixas.

## Deploy

**Banco — [Neon](https://neon.com)** (Free: 1 GB, não apaga dados por inatividade; dorme após 5 min sem uso). Região AWS São Paulo, connection string *pooled* (`-pooler` no host). Bancos criados antes de 05/10/2026: rodar `src/database/migrations/001_occasion_holiday.sql`.

**API — [Vercel](https://vercel.com)**

1. Importe o repositório na Vercel (Framework preset: **Other**; sem build command).
2. Em *Settings → Environment Variables*, cadastre: `NODE_ENV=production`, `DATABASE_URL`, `DB_MAX_CONNECTIONS=1`, `JWT_SECRET` (novo, diferente do local), `MASTER_REGISTRATION`, `MASTER_PASSWORD_HASH`, `CORS_ORIGIN` (URL do frontend) e, se houver, as variáveis `SMTP_*`.
3. Deploy. Teste em `https://<projeto>.vercel.app/api/health`.

`api/index.js` exporta o app sem `listen()`; `vercel.json` redireciona tudo para ele e inclui as fontes do PDFKit no pacote da função.

Em produção, não rode o seed com senhas conhecidas. Para demonstração no portfólio, crie um usuário de demo pelo master e troque a senha dele.

## Decisões técnicas

- **Supabase → Postgres puro (Neon):** o Supabase Free pausa projetos parados há 7 dias; o código só usava o Supabase como banco, então `postgres.js` com SQL direto removeu a dependência e permitiu transações.
- **Escopo pelo token:** no v1 a matrícula do ADM vinha na URL e qualquer usuário logado acessava qualquer rota. Agora papel e setor vêm do JWT.
- **Redefinição de senha:** código de uso único, guardado como hash, com limite de tentativas e expiração de 5 min; a resposta não revela se o e-mail existe.
- **Regras de escala como funções puras** (`services/rules/scale.rules.js`), cobertas por testes, sem banco nem HTTP.
- **Datas como dia de calendário em `America/Sao_Paulo`**, evitando que o dia da semana mude conforme o fuso do servidor.
