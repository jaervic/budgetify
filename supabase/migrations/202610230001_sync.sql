-- Sincronización opcional de Budgetify.
--
-- La app sigue siendo local-first: estas tablas solo se usan cuando la persona
-- crea una cuenta y activa la sincronización. Cada fila pertenece a un usuario
-- de Supabase Auth y las políticas RLS impiden que vea datos de otro.
--
-- `payload` es el JSON que ya usa la app (validado con Zod en el cliente) o,
-- en el futuro, su versión cifrada. El servidor no interpreta su contenido.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload text not null,
  enc boolean not null default false,
  iv text,
  alg text,
  rev integer not null default 1,
  updated_at timestamptz not null default now(),
  constraint profiles_payload_size check (octet_length(payload) <= 4_000_000)
);

create table if not exists public.documents (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null check (char_length(id) between 1 and 100),
  kind text not null check (kind in ('budget', 'quote')),
  payload text not null,
  enc boolean not null default false,
  iv text,
  alg text,
  saved_at timestamptz not null,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  rev integer not null default 1,
  primary key (user_id, id),
  constraint documents_payload_size check (octet_length(payload) <= 2_000_000)
);

create table if not exists public.drafts (
  user_id uuid not null references auth.users (id) on delete cascade,
  mode text not null check (mode in ('budget', 'quote')),
  payload text not null,
  enc boolean not null default false,
  iv text,
  alg text,
  updated_at timestamptz not null default now(),
  rev integer not null default 1,
  primary key (user_id, mode),
  constraint drafts_payload_size check (octet_length(payload) <= 2_000_000)
);

-- Traer cambios desde el último cursor y ordenar el historial son las dos
-- consultas habituales.
create index if not exists documents_user_updated_idx
  on public.documents (user_id, updated_at);

create index if not exists documents_user_saved_idx
  on public.documents (user_id, saved_at desc)
  where deleted_at is null;

-- `updated_at` siempre lo pone el servidor (evita relojes desincronizados) y
-- `rev` sube en cada actualización (concurrencia optimista).
create or replace function public.touch_sync_row()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  if tg_op = 'UPDATE' then
    new.rev = old.rev + 1;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch
  before insert or update on public.profiles
  for each row execute function public.touch_sync_row();

drop trigger if exists documents_touch on public.documents;
create trigger documents_touch
  before insert or update on public.documents
  for each row execute function public.touch_sync_row();

drop trigger if exists drafts_touch on public.drafts;
create trigger drafts_touch
  before insert or update on public.drafts
  for each row execute function public.touch_sync_row();

alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.drafts enable row level security;

-- Una sola política `for all` cubre select/insert/update/delete. `using` filtra
-- lo que se puede leer/modificar y `with check` lo que se puede escribir: sin
-- el segundo, un usuario podría insertar una fila con el id de otro.
drop policy if exists "own profile" on public.profiles;
create policy "own profile"
  on public.profiles
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "own documents" on public.documents;
create policy "own documents"
  on public.documents
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "own drafts" on public.drafts;
create policy "own drafts"
  on public.drafts
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
