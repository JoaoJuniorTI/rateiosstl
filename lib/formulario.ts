import { startTransition, type FormEvent } from "react";

// Envia o formulário sem o reset automático do React 19, que apaga os campos
// mesmo quando o servidor devolve um erro. Quem chama limpa o formulário no sucesso.
export function semLimpar(acao: (dados: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const dados = new FormData(e.currentTarget);
    startTransition(() => acao(dados));
  };
}
