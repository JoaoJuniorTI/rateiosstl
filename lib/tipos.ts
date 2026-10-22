export type Categoria = { id: string; nome: string };

export type Stl = {
  id: string;
  nome: string;
  categoria_id: string;
  categoria: string;
  comprador: string;
  whatsapp: string | null;
  email: string | null;
  instagram: string | null;
  valor: number | null;
  foto_path: string;
  foto_url: string;
  criado_em: string;
};

// Valor do <select> de categoria que indica "criar uma nova".
export const NOVA_CATEGORIA = "__nova__";
