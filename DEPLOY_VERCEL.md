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
| `APP_ACCESS_CODE` | Apenas sem demo | Código de acesso escolhido por você, com pelo menos 12 caracteres |
| `SESSION_SECRET` | Apenas sem demo | Segredo aleatório com pelo menos 32 caracteres |
| `APP_ALLOWED_EMAILS` | Apenas sem demo | E-mails autorizados, separados por vírgula |
| `APP_ORIGIN` | Sim | URL HTTPS final do site, por exemplo `https://meu-easylead.vercel.app` |
| `APP_DEMO_ACCESS` | Não | Acesso público do avaliador habilitado por padrão; use `false` para exigir login manual |
| `APP_WORKSPACE_ID` | Não | Identificador da carteira compartilhada; padrão: `main` |

**Não use o prefixo `VITE_` em credenciais.** Esse prefixo publica o valor no navegador. A única variável pública do projeto é `VITE_APP_MODE=server`, configurada automaticamente pelo script de build da Vercel.

Para gerar um `SESSION_SECRET`, execute localmente e copie o resultado apenas para o gerenciador de variáveis:

```sh
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

O botão **Entrar como usuário de demonstração** permite avaliar o protótipo sem preencher e-mail ou código. O servidor cria uma sessão para `demo@easylead.example`, com acesso à carteira compartilhada e às funcionalidades de edição. Esse acesso fica habilitado por padrão. Para desativá-lo, configure `APP_DEMO_ACCESS=false`; nesse caso, `APP_ACCESS_CODE`, `APP_ALLOWED_EMAILS` e `SESSION_SECRET` são obrigatórios e o login manual é validado no servidor.

As sessões usam cookies HttpOnly/Secure/SameSite e podem ser encerradas pelo botão Sair. No protótipo, se `SESSION_SECRET` estiver ausente, o servidor deriva uma chave estável da credencial de conexão PostgreSQL, sem enviá-la ao navegador; alterar a conexão invalida essas sessões. Um segredo explícito continua sendo aceito. A tela de login não exibe nomes de variáveis nem erros internos.

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

### Importar os dados mockados pelo painel do Supabase

Se preferir inicializar pelo SQL Editor, execute localmente:

```sh
npm run db:prepare:supabase
```

O comando usa a carteira local `.env.demo-leads.json`, substitui os nomes genéricos das empresas simuladas por nomes fictícios, inclui os responsáveis de Negócios e completa os valores contratados ausentes. Ele gera `.env.supabase-seed.sql` com tabelas, RLS e dados. IDs, contatos, datas, vínculos e valores positivos já existentes são preservados. Os nomes personalizados de empresas já existentes são mantidos; esta operação não anonimiza toda a carteira.

No projeto Supabase, abra **SQL Editor → New query**, cole o conteúdo do SQL gerado e execute. A consulta final mostra as quantidades importadas. Se a carteira `main` já existir, ela será preservada: o script não substitui os dados existentes. Este caminho substitui os comandos `db:init` e `db:seed` para a primeira carga.

O SQL e a carteira ficam ignorados pelo Git, pois contêm dados e contatos da base local. Não os mova para `public/` nem os publique no repositório. A geração do arquivo não executa nada no Supabase; é necessário rodá-lo no painel ou configurar `DATABASE_URL` para usar os scripts de conexão.

### Adicionar responsáveis de Negócios a uma carteira existente

Para uma carteira já importada, abra o **SQL Editor** do Supabase e execute [202611190001_business_lead_owners.sql](supabase/migrations/202611190001_business_lead_owners.sql). O arquivo usa a carteira `main` por padrão e não contém contatos ou dados privados.

A atualização adiciona **Tiago Mattos**, **João Pedro** e **Beatriz Luna** a Negócios e distribui somente os leads sem responsável em uma proporção aproximada de **50% / 30% / 20%**, respeitando a ordem atual dos registros. Na base mockada de 1.255 leads, os 1.111 registros livres ficam com **556, 333 e 222** leads, respectivamente; os **144** de Bruno Melo continuam com ele. Se o banco já tiver sido editado, as quantidades seguem os leads sem responsável existentes naquele momento.

A operação preserva projetos, valores, datas, campos dos leads e atribuições anteriores. Ela bloqueia a carteira durante a transação e incrementa sua revisão quando há mudança. Pode ser repetida sem duplicar integrantes ou redistribuir leads que já tenham responsável. Recarregue o EasyLead após executar para buscar a revisão atualizada.

Para atualizar a demo local e gerar uma cópia do SQL com o `APP_WORKSPACE_ID` definido no ambiente:

```sh
npm run db:prepare:owners
```

O comando atualiza `.env.demo-leads.json` e gera `.env.supabase-business-owners.sql`, ambos ignorados pelo Git. Para uma primeira carga, `db:prepare:supabase` e `db:seed` já incluem os novos responsáveis. Para uma carteira existente, use a atualização SQL específica; a carga inicial não sobrescreve carteiras existentes.

### Atualização completa: responsáveis e valores contratados

Para aplicar as duas mudanças de uma vez na carteira já existente, execute [supabase/update-demo.sql](supabase/update-demo.sql) no **SQL Editor** do Supabase. Ele usa `main` por padrão e reúne as atualizações em uma única transação: se houver erro, nenhuma das duas alterações é confirmada. Não é necessário executar os arquivos individuais depois.

Além dos responsáveis descritos acima, todos os projetos passam a ter `contractStatus=Contratado` e valor positivo. Os valores positivos existentes são preservados. Para valores ausentes, é usado primeiro o preço da proposta, depois 90% do valor estimado do lead, arredondado para reais inteiros. Na falta de ambas as referências, a demo recebe um valor fictício estável de R$ 25 mil a R$ 124.999. Datas, status de execução, escopo e vínculos dos projetos não são alterados.

Na base atual, foram preenchidos **16 valores**, totalizando **89 projetos com valor contratado**. A distribuição de responsáveis permanece **556 / 333 / 222**; os 144 leads de Bruno Melo são preservados. Execute o SQL e recarregue o site para carregar a nova revisão.

Para gerar a atualização no computador e atualizar o JSON local:

```sh
npm run db:prepare:demo
```

O comando gera `.env.supabase-demo-update.sql` com o `APP_WORKSPACE_ID` do ambiente, além de atualizar `.env.demo-leads.json`. Os dois arquivos são ignorados pelo Git. O SQL público contém apenas a lógica da atualização, sem contatos ou exportação dos registros. A execução pode ser repetida: integrantes não são duplicados, responsáveis existentes não são substituídos e valores positivos não são recalculados.

## 4. Importe na Vercel

1. Suba o projeto para seu repositório Git, sem `.env`, exports de dados ou credenciais.
2. Importe esse repositório na Vercel. Se houver várias pastas, escolha como **Root Directory** a pasta do aplicativo, onde estão `package.json`, `vercel.json`, `api` e `src`.
3. Framework: **Vite**. Node.js: **24.x**. O `vercel.json` já define Build Command `npm run build:vercel` e Output Directory `dist`.
4. Configure as variáveis e faça o deploy. Se a URL final mudou, atualize `APP_ORIGIN` e faça um novo deploy.

As rotas da interface usam `#`, portanto não precisam de rewrite para o SPA. A função `api/easylead/[endpoint].js` atende as APIs com Node.js, duração máxima de 60 segundos e os arquivos necessários ao worker de consulta da IA.

## 5. Confira depois do deploy

- Clique em **Entrar como usuário de demonstração**. Se desativou a demo, use um e-mail de `APP_ALLOWED_EMAILS` e o `APP_ACCESS_CODE` escolhido.
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
