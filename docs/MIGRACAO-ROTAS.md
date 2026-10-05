# Migração de rotas v1 → v2 (guia para o frontend)

## Mudanças gerais

| Assunto | v1 | v2 |
|---|---|---|
| Prefixo | `/` | `/api` |
| Autenticação | `Authorization: <token>` (às vezes sem `Bearer`) | `Authorization: Bearer <token>` em toda rota privada |
| Quem está agindo | matrícula na URL (`/:matricula_adm`) | vem do token — **remova a matrícula do ADM das URLs e bodies** |
| Nomes de campos | português, snake_case | inglês, camelCase (tabela abaixo) |
| Datas | `DD/MM/AAAA` ou `AAAA-MM-DD` | sempre `AAAA-MM-DD` |
| Horários | livre | `HH:MM` |
| Erros | `{ mensagem, erro }` ou `{ message, error }` | sempre `{ message, details? }` |
| Validação | 400 genérico | 400 com `details: [{ field, message }]` |
| Sem permissão | — | 403; funcionário de outro setor → 404 |
| Login | 3 rotas, resposta trazia escala/turno/notificações | 1 rota, resposta traz só `token`, `role`, `mustChangePassword` |

### Fluxo de login novo

1. `POST /api/auth/login` → guarde `token` e `role` (`master` | `admin` | `employee`).
2. Se `mustChangePassword` for `true`, leve para a tela de troca de senha. Qualquer outra rota responde `403` com `details.code = "PASSWORD_CHANGE_REQUIRED"`.
3. `PATCH /api/me/password` devolve um **token novo**: substitua o antigo.
4. Carregue os dados com `GET /api/me` (setor, equipe, região, escala, turno, confirmação) e `GET /api/me/notifications`.

## Dicionário de campos

| v1 | v2 | Observação |
|---|---|---|
| `matricula_funcionario` | `registration` | número de 5 dígitos |
| `nome` | `name` | |
| `telefone` | `phone` | só números com DDD (10–13 dígitos) |
| `cargo` | `position` | |
| `setor` (nome) | `sectorId` | agora é o **id**; só o master envia |
| `equipe` / `nome_equipe` (nome) | `teamId` | agora é o **id** |
| `regiao` / `nome_regiao` (nome) | `regionId` | agora é o **id**; crie antes em `POST /regions` |
| `status_permissao: 'Sim'` | `isAdmin: true` | só o master envia |
| `senha` | `password` | |
| `nova_senha`, `confirmar_senha` / `confirmar_nova_senha` | `newPassword` / `password`, `confirmPassword` | ver rota |
| `codigo` | `code` | |
| `data_inicio` | `startDate` | |
| `tipo_escala` | `scaleType` | `12x36`, `5x2`… |
| `dias_n_trabalhados_escala_semanal` | `weeklyDaysOff` | ex.: `["Sab","Dom"]` |
| `usa_dias_especificos` | — | removido: basta enviar ou não `weeklyDaysOff` |
| `inicio_turno` / `termino_turno` | `shiftStart` / `shiftEnd` | `HH:MM` |
| `intervalo_turno` | `shiftPause` | `HH:MM` |
| `duracao_turno` | — | removido: a API calcula `totalShift` |
| `nome_diae` | `type` | `Hora extra`, `Atestado`, `Falta`, `Folga`, `Alteração de turno`, `Outro` |
| `data_diae` | `day` | |
| `descricao_diae` | `description` | opcional; `startTime`/`endTime` opcionais (obrigatórios em Alteração de turno) |
| `nome_setor` | `name` | |
| `dia_feriado` / `nome_feriado` | `day` / `name` | |
| `mes` / `ano` (query) | `month` / `year` | padrão: mês atual |

## Mapa de rotas

### Autenticação e senha

| v1 | v2 |
|---|---|
| `POST /loginMaster` · `POST /loginAdm` · `POST /loginFuncionario` | `POST /api/auth/login` `{ registration, password }` (master usa a matrícula do `.env`) |
| `POST /envioVerificacao_email` · `POST /envioVerificacaoAdm_email` | `POST /api/auth/password/forgot` `{ email }` — não devolve mais o código |
| `POST /verificacaoCodigo` · `POST /verificacaoCodigoAdm` | `POST /api/auth/password/verify` `{ email, code }` → `{ resetToken }` |
| `PUT /redefinirSenha` · `PUT /redefinirSenhaAdm` | `POST /api/auth/password/reset` `{ resetToken, password, confirmPassword }` |
| `DELETE /deletarCodigos/:matricula` · `DELETE /deletarCodigosAdm/:matricula` | removidas (o código é apagado automaticamente) |

### Funcionário logado

| v1 | v2 |
|---|---|
| dados que vinham no login | `GET /api/me` |
| notificações que vinham no login | `GET /api/me/notifications?unread=true` · `PATCH /api/me/notifications/:id/read` · `PATCH /api/me/notifications/read-all` |
| `PUT /alterarSenha` | `PATCH /api/me/password` `{ currentPassword, newPassword, confirmPassword }` (agora exige a senha atual) |
| `PUT /editarInformacoes/:matricula` | `PATCH /api/me` `{ email?, phone? }` |
| `PUT /confirmacaoEscala/:matricula` | `POST /api/me/scale/confirm` |
| `GET /diasEspecificos` | `GET /api/me/occasions?from&to` |
| `POST /uploadImagemPerfil/:matricula` · `PUT /uploadImagemPerfil/:matricula` | `PUT /api/me/photo` (multipart, campo `file`, até 2 MB, JPEG/PNG/WEBP) |
| `GET /imagemPerfil/:matricula` | `GET /api/me/photo` · `DELETE /api/me/photo` |
| — (novo) | `GET /api/me/schedule?year&month` — calendário do mês em JSON |
| — (novo) | `GET /api/me/report?year&month` — calendário do mês em PDF |

### Funcionários (ADM e master)

| v1 | v2 |
|---|---|
| `GET /funcionariosSetor/:matricula_adm` · `GET /listarFuncionarios_master` | `GET /api/employees?sectorId&teamId&regionId&search` (já traz escala, turno e confirmação) |
| `POST /cadastrarFuncionario` · `POST /cadastrarFuncionario_master` | `POST /api/employees` `{ registration, name, email, phone, position?, teamId?, regionId?, sectorId?*, isAdmin?* }` |
| `PUT /editarFuncionario/:matricula_adm` · `PUT /editarFuncionario_master/:matricula` | `PATCH /api/employees/:registration` (envie só o que mudou) |
| `DELETE /deletarFuncionario_master/:matricula` | `DELETE /api/employees/:registration` (só master) |
| — (novo) | `GET /api/employees/:registration` · `POST /api/employees/:registration/password-reset` |
| `GET /funcionariosAtivosSetor/:matricula_adm?data=` | `GET /api/employees/on-duty?date=AAAA-MM-DD&teamId` → `{ working[], off[], holiday }` com motivo |

\* somente master.

### Escala e turno

| v1 | v2 |
|---|---|
| `POST /cadastrarEscala` · `PUT /alterarEscala` · versões `_master` | `PUT /api/employees/:registration/scale` `{ startDate, scaleType, weeklyDaysOff? }` (cria ou altera) |
| `POST /cadastrarTurno` · `PUT /alterarTurno` · versões `_master` | `PUT /api/employees/:registration/shift` `{ shiftStart, shiftEnd, shiftPause }` (cria ou altera) |
| `GET /escalasSetor/:matricula_adm` · `GET /listarEscalas_master` | `GET /api/employees` (campo `scale`) |
| `GET /turnosSetor/:matricula_adm` · `GET /listarTurnos_master` | `GET /api/employees` (campo `shift`) |
| — (novo) | `GET /api/employees/:registration/schedule?year&month` |

### Confirmação de escala

| v1 | v2 |
|---|---|
| `GET /confirmacoesSetor/:matricula_adm` | `GET /api/confirmations?status=Pendente\|Confirmado&sectorId` |
| `POST /notificarFaltamConfirmar/:matricula_adm` | `POST /api/confirmations/remind` (notifica os pendentes e o ADM) |

### Dias específicos

| v1 | v2 |
|---|---|
| `POST /cadastrarDiaEspecifico/:matricula_adm` · `POST /cadastrarDiaEspecifico_master` | `POST /api/employees/:registration/occasions` `{ day, type, description?, startTime?, endTime? }` |
| — (novo) | `GET /api/employees/:registration/occasions?from&to` · `GET /api/occasions?from&to&type` · `DELETE /api/occasions/:id` |

### Estrutura

| v1 | v2 |
|---|---|
| `POST /cadastrarSetor` · `GET /listarSetores` · `PUT /editarSetor/:id` · `DELETE /deletarSetor/:id` | `POST /api/sectors` · `GET /api/sectors` · `PATCH /api/sectors/:id` · `DELETE /api/sectors/:id` |
| `POST /cadastrarEquipe/:matricula_adm` | `POST /api/teams` `{ name, sectorId?* }` |
| `GET /equipesSetor/:matricula_adm` · `GET /listarEquipes_master` | `GET /api/teams?sectorId` (traz `employeeCount`) |
| `GET /funcionariosEquipe/:id_equipe` | `GET /api/teams/:id` (`employeeCount`) |
| — (novo) | `PATCH /api/teams/:id` · `DELETE /api/teams/:id` |
| `GET /regiaoSetor/:matricula_adm` · `GET /listarRegioes_master` | `GET /api/regions` (traz `employeeCount`) |
| região criada automaticamente pelo nome | `POST /api/regions` `{ name }` antes de vincular |
| `POST /adicionarFeriados_master` | `POST /api/holidays` `{ day, name }` ou lista |
| `GET /listarFeriados_master` | `GET /api/holidays?year` (todos os perfis) |
| `DELETE /deletarFeriado_master/:id` | `DELETE /api/holidays/:id` |

### Dashboard e relatórios

| v1 | v2 |
|---|---|
| `GET /contabilizarFuncionariosSetor` | `GET /api/dashboard/employees-by-sector` |
| `GET /funcionariosEscala/:matricula_adm` | `GET /api/dashboard/employees-by-scale?sectorId` |
| `GET /relatorioGeralSetor/:matricula_adm?mes&ano` | `GET /api/reports/sector?year&month&sectorId*` |
| `GET /relatorioPorEquipe/:matricula_adm/:id_equipe?mes&ano` | `GET /api/reports/teams/:id?year&month` |
| `GET /relatorioPorFuncionario/:matricula_adm/:matricula?mes&ano` | `GET /api/reports/employees/:registration?year&month` |

PDFs vêm com `Content-Disposition: inline` (abrem no navegador). Para baixar via `fetch`, use `response.blob()`.
