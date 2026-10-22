"use client";

import { useActionState } from "react";
import { semLimpar } from "@/lib/formulario";
import { entrarAdmin } from "./acoes";

export default function FormLoginAdmin() {
  const [erro, acao, enviando] = useActionState(entrarAdmin, null);
  return (
    <form onSubmit={semLimpar(acao)} className="pilha">
      <div className="campo">
        <label htmlFor="usuario">Usuário</label>
        <input id="usuario" name="usuario" autoComplete="username" autoCapitalize="none" autoFocus required />
      </div>
      <div className="campo">
        <label htmlFor="senha">Senha</label>
        <input id="senha" name="senha" type="password" autoComplete="current-password" required />
      </div>
      {erro && <p className="mensagem erro">{erro}</p>}
      <button className="botao largo" disabled={enviando}>
        {enviando ? "Entrando…" : "Entrar no painel"}
      </button>
    </form>
  );
}
