-- Cuotio: cuentas de usuario. Cada persona solo puede leer y cambiar sus propias filas.
-- Las reglas (RLS) viven en la base de datos, así que protegen los datos aunque fallara el código de la web.
-- Se ejecuta una vez en Supabase > SQL Editor (ver DEPLOY.md, apartado 7).

-- Ajustes de cada persona. Se crea al terminar el alta.
create table public.perfiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  tramo_actual smallint not null check (tramo_actual between 1 and 15),
  regimen text not null default 'persona-fisica' check (regimen in ('persona-fisica', 'societario')),
  avisos boolean[] not null default '{true,true,true,true,true,true}' check (cardinality(avisos) = 6),
  privacidad_aceptada_at timestamptz not null default now(),
  creado_at timestamptz not null default now(),
  actualizado_at timestamptz not null default now()
);

-- Ingresos y gastos de cada mes. Un registro por persona, año y mes.
create table public.meses (
  user_id uuid not null references auth.users (id) on delete cascade,
  anio smallint not null check (anio between 2023 and 2100),
  mes smallint not null check (mes between 1 and 12),
  ingresos numeric(12, 2) not null check (ingresos >= 0 and ingresos < 10000000),
  gastos numeric(12, 2) not null check (gastos >= 0 and gastos < 10000000),
  actualizado_at timestamptz not null default now(),
  primary key (user_id, anio, mes)
);

create or replace function public.tocar_actualizado() returns trigger
language plpgsql set search_path = '' as $$
begin new.actualizado_at = now(); return new; end $$;

create trigger perfiles_actualizado before update on public.perfiles for each row execute function public.tocar_actualizado();
create trigger meses_actualizado before update on public.meses for each row execute function public.tocar_actualizado();

alter table public.perfiles enable row level security;
alter table public.meses enable row level security;

-- Nadie sin sesión puede tocar estas tablas.
revoke all on public.perfiles, public.meses from anon;
grant select, insert, update, delete on public.perfiles, public.meses to authenticated;

create policy "perfil propio: ver" on public.perfiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "perfil propio: crear" on public.perfiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "perfil propio: cambiar" on public.perfiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "perfil propio: borrar" on public.perfiles for delete to authenticated using ((select auth.uid()) = user_id);

create policy "meses propios: ver" on public.meses for select to authenticated using ((select auth.uid()) = user_id);
create policy "meses propios: crear" on public.meses for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "meses propios: cambiar" on public.meses for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "meses propios: borrar" on public.meses for delete to authenticated using ((select auth.uid()) = user_id);
