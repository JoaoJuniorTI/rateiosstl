// Limpa o que foi digitado e monta os links de contato.

export function limparWhatsapp(valor: string) {
  const digitos = valor.replace(/\D/g, "");
  if (!digitos) return "";
  // Número brasileiro sem DDI (DDD + número): acrescenta 55.
  return digitos.length <= 11 ? `55${digitos}` : digitos;
}

export function limparInstagram(valor: string) {
  return valor
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/[/?#].*$/, "");
}

export function limparEmail(valor: string) {
  return valor.trim().toLowerCase();
}

export const linkWhatsapp = (numero: string) => `https://wa.me/${numero}`;
export const linkEmail = (email: string) => `mailto:${email}`;
export const linkInstagram = (usuario: string) => `https://instagram.com/${usuario}`;

export function formatarWhatsapp(numero: string) {
  const m = numero.match(/^55(\d{2})(\d{4,5})(\d{4})$/);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : `+${numero}`;
}

// ---------- Valor do rateio ----------

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const formatarValor = (valor: number) => moeda.format(valor);

// Aceita "25", "25,5", "25,50", "1.234,56", "R$ 30" e "30.5". Devolve null se vazio, NaN se inválido.
export function lerValor(texto: string) {
  let t = texto.replace(/R\$|\s/gi, "");
  if (!t) return null;
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return NaN;
  return Number(t);
}

// Valor para preencher o campo na edição: 1234.5 -> "1234,50"
export const valorParaCampo = (valor: number) => valor.toFixed(2).replace(".", ",");
