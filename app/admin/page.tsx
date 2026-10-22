import BotaoGoogle from "@/components/BotaoGoogle";
import { listarCategorias, listarStls } from "@/lib/dados";
import { emailAdmin, lerConfiguracao } from "@/lib/sessao";
import { supabaseAuth } from "@/lib/supabase";
import { sair } from "./acoes";
import PainelAdmin from "./PainelAdmin";

export const dynamic = "force-dynamic";

export default async function PaginaAdmin({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const admin = await emailAdmin();

  if (!admin) {
    const { data } = await (await supabaseAuth()).auth.getUser();
    const outroEmail = data.user?.email;
    const { erro } = await searchParams;
    return (
      <main className="portao">
        <div className="portao-caixa">
          <div className="marca">
            <img src="/icon.svg" alt="" />
            rateios<span>stl</span>
          </div>
          <p>Painel do administrador</p>
          <div className="pilha">
            {outroEmail ? (
              <>
                <p className="mensagem erro">A conta {outroEmail} não tem permissão para acessar o painel.</p>
                <form action={sair}>
                  <button className="botao largo secundario">Sair e usar outra conta</button>
                </form>
              </>
            ) : (
              <>
                {erro && <p className="mensagem erro">Não foi possível entrar. Tente de novo.</p>}
                <BotaoGoogle />
              </>
            )}
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
              <span className="email-admin">{admin}</span>
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
