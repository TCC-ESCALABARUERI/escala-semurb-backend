-- =============================================================
-- Escala SEMURB — schema v2.1 (PostgreSQL 15+ / Neon)
-- Base: ScriptDB (v2) + ajustes de integridade
-- =============================================================

-- drop schema public cascade; create schema public;

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------- Estrutura organizacional ----------

create table sector (
  id          serial primary key,
  name        text unique not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trigger_sector_updated_at before update on sector
  for each row execute function set_updated_at();

create table region (
  id          serial primary key,
  name        text unique not null,
  created_at  timestamptz not null default now()
);

create table team (
  id          serial primary key,
  name        text not null,
  sector_id   int not null references sector(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (name, sector_id)
);
create trigger trigger_team_updated_at before update on team
  for each row execute function set_updated_at();
create index index_team_sector on team(sector_id);

-- ---------- Escala e turno ----------

-- work_day / unwork_day estão sempre em DIAS (12x36 é gravado como 1 / 1).
-- scale_type guarda o texto original informado (ex.: '12x36', '5x2').
create table scale (
  id            serial primary key,
  start_date    date not null,
  scale_type    text not null check (scale_type ~ '^\d{1,2}x\d{1,2}$'),
  work_day      int  not null check (work_day > 0),
  unwork_day    int  not null check (unwork_day > 0),
  unwork_scale  text[],                      -- folgas fixas (só escala semanal)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (
    unwork_scale is null or
    unwork_scale <@ array['Dom','Seg','Ter','Qua','Qui','Sex','Sab']
  )
);
create trigger trigger_scale_updated_at before update on scale
  for each row execute function set_updated_at();

-- Durações em interval (time não representa duração > 24h nem soma corretamente)
create table shift (
  id           serial primary key,
  shift_start  time not null,
  shift_end    time not null,
  shift_pause  interval not null default '00:00',
  total_shift  interval not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger trigger_shift_updated_at before update on shift
  for each row execute function set_updated_at();

-- ---------- Funcionário ----------

create table employee (
  registration         int primary key check (registration between 10000 and 99999),
  name                 text not null,
  email                text not null,
  password             text not null,
  must_change_password boolean not null default true,
  phone                text not null,
  position             text,
  sector_id            int references sector(id),
  team_id              int references team(id) on delete set null,
  region_id            int references region(id) on delete set null,
  shift_id             int references shift(id) on delete set null,
  scale_id             int references scale(id) on delete set null,
  is_admin             boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create trigger trigger_employee_updated_at before update on employee
  for each row execute function set_updated_at();
create unique index unique_employee_email on employee (lower(email));
create index index_employee_sector on employee(sector_id);
create index index_employee_team   on employee(team_id);
create index index_employee_scale  on employee(scale_id);

-- ---------- Confirmação de leitura da escala ----------

create table confirmation (
  id                 serial primary key,
  registration       int not null references employee(registration) on delete cascade,
  scale_id           int not null references scale(id) on delete cascade,
  status             text not null default 'Pendente' check (status in ('Pendente','Confirmado')),
  confirmation_date  timestamptz,
  created_at         timestamptz not null default now(),
  unique (registration, scale_id)
);
create index index_confirmation on confirmation(registration);

-- ---------- Notificações ----------

create table notification (
  id            serial primary key,
  registration  int not null references employee(registration) on delete cascade,
  type          text not null default 'Genérica',
  message       text,
  responsible   int references employee(registration) on delete set null,
  is_read       boolean not null default false,
  send_at       timestamptz not null default now()
);
create index index_notification on notification(registration, send_at desc);

-- ---------- Código de redefinição de senha ----------

-- Guarda só o hash do código + tentativas (limita força bruta)
create table validation (
  id            serial primary key,
  registration  int not null unique references employee(registration) on delete cascade,
  code_hash     text not null,
  attempts      int  not null default 0,
  created_at    timestamptz not null default now(),
  expires_at    timestamptz not null default (now() + interval '5 minutes')
);
create index index_expires on validation(expires_at);

-- ---------- Dias específicos (exceções individuais na escala) ----------

-- Exceção pontual de UM funcionário em UM dia. O tipo define o efeito:
--   Hora extra / Alteração de turno → trabalha (mesmo se for folga)
--   Atestado / Falta / Folga        → não trabalha
--   Outro                           → só anotação, não altera a escala
create table occasion (
  id            serial primary key,
  registration  int  not null references employee(registration) on delete cascade,
  day           date not null,
  type          text not null check (type in ('Hora extra','Atestado','Falta','Folga','Alteração de turno','Outro')),
  description   text,
  start_time    time,
  end_time      time,
  responsible   int references employee(registration) on delete set null,
  created_at    timestamptz not null default now(),
  unique (registration, day),
  check ((start_time is null) = (end_time is null))
);
create index index_occasion on occasion(registration, day);

-- ---------- Feriados ----------

-- Por padrão só dão folga para escalas semanais (regra em scale.rules.js)
create table holiday (
  id          serial primary key,
  day         date not null unique,
  name        text not null,
  created_at  timestamptz not null default now()
);

-- ---------- Foto de perfil ----------

create table profile (
  id            serial primary key,
  registration  int not null unique references employee(registration) on delete cascade,
  image         bytea not null,
  mime_type     text  not null,
  updated_at    timestamptz not null default now()
);
create trigger trigger_profile_updated_at before update on profile
  for each row execute function set_updated_at();
