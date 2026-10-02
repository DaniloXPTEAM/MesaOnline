-- Desfaz db/supabase-schema.sql: remove SOMENTE os objetos mrpg_ criados por ele.
-- Não toca em nada do Foundry Armada. Apaga os dados que estiverem nessas tabelas.

begin;

drop function if exists mrpg_register_download(uuid);
drop function if exists mrpg_campaign_member_emails(uuid);
drop function if exists mrpg_share_campaign(uuid, text);

drop table if exists mrpg_book_downloads;
drop table if exists mrpg_books;
drop table if exists mrpg_homebrew;
drop table if exists mrpg_campaign_members;
drop table if exists mrpg_campaigns;
drop table if exists mrpg_companions;
drop table if exists mrpg_characters;

drop function if exists mrpg_is_campaign_member(uuid);
drop function if exists mrpg_is_campaign_owner(uuid);

commit;
