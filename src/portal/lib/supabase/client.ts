/**
 * Cliente Supabase do ModernRPG (mesmo projeto do Foundry Armada).
 * Usa só a URL e a chave pública (anon), lidas de .env.local — o acesso aos dados é
 * limitado pelas políticas de RLS do banco. Sem as variáveis, `supabase` é null e o
 * site continua funcionando só com os dados locais do navegador.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env?.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null;
export const supabaseConfigured = supabase !== null;
