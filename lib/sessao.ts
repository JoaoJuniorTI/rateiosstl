import "server-only";
import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { supabaseAdmin, supabaseAuth } from "./supabase";

const scrypt = promisify(scryptCb) as (senha: string, salt: Buffer, tamanho: number) => Promise<Buffer>;

export const COOKIE_ACESSO = "rateio_acesso";
export const DURACAO_ACESSO_S = 60 * 60 * 24 * 30; // 30 dias

export async function gerarHash(senha: string) {
  const salt = randomBytes(16);
  const hash = await scrypt(senha, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export async function conferirHash(senha: string, guardado: string) {
  const [saltHex, hashHex] = guardado.split(":");
  if (!saltHex || !hashHex) return false;
  const esperado = Buffer.from(hashHex, "hex");
  const calculado = await scrypt(senha, Buffer.from(saltHex, "hex"), esperado.length);
  return timingSafeEqual(esperado, calculado);
}

function assinar(texto: string) {
  return createHmac("sha256", process.env.SESSION_SECRET!).update(texto).digest("hex");
}

// Token do cookie: "<versão da senha>.<expira em>.<assinatura>"
export function criarToken(versao: number) {
  const expira = Math.floor(Date.now() / 1000) + DURACAO_ACESSO_S;
  const corpo = `${versao}.${expira}`;
  return `${corpo}.${assinar(corpo)}`;
}

function lerToken(token: string | undefined) {
  if (!token) return null;
  const [versao, expira, assinatura] = token.split(".");
  if (!versao || !expira || !assinatura) return null;
  const esperado = Buffer.from(assinar(`${versao}.${expira}`));
  const recebido = Buffer.from(assinatura);
  if (esperado.length !== recebido.length || !timingSafeEqual(esperado, recebido)) return null;
  if (Number(expira) < Date.now() / 1000) return null;
  return { versao: Number(versao) };
}

export async function lerConfiguracao() {
  const { data, error } = await supabaseAdmin()
    .from("configuracoes")
    .select("senha_hash, senha_versao")
    .eq("id", 1)
    .single();
  if (error) throw new Error(`Falha ao ler configurações: ${error.message}`);
  return data as { senha_hash: string | null; senha_versao: number };
}

// E-mail do admin logado com Google, ou null.
export async function emailAdmin() {
  const supabase = await supabaseAuth();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email?.toLowerCase();
  const permitido = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return email && permitido && email === permitido ? email : null;
}

// Visitante liberado pela senha do site, ou admin logado.
export async function temAcesso() {
  const token = lerToken((await cookies()).get(COOKIE_ACESSO)?.value);
  if (token) {
    const config = await lerConfiguracao();
    if (config.senha_hash && token.versao === config.senha_versao) return true;
  }
  return (await emailAdmin()) !== null;
}
