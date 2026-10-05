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

```
src/
├── app.js               # monta o Express (exportado também para a Vercel)
├── server.js            # sobe o servidor local
├── config/env.js        # variáveis de ambiente validadas
├── database/            # conexão e schema.sql
├── models/  services/  controllers/  routes/  validators/  middlewares/  utils/
api/index.js             # entrada serverless (Vercel)
scripts/                 # apply-schema, seed, hash-password
tests/                   # node --test
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
npm run hash -- "senhaMaster" # cole o resultado em MASTER_PASSWORD_HASH
npm run dev
npm test
```

## Endpoints (prefixo `/api`)

| Método | Rota | Perfil |
|---|---|---|
| GET | `/health` | público |
| POST | `/auth/login` | público |
| POST | `/auth/password/forgot` · `/verify` · `/reset` | público |
| GET · PATCH | `/me` | todos · admin/employee |
| PATCH | `/me/password` | admin/employee |
| POST | `/me/scale/confirm` | admin/employee |
| GET | `/me/notifications?unread=true` | admin/employee |
| PATCH | `/me/notifications/:id/read` · `/me/notifications/read-all` | admin/employee |
| GET · PUT · DELETE | `/me/photo` | admin/employee |
| GET | `/sectors` · `/sectors/:id` | master/admin |
| POST · PATCH · DELETE | `/sectors` · `/sectors/:id` | master |

### Em migração (v1 → v2)

| v1 | v2 planejado |
|---|---|
| `cadastrarFuncionario(_master)`, `listarFuncionarios_master`, `funcionariosSetor`, `editarFuncionario(_master)`, `deletarFuncionario_master` | `GET/POST /employees`, `GET/PATCH/DELETE /employees/:registration` |
| `cadastrarEscala(_master)`, `alterarEscala(_master)`, `escalasSetor`, `listarEscalas_master` | `PUT /employees/:registration/scale`, `GET /scales` |
| `cadastrarTurno(_master)`, `alterarTurno(_master)`, `turnosSetor`, `listarTurnos_master` | `PUT /employees/:registration/shift`, `GET /shifts` |
| `cadastrarEquipe`, `equipesSetor`, `listarEquipes_master`, `funcionariosEquipe` | `GET/POST /teams`, `PATCH/DELETE /teams/:id` |
| `listarRegioes_master`, `regiaoSetor` | `GET/POST /regions` |
| `cadastrarDiaEspecifico(_master)`, `diasEspecificos` | `POST /employees/:registration/occasions`, `GET /occasions?from&to` |
| `funcionariosAtivosSetor` | `GET /employees/on-duty?date=YYYY-MM-DD` |
| `confirmacoesSetor`, `notificarFaltamConfirmar` | `GET /confirmations?status=Pendente`, `POST /confirmations/remind` |
| `contabilizarFuncionariosSetor`, `funcionariosEscala` | `GET /dashboard/employees-by-sector`, `/dashboard/employees-by-scale` |
| `relatorioGeralSetor`, `relatorioPorEquipe`, `relatorioPorFuncionario` | `GET /reports/sector`, `/reports/teams/:id`, `/reports/employees/:registration` (`?month&year`) |
| `adicionarFeriados_master`, `listarFeriados_master`, `deletarFeriado_master` | a definir |

## Deploy

- Banco: [Neon](https://neon.com) (Free: não apaga dados por inatividade). Use a connection string *pooled*.
- API: Vercel (`api/index.js` + `vercel.json`) com `DB_MAX_CONNECTIONS=1`.
