-- =====================================================
-- ESTRATEGIC ADV - Schema do Banco de Dados Supabase
-- Execute este SQL no painel do Supabase > SQL Editor
-- =====================================================

-- Habilitar extensões
create extension if not exists "uuid-ossp";

-- =====================================================
-- TABELA: perfis de usuário (advogados)
-- =====================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  nome text not null,
  email text not null,
  oab text,
  telefone text,
  avatar_url text,
  escritorio text,
  created_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;
create policy "Usuário vê apenas seu próprio perfil" on public.profiles
  for all using (auth.uid() = id);

-- Criar perfil automaticamente ao registrar
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nome, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)), new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for e