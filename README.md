# rateiosstl

Catálogo de STLs adquiridos por rateio comunitário. Os visitantes entram com uma senha única do site, e só o administrador (com usuário e senha próprios) cadastra, edita e exclui.

**Peças:** Next.js na Vercel, e Supabase para banco de dados e fotos. Tudo no plano grátis.

O código já está no GitHub: <https://github.com/JoaoJuniorTI/rateiosstl>.

---

## Passo a passo para publicar

Leva uns 15 minutos. Siga na ordem, porque o passo 2 usa valores do passo 1.
Vá anotando os valores marcados com 📝 num bloco de notas.

### 1. Supabase (banco e fotos)

1. Entre em <https://supabase.com>, clique em **New project**.
   - Nome: `rateiosstl`
   - Crie uma senha de banco (guarde, mas o site não usa)
   - Região: **South America (São Paulo)**
2. Com o projeto pronto, abra **SQL Editor** no menu lateral, clique em **New query**, cole todo o conteúdo do arquivo [`supabase/schema.sql`](supabase/schema.sql) e clique em **Run**. Deve aparecer "Success".
   - Pode rodar o arquivo de novo sempre que ele mudar (ex.: quando um campo novo for adicionado): ele não apaga nada do que já existe.
3. Abra **Project Settings → API** (ou **API Keys**) e anote:
   - 📝 **Project URL** (ex.: `https://abcdefgh.supabase.co`)
   - 📝 a chave **service_role** (ou **secret**). ⚠️ Essa chave dá acesso total. Nunca coloque ela em lugar público.

### 2. Vercel (colocar no ar)

1. Gere dois textos aleatórios rodando este comando duas vezes, e anote 📝 os dois:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

2. Em <https://vercel.com/new>, importe o repositório `rateiosstl`.
3. Antes de clicar em Deploy, abra **Environment Variables** e cadastre:

| Nome | Valor |
|---|---|
| `SUPABASE_URL` | Project URL do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | chave service_role / secret |
| `ADMIN_USUARIO` | o usuário que você vai usar no painel (ex.: `joao`) |
| `ADMIN_SENHA` | a senha do painel. Use uma senha forte, diferente da senha do site |
| `SESSION_SECRET` | o 1º texto aleatório |
| `CRON_SECRET` | o 2º texto aleatório |

4. Clique em **Deploy**. No fim, anote 📝 o endereço do site (ex.: `https://rateiosstl.vercel.app`).

### 3. Primeiro uso

1. Abra `https://SEU-SITE.vercel.app/admin` e entre com o usuário e a senha do painel.
2. Em **Senha do site**, defina a senha que os visitantes vão usar.
3. Crie as categorias (ou crie direto no cadastro do STL, pela opção "+ Criar nova categoria…").
4. Cadastre os STLs.
5. Compartilhe o endereço do site e a senha com o pessoal.

### Trocar as senhas depois

- **Senha do site (visitantes):** pelo painel, na seção **Senha do site**, quando quiser.
- **Senha do painel (sua):** na Vercel, em **Settings → Environment Variables**, edite `ADMIN_SENHA`. Depois vá em **Deployments**, clique nos três pontinhos do último deploy e em **Redeploy**. A troca desconecta o painel em todos os aparelhos.

---

## Como funciona

| Endereço | O que é |
|---|---|
| `/` | Catálogo. Pede a senha se o visitante ainda não digitou |
| `/entrar` | Tela da senha |
| `/admin` | Login do administrador e painel: cadastrar, editar e excluir STLs, gerenciar categorias e trocar a senha do site |

- **Senha do site:** depois de digitada, vale por 30 dias naquele navegador. Trocar a senha no painel derruba todos os acessos antigos. O admin logado não precisa digitar a senha do site.
- **Segurança:** os dados só saem do servidor depois que a senha é validada. O banco fica fechado (RLS sem políticas) e só o servidor acessa, usando a chave service_role. As fotos ficam num bucket privado e o site gera links temporários de 6 horas.
- **Fotos:** reduzidas no navegador para no máximo 1200px e convertidas para WebP antes do envio. Ficam com uns 50–200 KB, e o 1 GB grátis do Supabase comporta milhares delas.
- **Busca:** aproximada, por nome e categoria. Tolera erros de digitação e ignora acentos, usando [Fuse.js](https://www.fusejs.io/).
- **Supabase pausando:** no plano grátis, o Supabase pausa projetos sem acesso por 7 dias. A Vercel chama `/api/manter-ativo` todo dia às 9h UTC (configurado em `vercel.json`) para evitar isso.

## Rodar no computador (opcional)

1. Copie `.env.example` para `.env.local` e preencha com os mesmos valores da Vercel.
2. Rode:

```bash
npm install
```

```bash
npm run dev
```

3. Abra <http://localhost:3000>.
