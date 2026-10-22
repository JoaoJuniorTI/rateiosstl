-- rateiosstl: cole tudo no Supabase > SQL Editor e clique em Run.

create table if not exists categorias (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  criado_em timestamptz not null default now()
);
create unique index if not exists categorias_nome_unico on categorias (lower(nome));

create table if not exists stls (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  categoria_id uuid not null references categorias (id) on delete restrict,
  comprador text not null,
  whatsapp text,
  email text,
  instagram text,
  foto_path text not null,
  criado_em timestamptz not null default now(),
  constraint stls_algum_contato check (
    coalesce(whatsapp, email, instagram) is not null
  )
);

-- Uma única linha com a senha do site (hash) e sua versão.
-- Trocar a senha incrementa a versão, o que derruba todos os acessos antigos.
create table if not exists configuracoes (
  id int primary key check (id = 1),
  senha_hash text,
  senha_versao int not null default 1
);
insert into configuracoes (id) values (1) on conflict (id) do nothing;

-- O site acessa o banco apenas pelo servidor, com a chave service_role.
-- RLS ligado e sem políticas = ninguém de fora lê ou escreve direto.
alter table categorias enable row level security;
alter table stls enable row level security;
alter table configuracoes enable row level security;

-- Bucket privado para as fotos (o site gera links temporários).
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', false)
on conflict (id) do nothing;
