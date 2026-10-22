import { redirect } from "next/navigation";
import { AvisoLegal } from "@/components/Aviso";
import { temAcesso } from "@/lib/sessao";
import FormSenha from "./FormSenha";

export const dynamic = "force-dynamic";

export default async function PaginaEntrar() {
  if (await temAcesso()) redirect("/");
  return (
    <main className="portao">
      <div className="portao-caixa">
        <div className="marca">
          <img src="/icon.svg" alt="" />
          rateios<span>stl</span>
        </div>
        <p>Catálogo de STLs adquiridos por rateio comunitário. Digite a senha para ver.</p>
        <FormSenha />
      </div>
      <AvisoLegal />
    </main>
  );
}
