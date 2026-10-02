-- ModernRPG — Mesas online no Supabase (projeto compartilhado com o Foundry Armada)
-- Só CRIA objetos novos com prefixo mrpg_ (1 tabela + 7 funções). Não altera nenhuma tabela, política,
-- função ou configuração de autenticação que já exista.
-- A tabela fica fechada (RLS ligada, nenhuma política): todo acesso passa pelas funções abaixo, que
-- nunca devolvem o token de gerenciamento a quem só lista ou entra por código.
-- Desfazer: db/supabase-mesas-rollback.sql
-- Rodar tudo de uma vez (uma transação: ou cria tudo, ou não cria nada).

begin;

create table if not exists mrpg_tables (
  id               uuid primary key default gen_random_uuid(),
  code             text not null unique,                 -- código curto da mesa (8 letras/números)
  management_token text not null,                        -- guardado só no navegador de quem criou
  name             text not null,
  system           text not null default 'Tormenta20',
  modality         text not null default 'online' check (modality in ('online', 'presencial')),
  price_type       text not null default 'gratuita' check (price_type in ('gratuita', 'paga')),
  price_value      numeric not null default 0,
  schedule         text not null default '',
  gm_name          text not null default '',
  seats_total      int  not null default 4,
  seats_filled     int  not null default 0,
  age_rating       text not null default 'livre',
  vtt_platform     text not null default '',
  description      text not null default '',
  image_url        text not null default '',
  contact_info     text not null default '',
  live_room_code   text not null default '',             -- sala ao vivo da Mesa (PeerJS); igual ao código da mesa
  kind             text not null default 'oneshot' check (kind in ('campanha', 'oneshot')),
  is_public        boolean not null default false,
  rating_sum       int  not null default 0,
  rating_count     int  not null default 0,
  created_at       timestamptz not null default now()
);

alter table mrpg_tables enable row level security;       -- sem políticas: acesso só pelas funções

create index if not exists mrpg_tables_public_idx on mrpg_tables (is_public, created_at desc);

-- Como a mesa aparece para quem consulta (camelCase, igual ao que o Portal já usa; sem o token).
create or replace function mrpg_table_view(t mrpg_tables, p_with_token boolean default false)
returns jsonb language sql immutable as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'id', t.id, 'code', t.code, 'name', t.name, 'system', t.system, 'modality', t.modality,
    'priceType', t.price_type, 'priceValue', t.price_value, 'schedule', t.schedule, 'gmName', t.gm_name,
    'seatsTotal', t.seats_total, 'seatsFilled', t.seats_filled, 'ageRating', t.age_rating,
    'vttPlatform', t.vtt_platform, 'description', t.description, 'imageUrl', t.image_url,
    'contactInfo', t.contact_info, 'liveRoomCode', t.live_room_code, 'kind', t.kind,
    'isPublic', t.is_public,
    'ratingAvg', case when t.rating_count > 0 then round(t.rating_sum::numeric / t.rating_count, 1) else null end,
    'ratingCount', t.rating_count, 'createdAt', t.created_at,
    'managementToken', case when p_with_token then t.management_token else null end
  ));
$$;

create or replace function mrpg_table_create(p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  new_code text;
  row_t mrpg_tables;
begin
  if coalesce(trim(p->>'name'), '') = '' then raise exception 'Nome da mesa é obrigatório.'; end if;
  loop
    new_code := '';
    for i in 1..8 loop new_code := new_code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1); end loop;
    exit when not exists (select 1 from mrpg_tables where code = new_code);
  end loop;
  insert into mrpg_tables (code, management_token, name, system, modality, price_type, price_value, schedule, gm_name,
                           seats_total, age_rating, vtt_platform, description, image_url, contact_info, live_room_code, kind, is_public)
  values (new_code, replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), left(trim(p->>'name'), 120), coalesce(left(p->>'system', 60), 'Tormenta20'),
          case when p->>'modality' = 'presencial' then 'presencial' else 'online' end,
          case when p->>'priceType' = 'paga' then 'paga' else 'gratuita' end,
          case when p->>'priceType' = 'paga' then greatest(0, coalesce((p->>'priceValue')::numeric, 0)) else 0 end,
          coalesce(left(p->>'schedule', 120), ''), coalesce(left(p->>'gmName', 120), ''),
          greatest(1, coalesce((p->>'seatsTotal')::int, 4)), coalesce(left(p->>'ageRating', 10), 'livre'),
          coalesce(left(p->>'vttPlatform', 120), 'Mesa de Arton (deste site)'), coalesce(left(p->>'description', 1500), ''),
          coalesce(left(p->>'imageUrl', 400000), ''), coalesce(left(p->>'contactInfo', 200), ''),
          coalesce(left(p->>'liveRoomCode', 12), ''), case when p->>'kind' = 'campanha' then 'campanha' else 'oneshot' end,
          coalesce((p->>'isPublic')::boolean, false))
  returning * into row_t;
  return mrpg_table_view(row_t, true);
end $$;

create or replace function mrpg_table_by_code(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare row_t mrpg_tables;
begin
  select * into row_t from mrpg_tables where code = upper(trim(p_code));
  if not found then raise exception 'Mesa não encontrada.'; end if;
  return mrpg_table_view(row_t);
end $$;

create or replace function mrpg_tables_list(p_system text default null, p_modality text default null, p_price text default null,
                                            p_q text default null, p_sort text default 'relevancia', p_page int default 1)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  page_size constant int := 12;
  total_rows int;
  rows_json jsonb;
begin
  select count(*) into total_rows from mrpg_tables t
   where t.is_public
     and (coalesce(p_system, '') = '' or t.system ilike '%' || p_system || '%')
     and (coalesce(p_modality, '') = '' or t.modality = p_modality)
     and (coalesce(p_price, '') = '' or t.price_type = p_price)
     and (coalesce(p_q, '') = '' or t.name ilike '%' || p_q || '%' or t.description ilike '%' || p_q || '%' or t.gm_name ilike '%' || p_q || '%');
  select coalesce(jsonb_agg(mrpg_table_view(x)), '[]'::jsonb) into rows_json from (
    select * from mrpg_tables t
     where t.is_public
       and (coalesce(p_system, '') = '' or t.system ilike '%' || p_system || '%')
       and (coalesce(p_modality, '') = '' or t.modality = p_modality)
       and (coalesce(p_price, '') = '' or t.price_type = p_price)
       and (coalesce(p_q, '') = '' or t.name ilike '%' || p_q || '%' or t.description ilike '%' || p_q || '%' or t.gm_name ilike '%' || p_q || '%')
     order by case when p_sort = 'vagas' then (t.seats_total - t.seats_filled) end desc nulls last,
              case when p_sort = 'relevancia' then (case when t.rating_count > 0 then t.rating_sum::numeric / t.rating_count else 0 end) end desc nulls last,
              t.created_at desc
     offset (greatest(coalesce(p_page, 1), 1) - 1) * page_size limit page_size
  ) x;
  return jsonb_build_object('tables', rows_json, 'total', total_rows, 'hasMore', total_rows > greatest(coalesce(p_page, 1), 1) * page_size);
end $$;

create or replace function mrpg_table_update(p_id uuid, p_token text, p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare row_t mrpg_tables;
begin
  update mrpg_tables set
    name = coalesce(left(p->>'name', 120), name), system = coalesce(left(p->>'system', 60), system),
    modality = case when p->>'modality' in ('online', 'presencial') then p->>'modality' else modality end,
    price_type = case when p->>'priceType' in ('gratuita', 'paga') then p->>'priceType' else price_type end,
    price_value = coalesce((p->>'priceValue')::numeric, price_value), schedule = coalesce(left(p->>'schedule', 120), schedule),
    gm_name = coalesce(left(p->>'gmName', 120), gm_name), seats_total = coalesce((p->>'seatsTotal')::int, seats_total),
    seats_filled = coalesce((p->>'seatsFilled')::int, seats_filled), age_rating = coalesce(left(p->>'ageRating', 10), age_rating),
    vtt_platform = coalesce(left(p->>'vttPlatform', 120), vtt_platform), description = coalesce(left(p->>'description', 1500), description),
    image_url = coalesce(left(p->>'imageUrl', 400000), image_url), contact_info = coalesce(left(p->>'contactInfo', 200), contact_info),
    live_room_code = coalesce(left(p->>'liveRoomCode', 12), live_room_code),
    kind = case when p->>'kind' in ('campanha', 'oneshot') then p->>'kind' else kind end,
    is_public = coalesce((p->>'isPublic')::boolean, is_public)
   where id = p_id and management_token = p_token
   returning * into row_t;
  if not found then raise exception 'Mesa não encontrada ou token inválido.'; end if;
  return mrpg_table_view(row_t);
end $$;

create or replace function mrpg_table_delete(p_id uuid, p_token text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  delete from mrpg_tables where id = p_id and management_token = p_token;
  return found;
end $$;

create or replace function mrpg_table_rate(p_id uuid, p_value int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare row_t mrpg_tables;
begin
  if p_value < 1 or p_value > 5 then raise exception 'Nota de 1 a 5.'; end if;
  update mrpg_tables set rating_sum = rating_sum + p_value, rating_count = rating_count + 1 where id = p_id returning * into row_t;
  if not found then raise exception 'Mesa não encontrada.'; end if;
  return jsonb_build_object('ratingAvg', round(row_t.rating_sum::numeric / row_t.rating_count, 1), 'ratingCount', row_t.rating_count);
end $$;

grant execute on function mrpg_table_create(jsonb), mrpg_table_by_code(text), mrpg_tables_list(text, text, text, text, text, int),
  mrpg_table_update(uuid, text, jsonb), mrpg_table_delete(uuid, text), mrpg_table_rate(uuid, int) to anon, authenticated;

commit;
