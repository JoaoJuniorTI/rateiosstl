"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { lerValor, limparEmail, limparInstagram, limparWhatsapp } from "@/lib/contato";
import { COOKIE_ADMIN, DURACAO_ADMIN_S, conferirAdmin, ehAdmin, gerarHash, lerConfiguracao, opcoesCookie, tokenAdmin } from "@/lib/sessao";
import { BUCKET, supabaseAdmin } from "@/lib/supabase";
import { NOVA_CATEGORIA } from "@/lib/tipos";

export type Resultado = { ok: boolean; mensagem: string; vez?: number } | null;

const TIPOS_FOTO = ["image/webp", "image/jpeg", "image/png"];
const TAMANHO_MAX_FOTO = 3 * 1024 * 1024;

async function exigirAdmin() {
  if (!(await ehAdmin())) throw new Error("Acesso negado.");
}

function atualizarPaginas() {
  revalidatePath("/");
  revalidatePath("/admin");
}

const erro = (mensagem: string): Resultado => ({ ok: false, mensagem });
const sucesso = (mensagem: string): Resultado => ({ ok: true, mensagem, vez: Date.now() });

// Devolve o id da categoria com esse nome, criando-a se não existir.
async function obterOuCriarCategoria(nome: string) {
  const supabase = supabaseAdmin();
  const { data: existente } = await supabase.from("categorias").select("id").ilike("nome", nome.replace(/[%_\\]/g, "\\$&")).maybeSingle();
  if (existente) return existente.id as string;
  const { data, error } = await supabase.from("categorias").insert({ nome }).select("id").single();
  if (error) throw new Error(`Não foi possível criar a categoria: ${error.message}`);
  return data.id as string;
}

export async function salvarStl(_anterior: Resultado, form: FormData): Promise<Resultado> {
  await exigirAdmin();
  const supabase = supabaseAdmin();

  const id = String(form.get("id") ?? "");
  const nome = String(form.get("nome") ?? "").trim();
  const comprador = String(form.get("comprador") ?? "").trim();
  const whatsapp = limparWhatsapp(String(form.get("whatsapp") ?? "")) || null;
  const email = limparEmail(String(form.get("email") ?? "")) || null;
  const instagram = limparInstagram(String(form.get("instagram") ?? "")) || null;
  const valor = lerValor(String(form.get("valor") ?? ""));
  const foto = form.get("foto");
  const temFoto = foto instanceof File && foto.size > 0;

  let categoriaId = String(form.get("categoria_id") ?? "");
  const novaCategoria = String(form.get("nova_categoria") ?? "").trim();

  if (!nome) return erro("Informe o nome do STL.");
  if (!comprador) return erro("Informe o nome de quem comprou.");
  if (!whatsapp && !email && !instagram) return erro("Informe pelo menos um contato: WhatsApp, e-mail ou Instagram.");
  if (whatsapp && (whatsapp.length < 12 || whatsapp.length > 15)) return erro("WhatsApp inválido. Use DDD + número, ex.: (11) 98765-4321.");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return erro("E-mail inválido.");
  if (instagram && !/^[A-Za-z0-9._]{1,30}$/.test(instagram)) return erro("Usuário do Instagram inválido.");
  if (valor !== null && (Number.isNaN(valor) || valor > 99_999_999)) return erro("Valor inválido. Use o formato 25,00.");
  if (categoriaId === NOVA_CATEGORIA && !novaCategoria) return erro("Digite o nome da nova categoria.");
  if (!categoriaId) return erro("Escolha uma categoria.");
  if (!id && !temFoto) return erro("Escolha uma foto.");
  if (temFoto && !TIPOS_FOTO.includes(foto.type)) return erro("A foto precisa ser JPG, PNG ou WebP.");
  if (temFoto && foto.size > TAMANHO_MAX_FOTO) return erro("A foto passou de 3 MB.");

  try {
    if (categoriaId === NOVA_CATEGORIA) categoriaId = await obterOuCriarCategoria(novaCategoria);
  } catch (e) {
    return erro((e as Error).message);
  }

  let fotoPath: string | undefined;
  if (temFoto) {
    const extensao = foto.type.split("/")[1].replace("jpeg", "jpg");
    fotoPath = `${randomUUID()}.${extensao}`;
    const { error } = await supabase.storage.from(BUCKET).upload(fotoPath, foto, { contentType: foto.type });
    if (error) return erro(`Falha ao enviar a foto: ${error.message}`);
  }

  const dados = { nome, comprador, whatsapp, email, instagram, valor, categoria_id: categoriaId, ...(fotoPath && { foto_path: fotoPath }) };

  if (id) {
    const { data: antigo } = await supabase.from("stls").select("foto_path").eq("id", id).single();
    const { error } = await supabase.from("stls").update(dados).eq("id", id);
    if (error) {
      if (fotoPath) await supabase.storage.from(BUCKET).remove([fotoPath]);
      return erro(`Falha ao salvar: ${error.message}`);
    }
    if (fotoPath && antigo?.foto_path) await supabase.storage.from(BUCKET).remove([antigo.foto_path]);
    atualizarPaginas();
    return sucesso(`“${nome}” atualizado.`);
  }

  const { error } = await supabase.from("stls").insert(dados);
  if (error) {
    if (fotoPath) await supabase.storage.from(BUCKET).remove([fotoPath]);
    return erro(`Falha ao cadastrar: ${error.message}`);
  }
  atualizarPaginas();
  return sucesso(`“${nome}” cadastrado.`);
}

export async function excluirStl(id: string): Promise<Resultado> {
  await exigirAdmin();
  const supabase = supabaseAdmin();
  const { data, error } = await supabase.from("stls").delete().eq("id", id).select("foto_path").single();
  if (error) return erro(`Falha ao excluir: ${error.message}`);
  await supabase.storage.from(BUCKET).remove([data.foto_path]);
  atualizarPaginas();
  return sucesso("STL excluído.");
}

export async function criarCategoria(_anterior: Resultado, form: FormData): Promise<Resultado> {
  await exigirAdmin();
  const nome = String(form.get("nome") ?? "").trim();
  if (!nome) return erro("Digite o nome da categoria.");
  try {
    await obterOuCriarCategoria(nome);
  } catch (e) {
    return erro((e as Error).message);
  }
  atualizarPaginas();
  return sucesso(`Categoria “${nome}” pronta.`);
}

export async function excluirCategoria(id: string): Promise<Resultado> {
  await exigirAdmin();
  const { error } = await supabaseAdmin().from("categorias").delete().eq("id", id);
  // 23503 = ainda existem STLs usando esta categoria
  if (error) return erro(error.code === "23503" ? "Essa categoria ainda tem STLs. Mude ou exclua esses STLs antes." : error.message);
  atualizarPaginas();
  return sucesso("Categoria excluída.");
}

export async function trocarSenha(_anterior: Resultado, form: FormData): Promise<Resultado> {
  await exigirAdmin();
  const senha = String(form.get("senha") ?? "");
  const confirmacao = String(form.get("confirmacao") ?? "");
  if (senha.length < 4) return erro("Use pelo menos 4 caracteres.");
  if (senha !== confirmacao) return erro("As duas senhas não são iguais.");

  const config = await lerConfiguracao();
  const { error } = await supabaseAdmin()
    .from("configuracoes")
    .update({ senha_hash: await gerarHash(senha), senha_versao: config.senha_versao + 1 })
    .eq("id", 1);
  if (error) return erro(`Falha ao salvar a senha: ${error.message}`);
  return sucesso("Senha alterada. Quem estava com a senha antiga vai precisar digitar a nova.");
}

export async function entrarAdmin(_anterior: string | null, form: FormData): Promise<string | null> {
  const usuario = String(form.get("usuario") ?? "");
  const senha = String(form.get("senha") ?? "");
  if (!conferirAdmin(usuario, senha)) {
    // Pequena espera para atrasar quem tenta adivinhar a senha.
    await new Promise((r) => setTimeout(r, 1000));
    return "Usuário ou senha incorretos.";
  }
  (await cookies()).set(COOKIE_ADMIN, tokenAdmin(), opcoesCookie(DURACAO_ADMIN_S));
  redirect("/admin");
}

export async function sair() {
  (await cookies()).delete(COOKIE_ADMIN);
  redirect("/admin");
}
