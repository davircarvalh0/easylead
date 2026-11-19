# EasyLead

O **EasyLead** é uma plataforma para acompanhar oportunidades comerciais e projetos em um só lugar. Reúne gestão de leads, indicadores de conversão, organização de equipes e um assistente de IA para analisar a carteira e apoiar a priorização de contatos.

## Principais funcionalidades

### Gestão de leads

- Cadastro e edição de empresas, contatos e oportunidades.
- Visualização em **lista ou quadro Kanban**, com os estágios Novo, Em contato, Proposta, Ganho e Perdido.
- Pesquisa, ordenação e filtros por setor, segmento, fase, cidade, UF e aderência ao perfil de cliente ideal (ICP).
- Carregamento da listagem em partes, evitando exibir todos os registros de uma vez.
- Definição do ICP e acompanhamento de propostas, valores e documentos anexados.
- Conversão de oportunidades ganhas em projetos, preservando o vínculo com o lead de origem.

### Dashboards e análises

- Indicadores de conversão em contrato, contratos fechados, contatos e novos leads.
- Funil de leads e comparações por setor e sazonalidade.
- Ranking de setores por mês e detalhes dos indicadores de cada setor.
- Indicadores de projetos, valor contratado e média por contrato.
- Gráficos interativos, filtros e alternância entre gráfico e resumo/histórico nos módulos que oferecem essa opção.

### Gestão de projetos

- Listagem com pesquisa e filtros combinados.
- Detalhes do projeto, escopo, valor contratado, responsáveis e equipe.
- Acompanhamento de status e das fases **Discovery → Delivery**.
- Associação de projetos às áreas da organização.

### Organização e equipes

- Áreas apresentadas em cartões com ícones relacionados ao setor.
- Acesso aos detalhes de cada área, seus integrantes e projetos.
- Cadastro de setores e integrantes, atribuição de responsáveis e gestão dos vínculos com a carteira.

### Assistente de IA

- Integração com **DeepSeek** para responder a perguntas sobre leads, projetos e indicadores do EasyLead.
- Respostas com formatação, tabelas e gráficos quando aplicável.
- Análise de arquivos **CSV e XML** para ajudar a identificar oportunidades e priorizar leads com base no histórico de conversão.
- Distinção entre **analisar** e **cadastrar**: anexar um arquivo não importa os registros automaticamente; o cadastro exige um pedido explícito.
- Importação com validação e identificação de duplicados.
- Continuidade da conversa ao navegar entre páginas; o histórico é limpo ao recarregar a aplicação.
- Caixa de mensagem ancorada na parte inferior, com rolagem independente do histórico.

### Interface e dados

- Layout responsivo, modos claro e escuro e módulos com estética minimalista.
- Navegação e controles com efeito liquid glass e animações que respeitam a preferência por movimento reduzido.
- Exportação da carteira em JSON pelas configurações.
- Modo local com persistência no navegador e modo hospedado com **PostgreSQL**, compatível com Neon ou Supabase.
- No modo hospedado, autenticação no servidor, cookies de sessão e controle de versão para evitar sobrescrever alterações de outra pessoa.

## Executar localmente

Requer **Node.js 24.10 ou superior, na versão 24.x**, e npm.

```sh
npm ci
npm run dev
```

Abra o endereço informado pelo Vite. As rotas usam `#`, permitindo recarregar as páginas de detalhes sem configurar rewrites.

Por padrão, o desenvolvimento usa a carteira local do navegador. Os dados fictícios da demo são a base inicial; alterações locais não são transferidas automaticamente para a versão hospedada.

### Configurar a IA

Crie um arquivo `.env` na raiz do aplicativo e configure:

```dotenv
DEEPSEEK_API_KEY=sua_chave
DEEPSEEK_MODEL=deepseek-flash
```

Reinicie o servidor depois de alterar as variáveis. A chave é usada somente no servidor. O assistente envia à API a pergunta, o contexto recente e os dados necessários à análise.

Para analisar um arquivo, anexe um CSV ou XML e pergunte, por exemplo: **“Quais leads devo priorizar pela conversão do setor?”** Para importar, peça explicitamente: **“Cadastre os leads deste arquivo.”**

## Publicar na Vercel

O projeto inclui funções de API para PostgreSQL, sessões, documentos e DeepSeek, além da configuração de build da Vercel.

Siga o [guia de implantação](DEPLOY_VERCEL.md) para configurar as variáveis, criar as tabelas e importar a carteira inicial. Use [.env.example](.env.example) como referência. As credenciais de banco e API devem permanecer no servidor, sem o prefixo `VITE_`.

## Build e testes

```sh
npm run build
npm test
npx playwright install chromium
npm run test:e2e
```

Outros comandos disponíveis:

| Comando | Finalidade |
|---|---|
| `npm run build:preview` | Gerar a prévia local em `previa/` |
| `npm run preview` | Recompilar e servir a prévia local |
| `npm run check:preview` | Conferir se a prévia corresponde ao código atual |
| `npm run test:cloud` | Testar a interface no modo servidor com integrações simuladas |
| `npm run build:vercel` | Gerar o build com o modo servidor habilitado |
| `npm run check:deployment` | Gerar o build e verificar se credenciais de teste aparecem nos arquivos públicos |

Os testes automatizados usam serviços simulados quando necessário. A conexão com PostgreSQL e DeepSeek deve ser validada com as credenciais do ambiente de implantação.

## Tecnologias

**React 19**, **Vite**, **Node.js**, **PostgreSQL**, **DeepSeek**, **Vercel Functions** e **Playwright**.
