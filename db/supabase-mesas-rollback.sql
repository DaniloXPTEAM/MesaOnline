-- Desfaz db/supabase-mesas.sql: remove SÓ o que ele criou (funções e tabela mrpg_tables). Apaga as mesas cadastradas.
begin;
drop function if exists mrpg_table_rate(uuid, int);
drop function if exists mrpg_table_delete(uuid, text);
drop function if exists mrpg_table_update(uuid, text, jsonb);
drop function if exists mrpg_tables_list(text, text, text, text, text, int);
drop function if exists mrpg_table_by_code(text);
drop function if exists mrpg_table_create(jsonb);
drop function if exists mrpg_table_view(mrpg_tables, boolean);
drop table if exists mrpg_tables;
commit;
