import { redirect } from "next/navigation";
import Galeria from "@/components/Galeria";
import { listarCategorias, listarStls } from "@/lib/dados";
import { ehAdmin, temAcesso } from "@/lib/sessao";

export const dynamic = "force-dynamic";

export default async function Inicio() {
  if (!(await temAcesso())) redirect("/entrar");
  const [stls, categorias, admin] = await Promise.all([listarStls(), listarCategorias(), ehAdmin()]);
  return <Galeria stls={stls} categorias={categorias} ehAdmin={admin} />;
}
