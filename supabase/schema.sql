-- Gastos en Familia: esquema de base de datos para Supabase.
-- Pegar todo en Supabase > SQL Editor > New query y tocar "Run".

create extension if not exists pgcrypto;

-- ===== Tablas =====

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique default upper(substr(md5(random()::text), 1, 6)),
  created_at timestamptz not null default now()
);

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null,
  color text not null default '#0E7C66',
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  color text not null default '#5B6B66',
  budget numeric(14,2) not null default 0,
  sort int not null default 0,
  archived boolean not null default false
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  category_id uuid references public.categories(id) on delete set null,
  paid_by uuid references public.members(id) on delete set null,
  method text not null default 'Débito',
  installments int not null default 1 check (installments between 1 and 48),
  note text not null default '',
  spent_on date not null default current_date,
  recurring_key uuid,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists expenses_family_date on public.expenses (family_id, spent_on desc);

-- ===== Función auxiliar: familia del usuario logueado =====

create or replace function public.my_family_id()
returns uuid language sql stable security definer set search_path = public as $$
  select family_id from public.members where user_id = auth.uid()
$$;

-- ===== Seguridad: cada familia ve solo lo suyo =====

alter table public.families enable row level security;
alter table public.members enable row level security;
alter table public.categories enable row level security;
alter table public.expenses enable row level security;

drop policy if exists fam_select on public.families;
create policy fam_select on public.families for select using (id = public.my_family_id());
drop policy if exists fam_update on public.families;
create policy fam_update on public.families for update using (id = public.my_family_id());

drop policy if exists mem_select on public.members;
create policy mem_select on public.members for select using (family_id = public.my_family_id());
drop policy if exists mem_update on public.members;
create policy mem_update on public.members for update using (family_id = public.my_family_id());

drop policy if exists cat_all on public.categories;
create policy cat_all on public.categories for all
  using (family_id = public.my_family_id()) with check (family_id = public.my_family_id());

drop policy if exists exp_all on public.expenses;
create policy exp_all on public.expenses for all
  using (family_id = public.my_family_id()) with check (family_id = public.my_family_id());

-- ===== Crear familia / unirse con código =====

create or replace function public.create_family(p_family_name text, p_display_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare fid uuid;
begin
  if auth.uid() is null then raise exception 'No hay sesión'; end if;
  if exists (select 1 from members where user_id = auth.uid()) then
    raise exception 'Ya pertenecés a una familia';
  end if;
  insert into families (name) values (p_family_name) returning id into fid;
  insert into members (family_id, user_id, display_name, color) values (fid, auth.uid(), p_display_name, '#0E7C66');
  insert into categories (family_id, name, color, sort) values
    (fid, 'Supermercado', '#0E7C66', 1),
    (fid, 'Servicios',    '#3B5BA9', 2),
    (fid, 'Auto',         '#B45309', 3),
    (fid, 'Educación',    '#7A3FA0', 4),
    (fid, 'Salud',        '#B42340', 5),
    (fid, 'Casa',         '#5B6B66', 6),
    (fid, 'Salidas',      '#C27C0E', 7),
    (fid, 'Otros',        '#8C9A95', 8);
  return fid;
end $$;

create or replace function public.join_family(p_code text, p_display_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare fid uuid; n int; palette text[] := array['#0E7C66','#B45309','#3B5BA9','#7A3FA0','#B42340','#C27C0E'];
begin
  if auth.uid() is null then raise exception 'No hay sesión'; end if;
  if exists (select 1 from members where user_id = auth.uid()) then
    raise exception 'Ya pertenecés a una familia';
  end if;
  select id into fid from families where invite_code = upper(trim(p_code));
  if fid is null then raise exception 'Código inválido'; end if;
  select count(*) into n from members where family_id = fid;
  insert into members (family_id, user_id, display_name, color)
    values (fid, auth.uid(), p_display_name, palette[(n % 6) + 1]);
  return fid;
end $$;

grant execute on function public.create_family(text, text) to authenticated;
grant execute on function public.join_family(text, text) to authenticated;
grant execute on function public.my_family_id() to authenticated;

-- ===== Cambios en vivo (cuando otro integrante carga un gasto) =====
do $$ begin
  alter publication supabase_realtime add table public.expenses;
exception when duplicate_object then null; end $$;


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
