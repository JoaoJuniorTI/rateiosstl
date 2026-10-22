"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_ACESSO, DURACAO_ACESSO_S, conferirHash, lerConfiguracao, opcoesCookie, tokenVisitante } from "@/lib/sessao";

export async function entrar(_anterior: string | null, form: FormData): Promise<string | null> {
  const senha = String(form.get("senha") ?? "");
  const config = await lerConfiguracao();

  if (!config.senha_hash) return "O site ainda não tem senha definida. O administrador precisa criá-la no painel.";
  if (!senha || !(await conferirHash(senha, config.senha_hash))) return "Senha incorreta.";

  (await cookies()).set(COOKIE_ACESSO, tokenVisitante(config.senha_versao), opcoesCookie(DURACAO_ACESSO_S));
  redirect("/");
}
