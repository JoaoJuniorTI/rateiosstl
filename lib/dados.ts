import "server-only";
import { BUCKET, supabaseAdmin } from "./supabase";
import type { Categoria, Stl } from "./tipos";

const VALIDADE_FOTO_S = 60 * 60 * 6; // links das fotos valem 6 horas

export async function listarCategorias(): Promise<Categoria[]> {
  const { data, error } = await supabaseAdmin().from("categorias").select("id, nome").order("nome");
  if (error) throw new Error(`Falha ao listar categorias: ${error.message}`);
  return data;
}

export async function listarStls(): Promise<Stl[]> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("stls")
    .select("id, nome, categoria_id, comprador, whatsapp, email, instagram, valor, foto_path, criado_em, categorias(nome)")
    .order("criado_em", { ascending: false });
  if (error) throw new Error(`Falha ao listar STLs: ${error.message}`);
  if (data.length === 0) return [];

  const { data: links } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(data.map((s) => s.foto_path), VALIDADE_FOTO_S);
  const urlPorPath = new Map((links ?? []).map((l) => [l.path, l.signedUrl]));

  return data.map(({ categorias, ...s }) => ({
    ...s,
    valor: s.valor === null ? null : Number(s.valor),
    categoria: (categorias as unknown as { nome: string } | null)?.nome ?? "",
    foto_url: urlPorPath.get(s.foto_path) ?? "",
  }));
}
