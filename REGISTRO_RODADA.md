# Registro da primeira rodada · Central do CITi

## Etapa 1 — Produto · Antigravity

Entrada preservada integralmente em [RECORTE_PRODUTO.md](RECORTE_PRODUTO.md), obtida da branch de Produto indicada na tarefa. Entrega: recorte P0, fluxo, oito critérios de aceite e tabela de contribuição da seção 6. Verificação declarada por Produto: rastreabilidade com BACKLOG.md, teste de mesa e validação humana.

### Conferência independente da entrada — Implementador · Codex

Li integralmente o relatório e conferi a conversa e o cartão respondido da tarefa de Produto. O cartão foi respondido em 14/11/2026 às 00:32:54 UTC (13/11 às 21:32:54 em Fortaleza). Ele aprova o P0 e confirma explicitamente: cinco estágios de lead; três status de projeto; criação como Planejado; conversão 1:1; estágio Ganho travado depois da conversão; abertos = Novo + Em contato + Proposta.

A afirmação do relatório de que toda H-03 seria uma regra institucional validada extrapola o texto do cartão. Os nomes Inovação, Comercial, Desenvolvimento, Design e Pessoas são usados como exemplos, sem comprovação de que sejam a estrutura real do CITi. Filtrar responsáveis pela área, incluir o responsável na equipe e permitir transições diretas antes de converter são escolhas desta demonstração, coerentes com as recomendações do relatório. Nenhuma impede o recorte aprovado e não foi necessária nova decisão humana. A versão original foi preservada como fonte; esta ressalva governa a implementação. Diagnósticos sobre dores institucionais no relatório também são análises de Produto, não pesquisa de campo comprovada.

## Etapa 2 — Implementador · Codex

Entrega: React com Vite; cinco seções e detalhes em rotas hash; busca e filtros combinados; cadastro e edição de lead; conversão atômica do estado com vínculo bidirecional e proteção 1:1 na regra de domínio; área, responsável e equipe adicional; alteração de status; consultas cruzadas; indicadores calculados e acionáveis; gravação local antes de confirmar a alteração na interface. Formulários têm campos rotulados, mensagens de erro, foco visível e navegação por teclado. Layout responsivo com redução de movimento.

A carga inicial contém cinco leads, cinco áreas e cinco integrantes fictícios. Projetos começam vazios para tornar o resultado da primeira conversão visível. Esta é uma simplificação da recomendação de carga rica de Produto, sem alterar o aceite do fluxo.

### Comandos e resultados — execução local em 13/11/2026, Fortaleza

Ambiente: Windows, PowerShell, Node 24.14.1, npm 11.11.0.

| Comando | Resultado final | Evidência / escopo |
| --- | --- | --- |
| `npm install` | Código 0; 21 pacotes auditados, nenhuma vulnerabilidade informada | Lockfile versionado |
| `npx playwright install chromium` | Código 0 | Chromium instalado para teste local |
| `npm test` | Código 0; 2 testes aprovados | `tests/domain.test.js`: validação, ganho obrigatório, área/responsável coerentes, equipe sem repetição, vínculo, reconversão idempotente, trava de estágio, indicadores, serialização e dados ilegíveis |
| `npm run test:e2e` | Código 0; 2 cenários aprovados, 7,1 s | `tests/flow.spec.js`: cadastro inválido/válido, aumento e redução dos abertos, conversão, status inicial, equipe, mudança para Em andamento, reload, consulta na área, indicador filtrado, reabertura do projeto sem duplicação, estágio desabilitado, busca/filtro combinados, erro de escrita e cadastro com teclado |
| `npm run build` | Código 0 | Bundle de produção gerado em `dist/` (gerado localmente e ignorado no git) |

Responsividade: o teste de navegador verifica ausência de overflow horizontal nas cinco seções em 360 × 900 e 1280 × 900. Teste executado em Chromium com reduced-motion ativado no trecho final e navegação por Tab/Enter para cadastrar um lead. Não equivale a auditoria completa de leitor de tela nem a validação em todos os navegadores.

Ocorrências durante o desenvolvimento: o primeiro build detectou BOM no JSON gerado por PowerShell; corrigido para UTF-8 sem BOM. Testes de navegador identificaram que trocar filtro apagava a busca; corrigido para preservar a busca na mesma tela. Seletores ambíguos e sincronização de rotas nos próprios testes também foram corrigidos antes da execução final aprovada.

### Lacunas e limites

- Persistência é local por origem e navegador, sem sincronização entre abas nem controle de concorrência; não usar dados reais. Dados com JSON ilegível ou estrutura básica incompatível geram aviso e não são sobrescritos automaticamente; não há migração nem reparação de dados adulterados manualmente.
- Backend, autenticação, permissões, CRUD de áreas/integrantes e histórico ficam no P1/P2.
- Testes de responsividade verificam geometria das cinco seções; inspeção visual humana e auditoria completa de acessibilidade continuam recomendadas na revisão.
- A fonte visual usa Google Fonts com fallback para fonte do sistema quando offline.

## Etapa 3 — Revisor · GitHub Copilot

**Agente:** Revisor · GitHub Copilot. **Entrega:** parecer de AI review do commit `5041e86`, recebido nesta conversa: “Parece bom para mesclar.” Sem achados reportados.

**Verificação declarada pelo Revisor:** revisão de `git diff origin/main...HEAD` contra `BACKLOG.md` e `RECORTE_PRODUTO.md`; `npm test` com 2 testes aprovados, `npm run test:e2e` com 2 cenários aprovados, `npm run build` e `git diff --check`, todos com código 0. Esta é a declaração do parecer recebido, não uma nova execução pelo Implementador nesta atualização documental. A referência `origin/main` reproduz o comando informado pelo Revisor e não comprova estado de integração.

### Evidências por ponto e limites de atribuição

O parecer não descreveu inspeções individuais de duplicação, controles, teclado ou mobile. Executar a suíte existente fornece evidência automatizada do que ela cobre; não permite atribuir ao Revisor uma auditoria manual desses pontos.

| Ponto | Verificação do Implementador · Codex já executada na etapa 2 | O que o Revisor declarou | Lacuna explícita |
| --- | --- | --- | --- |
| Conversão duplicada | `tests/domain.test.js` chama `convert` novamente para o mesmo lead e exige a mesma referência de estado. `tests/flow.spec.js` reabre o lead convertido, verifica estágio desabilitado, usa “Abrir projeto vinculado”, compara a URL e exige exatamente um projeto no armazenamento. | Execução das duas suítes aprovada; sem descrição de tentativa individual de reconversão. | O cenário de interface reabre o vínculo; não simula duplo clique rápido no botão de criação, concorrência entre abas ou adulteração do armazenamento. |
| Controles sem ação | `tests/flow.spec.js` aciona cadastro, validação, edição de estágio, conversão, seleção de área/responsável/equipe, status, links de origem/área/projeto, indicador de projetos em andamento, buscas e filtros de leads/integrantes. O laço das cinco seções acessa URLs diretamente. | Revisão do diff e execução da suíte, sem inventário de controles inspecionados. | Não há auditoria exaustiva de cada controle visível. O teste não demonstra clique nos cinco itens do menu, em todos os indicadores ou em todas as combinações de filtros de projetos. |
| Teclado | No trecho final de `tests/flow.spec.js`, verifica foco no título e no primeiro campo, preenche um novo lead com teclado, percorre campos com Tab e salva com Enter. As etapas anteriores do fluxo usam ações de Playwright sobre os controles. | Suíte aprovada; nenhuma descrição de percurso específico por teclado. | Não foi demonstrado o fluxo completo de conversão, seleção da equipe e navegação entre seções exclusivamente por teclado; não há auditoria de leitor de tela ou inspeção visual do foco em todos os controles. Ativar reduced-motion nesse trecho não verifica por si só a aparência das transições. |
| Mobile | `tests/flow.spec.js` abre diretamente as cinco seções em Chromium, em 360 × 900 e 1280 × 900, verifica título visível e `document.documentElement.scrollWidth <= innerWidth`. O cadastro por teclado do trecho final ocorre após o laço, portanto em 1280 px. | Suíte aprovada; nenhuma descrição de inspeção mobile individual. | Não houve verificação em aparelho físico, toque, outros navegadores ou inspeção visual humana. O laço geométrico não cobre os formulários/detalhes nem demonstra o fluxo completo em 360 px. |

**Falhas e reprodução:** o parecer não reportou falhas. As execuções finais da etapa 2 passaram nos cenários descritos; nesta atualização foram relidos os testes para delimitar a cobertura, sem nova execução funcional. As lacunas acima são verificações ausentes, não defeitos reproduzidos. As ocorrências corrigidas durante o desenvolvimento permanecem registradas na etapa 2; não há nova falha confirmada nem passos de reprodução a acrescentar nesta etapa.

## Aprovação e integração

AI review aprovada para o commit `5041e86`, sem achados reportados. A aprovação do usuário para mesclar continua pendente; o parecer do Revisor não a substitui. Nenhuma mesclagem foi realizada pelo Implementador. Esta atualização altera apenas a documentação e não recebeu novo parecer de AI review.

---

# Registro da segunda rodada · Redesign Desktop e Mobile da Central

## Pré-requisito — Importação de Skills React da Equipe (Tarefa #4 · Implementador · Codex)

- **Disponível e ativa na biblioteca da equipe:** `vercel-react-best-practices` (`skillId: neGYGk5pqLrLmpfc5CwBO`, pulada na importação por já existir; a biblioteca também conta com `vercel-react-native-skills` `X8eqgrKQpxM7W9Fv0VuFI`).
- **Recuperadas integralmente e preservadas na branch da tarefa #4 (`skills-import/RELATORIO.md`, 127 arquivos com manifesto SHA-256), pendentes de publicação no servidor MCP (`predates directory import`):** `react-patterns`, `gsap-react`, `react-doctor`, `react-native-best-practices`, `clerk-react-patterns`, `react-email`, `react-router-framework-mode`, `react-mcp` e `react-hook-form`.
- **Encaminhamento sob demanda para esta rodada:** `react-patterns` + `vercel-react-best-practices` ao Implementador (#6); `gsap-react` somente se a implementação usar GSAP; `react-doctor` ao Revisor (#7).

## Etapa 1 — Produto · Antigravity (Proposta Visual Desktop e Mobile)

- **Agente responsável:** Produto · Antigravity (Gemini 4 Argon).
- **Base inspecionada:** versão React existente (`5041e86` / `1e88f2e`). Os arquivos da aplicação (`src/domain.js`, `src/main.jsx`, `src/style.css`) foram mantidos inalterados nesta etapa em respeito à restrição de aprovar a proposta visual antes de implementar.
- **O que entregou:**
  1. Especificação completa da proposta em [PROPOSTA_REDESIGN.md](PROPOSTA_REDESIGN.md): tema escuro grafite (`#0B0E0D` / `#111614`) e verde do CITi (`#00E676`), navegação superior compacta sem sidebar fixa, troca da grade de cartões por listas contínuas com divisórias discretas de `1px` (`#1E2824`), regra proposta para priorização de *Leads que precisam de ação* na página inicial (`Ganho` sem projeto → `Proposta` → `Em contato` → `Novo`), destaque para *Projetos em andamento* com seus responsáveis e contrato de microinterações (botão com acompanhamento leve do cursor mantendo área clicável estável, resposta ao toque no mobile, foco visível e `prefers-reduced-motion`).
  2. Protótipo interativo da proposta em [proposta-visual/index.html](proposta-visual/index.html) (com [proposta-visual/style.css](proposta-visual/style.css) e [proposta-visual/app.js](proposta-visual/app.js)) para avaliação visual imediata do percurso *Página inicial → Lead → Projeto vinculado → Área e responsáveis* nos modos Desktop (1280px) e Celular (360px).
  3. Pranchas visuais estáticas em SVG para [Desktop 1280px](proposta-visual/desktop-percurso.svg) e [Mobile 360px](proposta-visual/mobile-percurso.svg).
- **Como foi verificado:** conferência de todos os seletores e fluxos exigidos por `tests/domain.test.js` e `tests/flow.spec.js`, execução local de `npm test` (2/2 aprovados) e `git diff --check` com código 0, e submissão da proposta via cartão de aprovação ao usuário.
