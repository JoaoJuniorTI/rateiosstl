import { redirect } from "next/navigation";
import Galeria from "@/components/Galeria";
import { listarCategorias, listarStls } from "@/lib/dados";
import { emailAdmin, temAcesso } from "@/lib/sessao";

export const dynamic = "force-dynamic";

export default async function Inicio() {
  if (!(await temAcesso())) redirect("/entrar");
  const [stls, categorias, admin] = await Promise.all([listarStls(), listarCategorias(), emailAdmin()]);
  return <Galeria stls={stls} categorias={categorias} ehAdmin={admin !== null} />;
}
