# Central do CITi

## Objetivo do produto

Reunir os leads, projetos, integrantes e áreas do CITi em um portal interno. O primeiro fluxo demonstrável começa com uma oportunidade comercial e termina com um projeto vinculado a uma área e a integrantes responsáveis. As telas de consulta mostram essas relações para que os membros possam acompanhar o trabalho sem procurar a mesma informação em vários lugares.

O frontend será desenvolvido em React. A interface terá navegação direta, hierarquia visual clara e movimento que sinaliza ações e mudanças de estado. A organização aparecerá nas relações entre áreas, integrantes e projetos.

## Hipóteses para a primeira versão

- Os estágios propostos para leads são Novo, Em contato, Proposta, Ganho e Perdido. Os status iniciais de projeto são Planejado, Em andamento e Concluído. Os nomes e as transições precisam ser validados com o CITi.
- A primeira versão usa dados fictícios com persistência local no navegador. O portal interno compartilhado precisará de backend, autenticação e permissões antes de receber dados reais.
- Uma área pode reunir vários integrantes e projetos. Um projeto tem uma área responsável, um integrante responsável e pode ter outros integrantes. Um lead ganho pode originar um projeto e mantém o vínculo com ele. O produto pode cadastrar projetos sem um lead de origem em uma etapa posterior.

## Requisitos funcionais e backlog

P0 é o primeiro fluxo demonstrável. P1 amplia a utilidade depois que esse fluxo estiver funcionando. P2 prepara o uso institucional.

| ID | Prioridade | Tarefa | Critério de aceite |
| --- | --- | --- | --- |
| RF-01 | P0 | Navegar pelo portal | Visão geral, Leads, Projetos, Integrantes e Organização abrem pelas respectivas rotas. A navegação indica a seção ativa. |
| RF-02 | P0 | Gerenciar leads | Listar, buscar, filtrar por estágio, cadastrar um lead com identificação e corrigir seus dados ou estágio. Campos obrigatórios indicam o erro antes de salvar. |
| RF-03 | P0 | Converter um lead em projeto | A partir de um lead ganho, informar nome do projeto, área e responsável. Ao confirmar, criar um projeto vinculado ao lead e abrir seu detalhe. Ao repetir a ação, abrir o projeto existente. |
| RF-04 | P0 | Acompanhar projetos | Listar projetos, abrir detalhes e alterar o status. O detalhe mostra área, responsável, integrantes vinculados e lead de origem quando houver. |
| RF-05 | P0 | Consultar integrantes e áreas | Buscar integrantes e consultar suas áreas. Ao abrir uma área, ver seus integrantes e projetos vinculados. |
| RF-06 | P0 | Acompanhar a visão geral | Exibir contagens calculadas a partir dos dados atuais de leads abertos e projetos em andamento. Os indicadores abrem listas filtradas e atualizam após mudanças. |
| RF-07 | P1 | Manter diretório e estrutura | Cadastrar e editar áreas e integrantes, gerenciar vínculos e cadastrar projetos internos diretamente. |
| RF-08 | P1 | Consultar histórico | Mostrar mudanças de estágio e status com data. No portal compartilhado, identificar também quem fez a mudança. |
| RF-09 | P2 | Compartilhar dados com a equipe | Usuários autenticados consultam um estado comum. O backend verifica permissões de leitura e edição para cada ação. |

## O que o sistema processa

| Entrada | Processamento | Resultado |
| --- | --- | --- |
| Texto de busca e filtros | Combinar os critérios ativos na coleção da tela | Lista correspondente e estado vazio quando não houver resultados |
| Dados de lead e alterações de estágio | Validar campos, atualizar o registro e recalcular os indicadores | Lead atualizado, feedback visual e visão geral consistente |
| Lead ganho, área e responsável | Validar os vínculos e verificar se já existe um projeto de origem | Projeto criado uma única vez ou acesso ao projeto já vinculado |
| Mudança de status de projeto | Persistir o estado e recalcular a visão geral | Detalhe, lista e indicadores refletem a mesma mudança |
| Seleção de área ou integrante | Consultar relações entre entidades | Diretório e projetos vinculados aparecem no contexto escolhido |

## Requisitos não funcionais

| ID | Requisito | Como verificar |
| --- | --- | --- |
| RNF-01 | Usar React no frontend | A aplicação roda pelo comando documentado e as cinco seções podem ser acessadas pelas rotas. |
| RNF-02 | Interface minimalista e responsiva | Testar em larguras de 360 px e 1280 px. A navegação, as ações principais e os formulários permanecem utilizáveis, sem rolagem horizontal na página. |
| RNF-03 | Controles interativos e feedback | Cada controle visível executa sua ação ou explica por que está desabilitado. A interface diferencia foco, pressionamento e passagem do ponteiro quando aplicável. Operações exibem confirmação ou erro e, quando há espera, estado de carregamento. |
| RNF-04 | Movimento com propósito e acessibilidade | Usar transições para indicar abertura, seleção e mudança de estado. Com `prefers-reduced-motion`, reduzir o movimento preservando a informação. O fluxo principal funciona com teclado e foco visível. |
| RNF-05 | Consistência e persistência na demo | Recarregar a página e verificar os dados alterados. Repetir a conversão de um lead e verificar que existe apenas um projeto vinculado. |
| RNF-06 | Entrega verificável | O README explica como rodar o projeto e reproduzir a demo. A tarefa registra comandos e resultados dos testes. Usar somente dados fictícios na primeira versão. |

## Primeira rodada no Todos

| Responsável | Tarefa | Verificação da contribuição |
| --- | --- | --- |
| Produto, no Antigravity | Revisar este backlog, identificar hipóteses do processo interno, indicar o menor recorte demonstrável e escrever critérios de aceite para a primeira implementação. | Apresentar um fluxo com entrada, ação e saída, além das decisões que precisam de validação. |
| Implementador, no Codex | Após a validação do recorte, implementar a primeira entrega em React. Começar pela navegação e pelo fluxo de lead até projeto, com as relações mínimas de área e integrante. | Executar build e testes disponíveis. Demonstrar conversão, vínculo e persistência; registrar comandos, resultados e lacunas. |
| Revisor, no GitHub Copilot | Em Review, auditar o diff contra os critérios do backlog. Priorizar conversão duplicada, consistência, controles inertes e navegação por teclado. | Entregar achados com forma de reproduzir e impacto, ou registrar os cenários verificados sem achados. |
| Chief | Abrir as tarefas, repassar as decisões entre agentes e devolver ao Implementador os problemas confirmados. | Mostrar o que foi concluído, onde estão as evidências e o que aguarda decisão antes do merge. |

## Roteiro da primeira demonstração

1. Abrir Leads, cadastrar uma oportunidade fictícia e avançá-la para Ganho.
2. Converter a oportunidade em projeto e selecionar área e responsável.
3. Abrir o projeto criado, atualizar seu status e localizar o mesmo projeto na área correspondente.
4. Voltar à visão geral, verificar as contagens e recarregar para confirmar a persistência.
5. Tentar converter o mesmo lead de novo e confirmar que o sistema abre o projeto existente.
