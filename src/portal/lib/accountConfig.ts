/**
 * Quando true, as áreas pessoais (personagens, campanhas, parceiros, ficha) exigem login.
 * Fica desligado enquanto os dados ainda vivem só no navegador: ligar antes da migração
 * dos dados para a conta (Supabase) deixaria o site inutilizável sem servidor.
 */
export const REQUIRE_LOGIN_FOR_PERSONAL_DATA = false;
