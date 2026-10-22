import "server-only";
import { createHash, createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { supabaseAdmin } from "./supabase";

const scrypt = promisify(scryptCb) as (senha: string, salt: Buffer, tamanho: number) => Promise<Buffer>;

export const COOKIE_ACESSO = "rateio_acesso";
export const DURACAO_ACESSO_S = 60 * 60 * 24 * 30; // 30 dias
export const COOKIE_ADMIN = "rateio_admin";
export const DURACAO_ADMIN_S = 60 * 60 * 24 * 7; // 7 dias

export const opcoesCookie = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});

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

function iguais(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

function assinar(texto: string) {
  return createHmac("sha256", process.env.SESSION_SECRET!).update(texto).digest("hex");
}

// Token do cookie: "<marca>.<expira em>.<assinatura>"
function criarToken(marca: string, duracaoS: number) {
  const expira = Math.floor(Date.now() / 1000) + duracaoS;
  const corpo = `${marca}.${expira}`;
  return `${corpo}.${assinar(corpo)}`;
}

function lerToken(token: string | undefined) {
  if (!token) return null;
  const [marca, expira, assinatura] = token.split(".");
  if (!marca || !expira || !assinatura) return null;
  if (!iguais(assinar(`${marca}.${expira}`), assinatura)) return null;
  if (Number(expira) < Date.now() / 1000) return null;
  return marca;
}

// ---------- Senha do site (visitantes) ----------

export const tokenVisitante = (versao: number) => criarToken(`v${versao}`, DURACAO_ACESSO_S);

export async function lerConfiguracao() {
  const { data, error } = await supabaseAdmin()
    .from("configuracoes")
    .select("senha_hash, senha_versao")
    .eq("id", 1)
    .single();
  if (error) throw new Error(`Falha ao ler configurações: ${error.message}`);
  return data as { senha_hash: string | null; senha_versao: number };
}

// ---------- Administrador (usuário e senha nas variáveis da Vercel) ----------

// A marca do token muda junto com a senha do admin: trocar ADMIN_SENHA derruba as sessões antigas.
function marcaAdmin() {
  const digest = createHash("sha256").update(`${process.env.ADMIN_USUARIO}:${process.env.ADMIN_SENHA}`).digest("hex");
  return `a${digest.slice(0, 16)}`;
}

export const tokenAdmin = () => criarToken(marcaAdmin(), DURACAO_ADMIN_S);

export function conferirAdmin(usuario: string, senha: string) {
  const usuarioCerto = process.env.ADMIN_USUARIO ?? "";
  const senhaCerta = process.env.ADMIN_SENHA ?? "";
  if (!usuarioCerto || !senhaCerta) return false;
  // Compara os dois sempre, para não revelar qual deles está errado pelo tempo de resposta.
  const usuarioOk = iguais(usuario.trim().toLowerCase(), usuarioCerto.trim().toLowerCase());
  const senhaOk = iguais(senha, senhaCerta);
  return usuarioOk && senhaOk;
}

export async function ehAdmin() {
  return lerToken((await cookies()).get(COOKIE_ADMIN)?.value) === marcaAdmin();
}

// Visitante liberado pela senha do site, ou admin logado.
export async function temAcesso() {
  if (await ehAdmin()) return true;
  const marca = lerToken((await cookies()).get(COOKIE_ACESSO)?.value);
  if (!marca) return false;
  const config = await lerConfiguracao();
  return !!config.senha_hash && marca === `v${config.senha_versao}`;
}
