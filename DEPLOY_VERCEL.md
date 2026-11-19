# Deploy do EasyLead na Vercel

O projeto está preparado para Vercel + PostgreSQL (Neon ou Supabase) + DeepSeek. As credenciais ficam somente nas funções do servidor. O comando de build da Vercel habilita automaticamente a integração de produção.

## 1. Crie o PostgreSQL

Crie um projeto Neon ou Supabase e copie a connection string PostgreSQL. Use a URL de **pool de conexões** recomendada pelo provedor para aplicações serverless. No Supabase, use o pooler em vez do endereço direto quando a rede exigir IPv4. Preserve a configuração TLS fornecida pelo provedor; não desabilite a verificação de certificados.

Não é necessário criar uma chave pública do Supabase. A integração usa PostgreSQL pelo servidor, com `DATABASE_URL`.

## 2. Configure o ambiente

Copie `.env.example` para `.env` localmente e preencha os valores. O `.env` e o JSON privado da demo estão fora do Git e do pacote enviado à Vercel.

Cadastre estas variáveis em **Vercel → Project → Settings → Environment Variables**, para Production e, se for usar, Preview:

| Variável | Obrigatória | Valor |
|---|---|---|
| `DATABASE_URL` | Sim | Connection string PostgreSQL do pooler |
| `DEEPSEEK_API_KEY` | Para a IA | Sua chave DeepSeek |
| `DEEPSEEK_MODEL` | Não | Padrão: `deepseek-flash` |
| `APP_ACCESS_CODE` | Sim | Código de acesso escolhido por você, com pelo menos 12 caracteres |
| `SESSION_SECRET` | Sim | Segredo aleatório com pelo menos 32 caracteres |
| `APP_ALLOWED_EMAILS` | Sim | E-mails autorizados, separados por vírgula |
| `APP_ORIGIN` | Sim | URL HTTPS final do site, por exemplo `https://meu-easylead.vercel.app` |
| `APP_WORKSPACE_ID` | Não | Identificador da carteira compartilhada; padrão: `main` |

**Não use o prefixo `VITE_` em credenciais.** Esse prefixo publica o valor no navegador. A única variável pública do projeto é `VITE_APP_MODE=server`, configurada automaticamente pelo script de build da Vercel.

Para gerar um `SESSION_SECRET`, execute localmente e copie o resultado apenas para o gerenciador de variáveis:

```sh
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

O login continua com e-mail e código de acesso, mas em produção ambos são verificados no servidor. Todos os e-mails autorizados acessam a mesma carteira. O código é compartilhado por essas pessoas; não há cadastro público de usuários. As sessões usam cookies HttpOnly/Secure/SameSite e podem ser encerradas pelo botão Sair. Ao trocar o código ou o segredo, os cookies anteriores deixam de ser aceitos.

Use outro banco/carteira, código e segredo no ambiente Preview se ele não deve acessar os dados da produção.

## 3. Inicialize o banco e importe a carteira

Na pasta que contém `package.json`, usando Node.js 24.10 ou superior:

```sh
npm ci
npm run db:init
npm run db:seed -- .env.demo-leads.json
```

`db:init` cria as tabelas. `db:seed` importa o JSON indicado para a carteira de `APP_WORKSPACE_ID`. Se a carteira já existe, **não a sobrescreve**. Não publique o JSON privado no diretório `public` ou no repositório.

Se você editou a carteira no navegador, use **Configurações → Exportar carteira** no modo local e passe o JSON exportado ao `db:seed`, em vez do arquivo original da demo. O armazenamento local de `localhost` não é transferido automaticamente para o domínio da Vercel.

Os documentos de propostas que estavam apenas no IndexedDB do navegador precisam ser anexados novamente na versão hospedada. O JSON exporta os registros e metadados, não os arquivos binários locais. Novos documentos são salvos no PostgreSQL, com limite de 2 MB por arquivo.

O banco usa `easylead_workspaces` para o estado versionado da carteira em JSONB, `easylead_documents` para documentos, `easylead_sessions` para sessões e `easylead_rate_limits` para limites de tentativas. O script ativa RLS sem políticas públicas, para não expor as tabelas pela API REST do Supabase. Use a conexão do proprietário das tabelas no backend; nunca uma chave anônima. As alterações passam pelas regras de negócio existentes, dentro de transações. Uma versão antiga recebe erro de conflito, sem substituir alterações de outra pessoa; recarregue a carteira para continuar.

## 4. Importe na Vercel

1. Suba o projeto para seu repositório Git, sem `.env`, exports de dados ou credenciais.
2. Importe esse repositório na Vercel. Se houver várias pastas, escolha como **Root Directory** a pasta do aplicativo, onde estão `package.json`, `vercel.json`, `api` e `src`.
3. Framework: **Vite**. Node.js: **24.x**. O `vercel.json` já define Build Command `npm run build:vercel` e Output Directory `dist`.
4. Configure as variáveis e faça o deploy. Se a URL final mudou, atualize `APP_ORIGIN` e faça um novo deploy.

As rotas da interface usam `#`, portanto não precisam de rewrite para o SPA. A função `api/easylead/[endpoint].js` atende as APIs com Node.js, duração máxima de 60 segundos e os arquivos necessários ao worker de consulta da IA.

## 5. Confira depois do deploy

- Entre com um e-mail de `APP_ALLOWED_EMAILS` e o `APP_ACCESS_CODE` escolhido.
- Confira a quantidade de leads/projetos e salve uma alteração pequena. Recarregue para confirmar a persistência.
- Envie uma pergunta à IA. A chave é lida por `process.env.DEEPSEEK_API_KEY`, somente no servidor.
- Analise um CSV e confirme que não cadastra leads sem um comando explícito.
- Anexe e abra um documento de proposta.
- Teste Sair e confira que as APIs protegidas deixam de aceitar a sessão antiga.

Se a IA não funcionar, consulte os logs da função na Vercel. Não copie a chave ou a connection string para mensagens ou para o código. `401` indica sessão inválida; `409`, conflito de versão; `429`, limite de tentativas; `503`, configuração/banco indisponível. Sem `DEEPSEEK_API_KEY`, os cadastros continuam funcionando, mas a IA informa que a chave precisa ser configurada.

## Desenvolvimento e validação

`npm run dev` e `npm run build:preview` mantêm o modo local já existente. Para testar a integração de produção no Vite local, coloque no `.env`:

```dotenv
VITE_APP_MODE=server
APP_ORIGIN=http://localhost:5173
```

Preencha também as variáveis de servidor, execute `db:init`/`db:seed` e reinicie o Vite. O modo servidor não usa a sessão nem a carteira do localStorage como fonte de autorização/persistência.

```sh
npm test
npm run test:cloud
npm run check:deployment
```

Os testes automatizados exercitam as APIs e a interface com repositório/provedor simulados. A conexão real com seu PostgreSQL e sua conta DeepSeek deve ser verificada depois de preencher as credenciais; nenhum serviço pago foi acionado durante a preparação.

Referências oficiais: [Vite na Vercel](https://vercel.com/docs/frameworks/frontend/vite), [variáveis de ambiente](https://vercel.com/docs/environment-variables), [Node.js 24](https://vercel.com/changelog/node-js-24-lts-is-now-generally-available-for-builds-and-functions), [pool de conexões](https://vercel.com/kb/guide/connection-pooling-with-functions), [API DeepSeek](https://api-docs.deepseek.com/api/create-chat-completion/).
