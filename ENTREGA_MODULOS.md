# Renovação de módulos e preservação de Leads

A proposta de Produto foi conferida na branch publicada. Sua tabela geométrica não foi adotada como prova: a aplicação real em b40930b foi medida novamente antes das alterações.

## Impacto analisado antes da edição

O funil depende de main (largura/padding), topbar, breadcrumb, título, feedback, route-content e dos blocos toolbar/comparação/filtros acima dele. Regras globais de botões, cards, tipografia e breakpoints também podem afetá-lo. Nenhum desses estilos globais foi editado. A faixa de comando ganhou apenas pintura (fundo, sombra interna e raio); ocupação e ordem permanecem iguais. O módulo de comparação fica depois do funil.

Não foram alterados FunnelChart.jsx, LeadFunnel.jsx, lead-funnel.css nem leadFunnelService.js. A key estável foi aplicada somente a Organização, para não desmontar a cena ao selecionar um globo.

## Páginas atualizadas

| Página | Mudança | Ações e vazio |
|---|---|---|
| Visão geral | Mantém hierarquia 8/4 e 7/5 existente, acrescenta rodapés de base e links | Links para Leads e carteira; vazio de prioridades existente |
| Leads | Pintura do comando sem mudar medidas; comparação em módulo com cabeçalho e rodapé | Novo lead, filtros, etapas, fichas e projetos convertidos; vazio de recorte testado |
| Novo lead / ficha | Módulo de ficha comercial e retorno ao diretório | Validação, salvar e conversão mantidos |
| Projetos | Carteira principal 7/5 ao lado de contratos; comparação secundária | Busca passou a filtrar a lista; links de ficha/origem/equipe mantidos; busca vazia testada |
| Ficha de projeto | Superfície de módulo e contexto preservado | Status, fase, squad, área e origem mantidos |
| Integrantes | Diretório principal e cadastro secundário; uma coluna no celular | Busca, área e link para globos; vazio testado |
| Squad | Superfície de módulo, contexto e rodapé para integrantes | Projetos e subárea mantidos; vazio de projetos existente |
| Organização | Globos integrados: carregamento, arrasto, zoom, seleção e retorno com canvas contínuo | Seis testes passaram; fallback, toque, teclado, pinça simulada e perda de contexto cobertos |

## Evidência reproduzível

- `node scripts/compare-modules.mjs antes` foi executado antes de editar, no HEAD b40930b.
- `node scripts/compare-modules.mjs depois` repete a navegação com sessão local autenticada, seed intacta, filtros vazios e movimento reduzido.
- Mesmos viewports: 1280×900, 390×900, 360×900. Os JSONs registram posições, dimensões e conteúdo da região, layout e cinco etapas.
- `node scripts/compare-funnel-pixels.mjs` compara pixels de toda a região do funil nos PNGs: zero diferenças em 1.904.056, 588.552 e 547.760 pixels, respectivamente.
- Abra `evidencias/modulos/comparacao.html` pelo botão Preview da revisão para comparar as capturas completas.

## Validação inicial

- `npm test`: 15 testes passaram.
- `npx playwright test --config playwright.modules.config.js`: 21 testes passaram, incluindo login normal/reduzido, teclado, filtros, proporções, etapa zero, edição, novos módulos e seus vazios.
- `npm run build`: passou; avisos existentes da biblioteca Motion e tamanho de Three.js.
- Globos incorporados da branch publicada da tarefa de Organização, somente nos arquivos combinados. Prévia integrada gerada em `previa/index.html`; `npm run check:preview` confirmou igualdade byte a byte com o build React. Não houve merge; a aprovação do usuário continua obrigatória.
- Regressões adicionais: 19 testes passaram na execução inicial; o teste de percurso completo foi atualizado para incluir o novo link no tab order e passou na repetição. Abrange conversão, persistência, médias, valores, cadastro, teclado e toque.
- O vídeo da abertura está em `evidencias/modulos/abertura.webm`.
- A tarefa de acompanhamento da revisão ainda não tem conversa iniciada; o envio de status a ela não foi entregue.

## Validação integrada

- Repetição de `compare-modules.mjs depois` e `compare-funnel-pixels.mjs` após incorporar Organização: zero pixels diferentes nas três larguras.
- Os quatro arquivos diretos do funil continuam sem alteração contra b40930b.
- Seis testes de exploração/órbita passaram com a key estável de Organização; quinze testes de domínio passaram.
- Vídeo real do percurso integrado: `evidencias/modulos/exploracao-integrada.webm`, gerado por `scripts/capture-exploration.mjs`.
- Pinça foi simulada via Pointer Events. Não houve teste em aparelho físico.
- Repetição integrada dos 21 testes de abertura, módulos e funil: todos passaram.
- Prévia compilada: nove testes de abertura normal/reduzida, módulos e exploração passaram usando `playwright.modules-preview.config.js`.
