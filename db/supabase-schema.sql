-- ModernRPG — tabelas no Supabase (projeto compartilhado com o Foundry Armada)
-- Só CRIA objetos novos com prefixo mrpg_. Não altera nenhuma tabela, política,
-- função ou configuração de autenticação que já exista.
-- Desfazer: db/supabase-rollback.sql
-- Rodar tudo de uma vez (uma transação: ou cria tudo, ou não cria nada).

begin;

-- ---------------------------------------------------------------------------
-- Funções de apoio (evitam recursão nas políticas de campanha/participante)
-- ---------------------------------------------------------------------------
create table if not exists mrpg_campaigns (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  client_id   text,                       -- id local da campanha (evita duplicar ao migrar)
  data        jsonb not null,             -- o registro da campanha (NPCs, cenas, diário…)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (owner_id, client_id)
);

create table if not exists mrpg_campaign_members (
  campaign_id uuid not null references mrpg_campaigns(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  added_at    timestamptz not null default now(),
  primary key (campaign_id, user_id)
);

create or replace function mrpg_is_campaign_owner(p_campaign uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from mrpg_campaigns where id = p_campaign and owner_id = auth.uid());
$$;

create or replace function mrpg_is_campaign_member(p_campaign uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from mrpg_campaign_members where campaign_id = p_campaign and user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- Dados pessoais: cada usuário só enxerga e mexe no que é dele
-- ---------------------------------------------------------------------------
create table if not exists mrpg_characters (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  client_id   text,                       -- id local da ficha
  sheet       jsonb not null,             -- a ficha inteira (inclui o Diário)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (owner_id, client_id)
);

create table if not exists mrpg_companions (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  client_id   text,
  data        jsonb not null,             -- parceiro (nome, tipo, criatura do bestiário…)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (owner_id, client_id)
);

alter table mrpg_characters enable row level security;
alter table mrpg_companions enable row level security;
alter table mrpg_campaigns enable row level security;
alter table mrpg_campaign_members enable row level security;

drop policy if exists "mrpg: dono gerencia as próprias fichas" on mrpg_characters;
create policy "mrpg: dono gerencia as próprias fichas"
  on mrpg_characters for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "mrpg: dono gerencia os próprios parceiros" on mrpg_companions;
create policy "mrpg: dono gerencia os próprios parceiros"
  on mrpg_companions for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Campanhas: dono e participantes veem; só o dono cria/edita/apaga
drop policy if exists "mrpg: dono e participantes veem a campanha" on mrpg_campaigns;
create policy "mrpg: dono e participantes veem a campanha"
  on mrpg_campaigns for select to authenticated
  using (owner_id = auth.uid() or mrpg_is_campaign_member(id));

drop policy if exists "mrpg: usuário cria campanha em próprio nome" on mrpg_campaigns;
create policy "mrpg: usuário cria campanha em próprio nome"
  on mrpg_campaigns for insert to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "mrpg: só o dono edita a campanha" on mrpg_campaigns;
create policy "mrpg: só o dono edita a campanha"
  on mrpg_campaigns for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "mrpg: só o dono apaga a campanha" on mrpg_campaigns;
create policy "mrpg: só o dono apaga a campanha"
  on mrpg_campaigns for delete to authenticated
  using (owner_id = auth.uid());

-- Participantes: o dono vê todos; cada participante vê só a si e pode sair.
-- Não há política de INSERT: convidar só acontece pela função mrpg_share_campaign.
drop policy if exists "mrpg: dono vê participantes, participante vê a si" on mrpg_campaign_members;
create policy "mrpg: dono vê participantes, participante vê a si"
  on mrpg_campaign_members for select to authenticated
  using (user_id = auth.uid() or mrpg_is_campaign_owner(campaign_id));

drop policy if exists "mrpg: dono remove participante, participante sai" on mrpg_campaign_members;
create policy "mrpg: dono remove participante, participante sai"
  on mrpg_campaign_members for delete to authenticated
  using (user_id = auth.uid() or mrpg_is_campaign_owner(campaign_id));

-- Convidar por e-mail (só o dono). Devolve false se o e-mail não tem conta.
create or replace function mrpg_share_campaign(p_campaign uuid, p_email text)
returns boolean language plpgsql security definer set search_path = public, auth as $$
declare v_user uuid;
begin
  if not mrpg_is_campaign_owner(p_campaign) then
    raise exception 'Só o proprietário pode compartilhar a campanha.';
  end if;
  select id into v_user from auth.users where lower(email) = lower(trim(p_email)) limit 1;
  if v_user is null or v_user = auth.uid() then return false; end if;
  insert into mrpg_campaign_members (campaign_id, user_id) values (p_campaign, v_user)
    on conflict do nothing;
  return true;
end $$;

-- E-mails dos participantes (só o dono enxerga)
create or replace function mrpg_campaign_member_emails(p_campaign uuid)
returns table (user_id uuid, email text) language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not mrpg_is_campaign_owner(p_campaign) then
    raise exception 'Só o proprietário pode ver os participantes.';
  end if;
  return query
    select m.user_id, u.email::text
    from mrpg_campaign_members m join auth.users u on u.id = m.user_id
    where m.campaign_id = p_campaign;
end $$;

-- ---------------------------------------------------------------------------
-- Conteúdo público da comunidade: todo mundo lê, só quem postou edita/apaga.
-- A declaração de autoria/responsabilidade é obrigatória no próprio banco.
-- ---------------------------------------------------------------------------
create table if not exists mrpg_books (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users(id) on delete cascade,
  title           text not null,
  author_name     text not null default '',
  system          text not null default 'Tormenta20',
  cover_url       text not null default '',
  file_url        text not null,           -- só link, sem upload de arquivo
  price_type      text not null default 'gratuita' check (price_type in ('gratuita','paga')),
  price_value     numeric(10,2) not null default 0,
  description     text not null default '',
  download_count  integer not null default 0,
  declares_original boolean not null check (declares_original),  -- "sou o autor e responsável"
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists mrpg_book_downloads (
  book_id       uuid not null references mrpg_books(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  downloaded_at timestamptz not null default now(),
  primary key (book_id, user_id)
);

create table if not exists mrpg_homebrew (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  type        text not null check (type in ('raca','classe','distincao','poder','magia','equipamento','ameaca','parceiro','origem','divindade')),
  name        text not null,
  author_name text not null default '',
  data        jsonb not null,              -- campos exigidos pelo tipo (validados no site)
  declares_original boolean not null check (declares_original),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table mrpg_books enable row level security;
alter table mrpg_book_downloads enable row level security;
alter table mrpg_homebrew enable row level security;

drop policy if exists "mrpg: livros são públicos" on mrpg_books;
create policy "mrpg: livros são públicos"
  on mrpg_books for select to anon, authenticated using (true);

drop policy if exists "mrpg: usuário publica livro em próprio nome" on mrpg_books;
create policy "mrpg: usuário publica livro em próprio nome"
  on mrpg_books for insert to authenticated with check (owner_id = auth.uid());

drop policy if exists "mrpg: só o autor edita o livro" on mrpg_books;
create policy "mrpg: só o autor edita o livro"
  on mrpg_books for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "mrpg: só o autor apaga o livro" on mrpg_books;
create policy "mrpg: só o autor apaga o livro"
  on mrpg_books for delete to authenticated using (owner_id = auth.uid());

drop policy if exists "mrpg: cada um vê os próprios downloads" on mrpg_book_downloads;
create policy "mrpg: cada um vê os próprios downloads"
  on mrpg_book_downloads for select to authenticated using (user_id = auth.uid());

drop policy if exists "mrpg: homebrew é público" on mrpg_homebrew;
create policy "mrpg: homebrew é público"
  on mrpg_homebrew for select to anon, authenticated using (true);

drop policy if exists "mrpg: usuário publica homebrew em próprio nome" on mrpg_homebrew;
create policy "mrpg: usuário publica homebrew em próprio nome"
  on mrpg_homebrew for insert to authenticated with check (owner_id = auth.uid());

drop policy if exists "mrpg: só o autor edita o homebrew" on mrpg_homebrew;
create policy "mrpg: só o autor edita o homebrew"
  on mrpg_homebrew for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "mrpg: só o autor apaga o homebrew" on mrpg_homebrew;
create policy "mrpg: só o autor apaga o homebrew"
  on mrpg_homebrew for delete to authenticated using (owner_id = auth.uid());

-- Contador de downloads: só sobe pela função (o autor não consegue editar o número)
create or replace function mrpg_register_download(p_book uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare v_count integer;
begin
  update mrpg_books set download_count = download_count + 1 where id = p_book
    returning download_count into v_count;
  if v_count is null then return null; end if;
  if auth.uid() is not null then
    insert into mrpg_book_downloads (book_id, user_id) values (p_book, auth.uid())
      on conflict (book_id, user_id) do update set downloaded_at = now();
  end if;
  return v_count;
end $$;

-- ---------------------------------------------------------------------------
-- Permissões de acesso às tabelas e funções (as políticas acima refinam)
-- ---------------------------------------------------------------------------
-- O Supabase concede permissões amplas por padrão em tabelas novas: zera tudo e concede só o necessário
revoke all on mrpg_characters, mrpg_companions, mrpg_campaigns, mrpg_campaign_members, mrpg_book_downloads, mrpg_books, mrpg_homebrew from anon, authenticated;
grant select, insert, update, delete on mrpg_characters, mrpg_companions, mrpg_campaigns to authenticated;
grant select, delete on mrpg_campaign_members to authenticated;
grant select on mrpg_book_downloads to authenticated;
grant select on mrpg_books, mrpg_homebrew to anon, authenticated;
grant insert, delete on mrpg_books, mrpg_homebrew to authenticated;
-- o autor só pode editar os campos de conteúdo (o download_count fica de fora)
grant update (title, author_name, system, cover_url, file_url, price_type, price_value, description, updated_at) on mrpg_books to authenticated;
grant update on mrpg_homebrew to authenticated;

revoke all on function mrpg_share_campaign(uuid, text) from public;
revoke all on function mrpg_campaign_member_emails(uuid) from public;
revoke all on function mrpg_register_download(uuid) from public;
grant execute on function mrpg_share_campaign(uuid, text) to authenticated;
grant execute on function mrpg_campaign_member_emails(uuid) to authenticated;
grant execute on function mrpg_register_download(uuid) to anon, authenticated;
grant execute on function mrpg_is_campaign_owner(uuid), mrpg_is_campaign_member(uuid) to authenticated;

commit;
