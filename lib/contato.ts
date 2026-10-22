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
