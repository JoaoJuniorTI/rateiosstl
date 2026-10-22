import { listarCategorias, listarStls } from "@/lib/dados";
import { ehAdmin, lerConfiguracao } from "@/lib/sessao";
import { sair } from "./acoes";
import FormLoginAdmin from "./FormLoginAdmin";
import PainelAdmin from "./PainelAdmin";

export const dynamic = "force-dynamic";

export default async function PaginaAdmin() {
  if (!(await ehAdmin())) {
    return (
      <main className="portao">
        <div className="portao-caixa">
          <div className="marca">
            <img src="/icon.svg" alt="" />
            rateios<span>stl</span>
          </div>
          <p>Painel do administrador</p>
          <div className="pilha">
            <FormLoginAdmin />
            <a href="/" style={{ fontSize: 13 }}>
              Voltar ao catálogo
            </a>
          </div>
        </div>
      </main>
    );
  }

  const [stls, categorias, config] = await Promise.all([listarStls(), listarCategorias(), lerConfiguracao()]);

  return (
    <>
      <header className="topo">
        <div className="container">
          <div className="topo-linha">
            <a className="marca" href="/">
              <img src="/icon.svg" alt="" />
              rateios<span>stl</span>
            </a>
            <div className="topo-admin">
              <a className="botao pequeno secundario" href="/">
                Ver catálogo
              </a>
              <form action={sair}>
                <button className="botao pequeno secundario">Sair</button>
              </form>
            </div>
          </div>
        </div>
      </header>
      <PainelAdmin stls={stls} categorias={categorias} senhaDefinida={!!config.senha_hash} />
    </>
  );
}
