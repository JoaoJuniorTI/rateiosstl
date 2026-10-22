"use client";

import Fuse from "fuse.js";
import { useMemo, useRef, useState } from "react";
import { AvisoFaixa, AvisoLegal } from "./Aviso";
import CardStl from "./CardStl";
import { IconeBusca } from "./Icones";
import type { Categoria, Stl } from "@/lib/tipos";

type Ordem = "relevancia" | "recentes" | "antigos" | "az";

const ROTULOS_ORDEM: Record<Ordem, string> = {
  relevancia: "Mais relevantes",
  recentes: "Mais recentes",
  antigos: "Mais antigos",
  az: "Nome (A–Z)",
};

export default function Galeria({ stls, categorias, ehAdmin }: { stls: Stl[]; categorias: Categoria[]; ehAdmin: boolean }) {
  const [termo, setTermo] = useState("");
  const [categoria, setCategoria] = useState<string | null>(null);
  const [ordem, setOrdem] = useState<Ordem>("recentes");
  const [ampliada, setAmpliada] = useState<Stl | null>(null);
  const dialogo = useRef<HTMLDialogElement>(null);

  // Busca aproximada: tolera erros de digitação e ignora acentos e maiúsculas.
  const fuse = useMemo(
    () =>
      new Fuse(stls, {
        keys: [
          { name: "nome", weight: 0.7 },
          { name: "categoria", weight: 0.3 },
        ],
        threshold: 0.3,
        ignoreLocation: true,
        ignoreDiacritics: true,
      }),
    [stls],
  );

  const buscando = termo.trim().length > 0;

  function mudarTermo(valor: string) {
    const passouABuscar = !buscando && valor.trim().length > 0;
    const parouDeBuscar = buscando && valor.trim().length === 0;
    if (passouABuscar && ordem === "recentes") setOrdem("relevancia");
    if (parouDeBuscar && ordem === "relevancia") setOrdem("recentes");
    setTermo(valor);
  }

  const encontrados = useMemo(() => (buscando ? fuse.search(termo.trim()).map((r) => r.item) : stls), [buscando, fuse, termo, stls]);

  const contagem = useMemo(() => {
    const mapa = new Map<string, number>();
    encontrados.forEach((s) => mapa.set(s.categoria_id, (mapa.get(s.categoria_id) ?? 0) + 1));
    return mapa;
  }, [encontrados]);

  const visiveis = useMemo(() => {
    const lista = categoria ? encontrados.filter((s) => s.categoria_id === categoria) : [...encontrados];
    if (ordem === "recentes") lista.sort((a, b) => b.criado_em.localeCompare(a.criado_em));
    if (ordem === "antigos") lista.sort((a, b) => a.criado_em.localeCompare(b.criado_em));
    if (ordem === "az") lista.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    return lista;
  }, [encontrados, categoria, ordem]);

  const categoriasComItens = categorias.filter((c) => stls.some((s) => s.categoria_id === c.id));

  function abrir(stl: Stl) {
    setAmpliada(stl);
    dialogo.current?.showModal();
  }

  return (
    <>
      <header className="topo">
        <div className="container">
          <div className="topo-linha">
            <a className="marca" href="/">
              <img src="/icon.svg" alt="" />
              rateios<span>stl</span>
            </a>
            <div className="busca">
              <IconeBusca />
              <input
                type="search"
                placeholder="Buscar por nome ou categoria…"
                value={termo}
                onChange={(e) => mudarTermo(e.target.value)}
                aria-label="Buscar STL"
              />
              {buscando && (
                <button className="limpar" onClick={() => mudarTermo("")} aria-label="Limpar busca">
                  ×
                </button>
              )}
            </div>
            <select className="ordem" value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} aria-label="Ordenar">
              {(Object.keys(ROTULOS_ORDEM) as Ordem[])
                .filter((o) => o !== "relevancia" || buscando)
                .map((o) => (
                  <option key={o} value={o}>
                    {ROTULOS_ORDEM[o]}
                  </option>
                ))}
            </select>
            {ehAdmin && (
              <a className="botao pequeno secundario" href="/admin">
                Painel
              </a>
            )}
          </div>
          {categoriasComItens.length > 0 && (
            <div className="chips" role="group" aria-label="Filtrar por categoria">
              <button className="chip" aria-pressed={categoria === null} onClick={() => setCategoria(null)}>
                Todas <small>{encontrados.length}</small>
              </button>
              {categoriasComItens.map((c) => (
                <button key={c.id} className="chip" aria-pressed={categoria === c.id} onClick={() => setCategoria(categoria === c.id ? null : c.id)}>
                  {c.nome} <small>{contagem.get(c.id) ?? 0}</small>
                </button>
              ))}
            </div>
          )}
        </div>
        <AvisoFaixa />
      </header>

      <main className="container">
        {stls.length === 0 ? (
          <div className="vazio">
            <strong>Nenhum STL cadastrado ainda</strong>
            {ehAdmin ? <a href="/admin">Cadastrar o primeiro no painel</a> : "Volte em breve."}
          </div>
        ) : visiveis.length === 0 ? (
          <div className="vazio">
            <strong>Nada encontrado</strong>
            Tente outro termo ou escolha outra categoria.
          </div>
        ) : (
          <>
            <p className="resumo">
              {visiveis.length} {visiveis.length === 1 ? "STL" : "STLs"}
              {buscando && <> para “{termo.trim()}”</>}
            </p>
            <div className="grade">
              {visiveis.map((s) => (
                <CardStl key={s.id} stl={s} aoAmpliar={() => abrir(s)} />
              ))}
            </div>
          </>
        )}
      </main>

      <AvisoLegal />

      <dialog
        ref={dialogo}
        className="ampliada"
        onClick={(e) => e.target === e.currentTarget && dialogo.current?.close()}
        onClose={() => setAmpliada(null)}
      >
        {ampliada && (
          <>
            <button className="fechar" onClick={() => dialogo.current?.close()} aria-label="Fechar">
              ×
            </button>
            <img src={ampliada.foto_url} alt={ampliada.nome} />
            <p>{ampliada.nome}</p>
          </>
        )}
      </dialog>
    </>
  );
}
