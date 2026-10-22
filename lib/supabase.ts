import "server-only";
import { createClient } from "@supabase/supabase-js";

export const BUCKET = "fotos";

// Acesso total ao banco. Só roda no servidor, nunca vai para o navegador.
export function supabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
