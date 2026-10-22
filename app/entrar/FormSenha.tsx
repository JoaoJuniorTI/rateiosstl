"use client";

import { useActionState } from "react";
import { entrar } from "./acoes";

export default function FormSenha() {
  const [erro, acao, enviando] = useActionState(entrar, null);
  return (
    <form action={acao} className="pilha">
      <div className="campo">
        <label htmlFor="senha">Senha de acesso</label>
        <input id="senha" name="senha" type="password" autoComplete="current-password" autoFocus required />
      </div>
      {erro && <p className="mensagem erro">{erro}</p>}
      <button className="botao largo" disabled={enviando}>
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
