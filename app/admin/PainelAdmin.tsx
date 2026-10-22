"use client";

import Fuse from "fuse.js";
import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { formatarValor, formatarWhatsapp, valorParaCampo } from "@/lib/contato";
import { semLimpar } from "@/lib/formulario";
import { NOVA_CATEGORIA, type Categoria, type Stl } from "@/lib/tipos";
import { criarCategoria, excluirCategoria, excluirStl, salvarStl, trocarSenha, type Resultado } from "./acoes";
import Enquadrador from "./Enquadrador";

type Props = { stls: Stl[]; categorias: Categoria[]; senhaDefinida: boolean };

export default function PainelAdmin({ stls, categorias, senhaDefinida }: Props) {
  const [editando, setEditando] = useState<Stl | null>(null);
  const formulario = useRef<HTMLElement>(null);

  function editar(stl: Stl) {
    setEditando(stl);
    formulario.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="container admin">
      <div className="coluna">
        {!senhaDefinida && (
          <p className="mensagem erro">
            O site ainda não tem senha de acesso. Defina uma em “Senha do site” para os visitantes conseguirem entrar.
          </p>
        )}
        <section className="secao" ref={formulario}>
          <FormStl key={editando?.id ?? "novo"} stl={editando} categorias={categorias} aoTerminar={() => setEditando(null)} />
        </section>
        <SecaoCategorias stls={stls} categorias={categorias} />
        <SecaoSenha />
      </div>
      <ListaStls stls={stls} editandoId={editando?.id} aoEditar={editar} aoExcluir={(id) => editando?.id === id && setEditando(null)} />
    </main>
  );
}

// ---------- Cadastro / edição ----------

function FormStl({ stl, categorias, aoTerminar }: { stl: Stl | null; categorias: Categoria[]; aoTerminar: () => void }) {
  const [resultado, acao, salvando] = useActionState<Resultado, FormData>(salvarStl, null);
  const [foto, setFoto] = useState<File | null>(null);
  const [previa, setPrevia] = useState<string | null>(stl?.foto_url ?? null);
  // Imagem original (sem recorte), para poder reenquadrar quantas vezes quiser.
  const [original, setOriginal] = useState<string | null>(stl?.foto_url ?? null);
  const [enquadrando, setEnquadrando] = useState(false);
  const [erroFoto, setErroFoto] = useState<string | null>(null);
  const [categoria, setCategoria] = useState(stl?.categoria_id ?? (categorias.length ? "" : NOVA_CATEGORIA));
  const form = useRef<HTMLFormElement>(null);
  const inputFoto = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!resultado?.ok) return;
    if (stl) return aoTerminar();
    form.current?.reset();
    setFoto(null);
    setPrevia(null);
    setOriginal(null);
    setCategoria(categorias.length ? "" : NOVA_CATEGORIA);
  }, [resultado?.vez]);

  function escolherFoto(arquivo: File | undefined) {
    setErroFoto(null);
    if (inputFoto.current) inputFoto.current.value = "";
    if (!arquivo) return;
    setOriginal(URL.createObjectURL(arquivo));
    setEnquadrando(true);
  }

  function confirmarEnquadramento(arquivo: File) {
    setFoto(arquivo);
    setPrevia(URL.createObjectURL(arquivo));
    setEnquadrando(false);
  }

  function falhaEnquadramento(mensagem: string) {
    setErroFoto(mensagem);
    setEnquadrando(false);
  }

  function enviar(dados: FormData) {
    dados.delete("arquivo");
    if (foto) dados.set("foto", foto);
    acao(dados);
  }

  return (
    <>
      <h2>{stl ? "Editar STL" : "Cadastrar STL"}</h2>
      <form ref={form} onSubmit={semLimpar(enviar)} className="pilha">
        {stl && <input type="hidden" name="id" value={stl.id} />}

        <div className="campo">
          <span className="rotulo">Foto</span>
          {enquadrando && original ? (
            <Enquadrador fonte={original} aoConfirmar={confirmarEnquadramento} aoCancelar={() => setEnquadrando(false)} aoFalhar={falhaEnquadramento} />
          ) : (
            <div className="foto-escolha">
              {previa ? <img className="foto-previa" src={previa} alt="" /> : <div className="foto-previa vazia">Sem foto</div>}
              <div className="pilha" style={{ gap: 6 }}>
                <input ref={inputFoto} name="arquivo" type="file" accept="image/*" onChange={(e) => escolherFoto(e.target.files?.[0])} />
                {original && (
                  <button type="button" className="botao pequeno secundario" style={{ alignSelf: "flex-start" }} onClick={() => setEnquadrando(true)}>
                    Ajustar enquadramento
                  </button>
                )}
                <span className="dica">{stl ? "Escolha outra só se quiser trocar." : "Depois de escolher, você ajusta o enquadramento."}</span>
              </div>
            </div>
          )}
          {erroFoto && <p className="mensagem erro">{erroFoto}</p>}
        </div>

        <div className="campo">
          <label htmlFor="nome">Nome do STL</label>
          <input id="nome" name="nome" defaultValue={stl?.nome} required maxLength={120} />
        </div>

        <div className="campo">
          <label htmlFor="categoria_id">Categoria</label>
          <select id="categoria_id" name="categoria_id" value={categoria} onChange={(e) => setCategoria(e.target.value)} required>
            <option value="" disabled>
              Escolha…
            </option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
            <option value={NOVA_CATEGORIA}>+ Criar nova categoria…</option>
          </select>
          {categoria === NOVA_CATEGORIA && <input name="nova_categoria" placeholder="Nome da nova categoria" required maxLength={40} autoFocus={categorias.length > 0} />}
        </div>

        <div className="campo">
          <label htmlFor="comprador">Nome de quem comprou</label>
          <input id="comprador" name="comprador" defaultValue={stl?.comprador} required maxLength={80} />
        </div>

        <div className="campo">
          <label htmlFor="valor">Valor do rateio (opcional)</label>
          <div className="campo-moeda">
            <span>R$</span>
            <input id="valor" name="valor" inputMode="decimal" placeholder="25,00" defaultValue={stl?.valor != null ? valorParaCampo(stl.valor) : ""} maxLength={14} />
          </div>
        </div>

        <fieldset className="contatos-grupo">
          <legend>Contato (preencha pelo menos um)</legend>
          <div className="campo">
            <label htmlFor="whatsapp">WhatsApp</label>
            <input id="whatsapp" name="whatsapp" type="tel" inputMode="tel" placeholder="(11) 98765-4321" defaultValue={stl?.whatsapp ? formatarWhatsapp(stl.whatsapp) : ""} />
          </div>
          <div className="campo">
            <label htmlFor="email">E-mail</label>
            <input id="email" name="email" type="email" placeholder="nome@exemplo.com" defaultValue={stl?.email ?? ""} />
          </div>
          <div className="campo">
            <label htmlFor="instagram">Instagram</label>
            <input id="instagram" name="instagram" placeholder="@usuario" defaultValue={stl?.instagram ? `@${stl.instagram}` : ""} />
          </div>
        </fieldset>

        {resultado && <p className={`mensagem ${resultado.ok ? "sucesso" : "erro"}`}>{resultado.mensagem}</p>}

        <div style={{ display: "flex", gap: 8 }}>
          <button className="botao" disabled={salvando} style={{ flex: 1 }}>
            {salvando ? "Salvando…" : stl ? "Salvar alterações" : "Cadastrar"}
          </button>
          {stl && (
            <button type="button" className="botao secundario" onClick={aoTerminar}>
              Cancelar
            </button>
          )}
        </div>
      </form>
    </>
  );
}

// ---------- Lista de STLs ----------

function ListaStls({ stls, editandoId, aoEditar, aoExcluir }: { stls: Stl[]; editandoId?: string; aoEditar: (s: Stl) => void; aoExcluir: (id: string) => void }) {
  const [filtro, setFiltro] = useState("");
  const [pendente, iniciar] = useTransition();
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<Resultado>(null);

  const fuse = useMemo(() => new Fuse(stls, { keys: ["nome", "categoria", "comprador"], threshold: 0.3, ignoreLocation: true, ignoreDiacritics: true }), [stls]);
  const visiveis = filtro.trim() ? fuse.search(filtro.trim()).map((r) => r.item) : stls;

  function excluir(stl: Stl) {
    if (!confirm(`Excluir “${stl.nome}”? Essa ação não pode ser desfeita.`)) return;
    setExcluindo(stl.id);
    iniciar(async () => {
      const r = await excluirStl(stl.id);
      setMensagem(r);
      if (r?.ok) aoExcluir(stl.id);
      setExcluindo(null);
    });
  }

  return (
    <section className="secao">
      <h2>STLs cadastrados ({stls.length})</h2>
      {stls.length > 0 && (
        <div className="campo" style={{ marginBottom: 8 }}>
          <input type="search" placeholder="Filtrar por nome, categoria ou comprador…" value={filtro} onChange={(e) => setFiltro(e.target.value)} aria-label="Filtrar STLs" />
        </div>
      )}
      {mensagem && !mensagem.ok && <p className="mensagem erro">{mensagem.mensagem}</p>}
      {stls.length === 0 ? (
        <p className="dica" style={{ color: "var(--texto-suave)" }}>
          Nenhum STL ainda. Use o formulário ao lado para cadastrar o primeiro.
        </p>
      ) : (
        <ul className="lista">
          {visiveis.map((s) => (
            <li key={s.id} style={editandoId === s.id ? { background: "var(--destaque-claro)", margin: "0 -8px", padding: "10px 8px", borderRadius: 10 } : undefined}>
              <img src={s.foto_url} alt="" loading="lazy" />
              <div className="info">
                <strong>{s.nome}</strong>
                <span>
                  {s.categoria} · {s.comprador}
                  {s.valor != null && <> · {formatarValor(s.valor)}</>}
                </span>
              </div>
              <div className="acoes">
                <button className="botao pequeno secundario" onClick={() => aoEditar(s)}>
                  Editar
                </button>
                <button className="botao pequeno perigo" onClick={() => excluir(s)} disabled={pendente && excluindo === s.id}>
                  {pendente && excluindo === s.id ? "…" : "Excluir"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ---------- Categorias ----------

function SecaoCategorias({ stls, categorias }: { stls: Stl[]; categorias: Categoria[] }) {
  const [resultado, acao, salvando] = useActionState<Resultado, FormData>(criarCategoria, null);
  const [mensagem, setMensagem] = useState<Resultado>(null);
  const [pendente, iniciar] = useTransition();
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (resultado?.ok) form.current?.reset();
    setMensagem(resultado);
  }, [resultado]);

  const uso = (id: string) => stls.filter((s) => s.categoria_id === id).length;

  function excluir(c: Categoria) {
    if (!confirm(`Excluir a categoria “${c.nome}”?`)) return;
    iniciar(async () => setMensagem(await excluirCategoria(c.id)));
  }

  return (
    <section className="secao">
      <h2>Categorias</h2>
      <form ref={form} onSubmit={semLimpar(acao)} className="linha-form campo" style={{ flexDirection: "row" }}>
        <input name="nome" placeholder="Nova categoria" required maxLength={40} aria-label="Nome da nova categoria" />
        <button className="botao" disabled={salvando}>
          Adicionar
        </button>
      </form>
      {mensagem && <p className={`mensagem ${mensagem.ok ? "sucesso" : "erro"}`} style={{ marginTop: 10 }}>{mensagem.mensagem}</p>}
      {categorias.length > 0 && (
        <div className="categorias-lista">
          {categorias.map((c) => {
            const n = uso(c.id);
            return (
              <span key={c.id} className="categoria-item">
                {c.nome} <small>{n}</small>
                <button onClick={() => excluir(c)} disabled={n > 0 || pendente} title={n > 0 ? "Só dá para excluir categorias sem STLs" : "Excluir categoria"} aria-label={`Excluir categoria ${c.nome}`}>
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ---------- Senha do site ----------

function SecaoSenha() {
  const [resultado, acao, salvando] = useActionState<Resultado, FormData>(trocarSenha, null);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (resultado?.ok) form.current?.reset();
  }, [resultado]);

  return (
    <section className="secao">
      <h2>Senha do site</h2>
      <form ref={form} onSubmit={semLimpar(acao)} className="pilha">
        <div className="campo">
          <label htmlFor="senha">Nova senha</label>
          <input id="senha" name="senha" type="password" autoComplete="new-password" required minLength={4} />
        </div>
        <div className="campo">
          <label htmlFor="confirmacao">Repita a nova senha</label>
          <input id="confirmacao" name="confirmacao" type="password" autoComplete="new-password" required minLength={4} />
          <span className="dica">Ao trocar, todos os visitantes precisam digitar a senha nova.</span>
        </div>
        {resultado && <p className={`mensagem ${resultado.ok ? "sucesso" : "erro"}`}>{resultado.mensagem}</p>}
        <button className="botao secundario" disabled={salvando}>
          {salvando ? "Salvando…" : "Salvar senha"}
        </button>
      </form>
    </section>
  );
}
