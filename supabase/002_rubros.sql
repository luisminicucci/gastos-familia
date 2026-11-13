-- Rubros: agrupan categorías (ej.: "Hogar" con Supermercado, Casa y Servicios).
-- Pegar en Supabase > SQL Editor > New query y tocar "Run". Se puede correr más de una vez.

create table if not exists public.rubros (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  color text not null default '#5B6B66',
  sort int not null default 0,
  archived boolean not null default false
);

alter table public.categories add column if not exists rubro_id uuid references public.rubros(id) on delete set null;

alter table public.rubros enable row level security;
drop policy if exists rub_all on public.rubros;
create policy rub_all on public.rubros for all
  using (family_id = public.my_family_id()) with check (family_id = public.my_family_id());
