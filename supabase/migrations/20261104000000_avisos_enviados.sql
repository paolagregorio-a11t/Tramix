-- Avisos por email antes de cada plazo: registro de lo ya enviado, para no mandar el mismo aviso dos veces.
-- Solo lo usa el servidor (envío programado con la clave secreta); nadie lo puede leer desde la app.

create table if not exists public.avisos_enviados (
  user_id uuid not null references auth.users (id) on delete cascade,
  limite date not null,                              -- último día del plazo avisado
  enviado_at timestamptz not null default now(),
  primary key (user_id, limite)
);

alter table public.avisos_enviados enable row level security;
revoke all on public.avisos_enviados from anon, authenticated;
-- Sin políticas: ni anon ni authenticated pueden leer ni escribir. La clave secreta (service_role) se salta RLS.
