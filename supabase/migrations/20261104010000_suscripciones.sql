-- Suscripciones a Cuotio Pro, cobradas con Paddle. Solo las escribe el servidor (webhook de Paddle con la clave secreta);
-- cada cuenta puede leer la suya para saber si tiene Pro.

create table if not exists public.suscripciones (
  user_id uuid primary key references auth.users (id) on delete cascade,
  paddle_subscription_id text not null unique,
  paddle_customer_id text not null,
  estado text not null check (estado in ('trialing', 'active', 'past_due', 'paused', 'canceled')),
  precio_id text,
  periodo_fin timestamptz,                 -- fin del periodo pagado (o de la prueba)
  cancela_al_final boolean not null default false,
  evento_at timestamptz not null,          -- occurred_at del último evento aplicado: los avisos viejos no pisan a los nuevos
  actualizado_at timestamptz not null default now()
);

alter table public.suscripciones enable row level security;
revoke all on public.suscripciones from anon, authenticated;
grant select on public.suscripciones to authenticated;

drop policy if exists "suscripcion propia: ver" on public.suscripciones;
create policy "suscripcion propia: ver" on public.suscripciones
  for select to authenticated using ((select auth.uid()) = user_id);
