# rateiosstl

Catálogo de STLs adquiridos por rateio comunitário. O site é protegido por uma senha única, e só o administrador (login com Google) cadastra, edita e exclui.

**Peças:** Next.js na Vercel, e Supabase para banco de dados, fotos e login Google. Tudo no plano grátis.

---

## Passo a passo para publicar

Leva uns 30 minutos. Siga na ordem, porque alguns passos usam valores dos anteriores.
Vá anotando os valores marcados com 📝 num bloco de notas.

### 1. Supabase (banco e fotos)

1. Entre em <https://supabase.com>, clique em **New project**.
   - Nome: `rateiosstl`
   - Crie uma senha de banco (guarde, mas o site não usa)
   - Região: **South America (São Paulo)**
2. Com o projeto pronto, abra **SQL Editor** no menu lateral, clique em **New query**, cole todo o conteúdo do arquivo [`supabase/schema.sql`](supabase/schema.sql) e clique em **Run**. Deve aparecer "Success".
3. Abra **Project Settings → API** (ou **API Keys**) e anote:
   - 📝 **Project URL** (ex.: `https://abcdefgh.supabase.co`)
   - 📝 a chave **anon / public** (ou **publishable**)
   - 📝 a chave **service_role** (ou **secret**). ⚠️ Essa chave dá acesso total. Nunca coloque ela em lugar público.

### 2. Google (login do administrador)

1. Entre em <https://console.cloud.google.com>, crie um projeto chamado `rateiosstl`.
2. Vá em **APIs e serviços → Tela de permissão OAuth** (ou **Google Auth Platform**):
   - Tipo de usuário: **Externo**
   - Nome do app: `rateiosstl`, e o seu e-mail nos campos de contato
   - Em **Público-alvo / Usuários de teste**, adicione o seu e-mail do Gmail (ou clique em **Publicar app**)
3. Vá em **Credenciais → Criar credenciais → ID do cliente OAuth**:
   - Tipo: **Aplicativo da Web**
   - Em **URIs de redirecionamento autorizados**, adicione:
     `https://SEU-PROJETO.supabase.co/auth/v1/callback` (use a Project URL do passo 1)
   - Clique em Criar e anote 📝 o **ID do cliente** e a 📝 **Chave secreta do cliente**
4. Volte ao Supabase: **Authentication → Sign In / Providers → Google**. Ative, cole o ID e a chave secreta e salve.

### 3. GitHub (guardar o código)

1. Em <https://github.com/new>, crie um repositório **privado** chamado `rateiosstl`, sem README.
2. O repositório git e o primeiro commit já estão prontos. Na pasta deste projeto, rode (trocando `SEU-USUARIO`):

```bash
git remote add origin https://github.com/SEU-USUARIO/rateiosstl.git
```

```bash
git push -u origin main
```

### 4. Vercel (colocar no ar)

1. Gere dois textos aleatórios rodando este comando duas vezes, e anote 📝 os dois:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

2. Em <https://vercel.com/new>, importe o repositório `rateiosstl`.
3. Antes de clicar em Deploy, abra **Environment Variables** e cadastre:

| Nome | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL do Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | chave anon / publishable |
| `SUPABASE_SERVICE_ROLE_KEY` | chave service_role / secret |
| `ADMIN_EMAIL` | o seu e-mail do Google, o único que entra no painel |
| `SESSION_SECRET` | o 1º texto aleatório |
| `CRON_SECRET` | o 2º texto aleatório |

4. Clique em **Deploy**. No fim, anote 📝 o endereço do site (ex.: `https://rateiosstl.vercel.app`).

### 5. Ligar o login ao endereço do site

No Supabase: **Authentication → URL Configuration**:
- **Site URL**: o endereço da Vercel (ex.: `https://rateiosstl.vercel.app`)
- **Redirect URLs**: adicione `https://rateiosstl.vercel.app/**`

### 6. Primeiro uso

1. Abra `https://SEU-SITE.vercel.app/admin` e clique em **Entrar com Google**.
2. Em **Senha do site**, defina a senha que os visitantes vão usar.
3. Crie as categorias (ou crie direto no cadastro do STL, pela opção "+ Criar nova categoria…").
4. Cadastre os STLs.
5. Compartilhe o endereço do site e a senha com o pessoal.

---

## Como funciona

| Endereço | O que é |
|---|---|
| `/` | Catálogo. Pede a senha se o visitante ainda não digitou |
| `/entrar` | Tela da senha |
| `/admin` | Painel: cadastrar, editar e excluir STLs, gerenciar categorias e trocar a senha do site |

- **Senha do site:** depois de digitada, vale por 30 dias naquele navegador. Trocar a senha no painel derruba todos os acessos antigos. O admin logado não precisa digitar a senha.
- **Segurança:** os dados só saem do servidor depois que a senha é validada. O banco fica fechado (RLS sem políticas) e só o servidor acessa, usando a chave service_role. As fotos ficam num bucket privado e o site gera links temporários de 6 horas.
- **Fotos:** reduzidas no navegador para no máximo 1200px e convertidas para WebP antes do envio. Ficam com uns 50–200 KB, e o 1 GB grátis do Supabase comporta milhares delas.
- **Busca:** aproximada, por nome e categoria. Tolera erros de digitação e ignora acentos, usando [Fuse.js](https://www.fusejs.io/).
- **Supabase pausando:** no plano grátis, o Supabase pausa projetos sem acesso por 7 dias. A Vercel chama `/api/manter-ativo` todo dia às 9h UTC (configurado em `vercel.json`) para evitar isso.

## Rodar no computador (opcional)

1. Copie `.env.example` para `.env.local` e preencha com os mesmos valores da Vercel.
2. No Supabase, em **Authentication → URL Configuration → Redirect URLs**, adicione `http://localhost:3000/**`.
3. Rode:

```bash
npm install
```

```bash
npm run dev
```

4. Abra <http://localhost:3000>.
