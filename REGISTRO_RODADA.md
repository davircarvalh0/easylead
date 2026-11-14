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

Pendente ao encerrar a implementação: AI review do diff contra BACKLOG.md e critérios do recorte, com prioridade para duplicação, consistência, controles e teclado. A revisão deve registrar o que verificou e os achados; não há parecer antecipado neste documento.

## Aprovação e integração

Aguardam a AI review e a aprovação do usuário. Nenhuma mesclagem foi realizada pelo Implementador.
