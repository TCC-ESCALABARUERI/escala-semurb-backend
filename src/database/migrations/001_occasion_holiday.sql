-- Para bancos criados com o schema v2.1 inicial (antes de 2026-10-05).
-- Bancos novos: basta rodar schema.sql.

alter table scale drop column if exists use_occasions;

drop table if exists occasion;
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

create table if not exists holiday (
  id          serial primary key,
  day         date not null unique,
  name        text not null,
  created_at  timestamptz not null default now()
);
