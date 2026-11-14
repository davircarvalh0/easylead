# Entrega: entrada e Visão geral modular

## Prévia e vídeo
Na revisão de alterações, use Preview em `previa/index.html`. A prévia usa os dados locais existentes; para ver a passagem, saia e entre com o acesso de demonstração. O login é demonstrativo, sem autenticação remota.

Vídeo real da passagem: `evidencias/citi-transicao.webm`. Capturado pelo teste de login em Chromium, 1280 × 900. Imagens de referência: `evidencias/citi-overview-360.png` e `evidencias/citi-overview-1280.png`.

## Decisões aplicadas
Contrato de entrada: PROPOSTA_MODULAR_ATOMICA.md da branch de Produto `tds/conv-01a1db7c-57c5-74c9-b568-dac8bf7e663e`, aprovação registrada no próprio documento. Sem ambiguidades materiais na parte desta tarefa. A proposta é referência visual; os dados vêm do controller existente, sem copiar o seed do protótipo.

Fade sobreposto nos últimos 450 ms da passagem de 1600 ms, aplicação montada e inert durante a abertura, foco entregue ao título no fim ou ao pular. O WaveMesh permanece fora da árvore autenticada. Movimento reduzido dá entrada direta. A pausa de animações quando a página fica oculta acompanha o temporizador existente.

Desktop: módulos 8/4, 7/5 e travessia de largura inteira. Celular: abertura e indicadores, valor médio, prioridades, projetos, responsáveis e travessia. Essa adaptação preserva os números na primeira dobra em 360 × 900. Top bar com links semânticos, estados de hover/foco/toque, indicador medido por ResizeObserver e sincronização por hashchange/popstate. Em movimento reduzido, o indicador reposiciona sem animação.

## Integração com Organização
Branch de entrega: `tds/conv-01a1db8f-8209-7d1d-a15a-0418168a3a29` (publicação ao encerrar este turno).

A tarefa de Organização deve incorporar esta contribuição em sua própria branch pelo fluxo permitido da plataforma, sem integrar em main antes da aprovação. Não usar o cache de leitura do projeto para fazer alterações.

- Preservar imports de OverviewBento/TopNavigation, ramo `path === '/'`, listeners de navegação e header de `src/main.jsx`.
- Acrescentar `saveMember` ao resultado do controller e substituir apenas os ramos Organização/Integrantes pelos componentes próprios.
- Manter estilos atômicos em `organization-atoms.css`; os estilos desta entrega ficam no fim de `src/style.css`.
- `Pipeline.jsx` ganha somente a opção `inspectGroups` em ValuePanel para abrir recortes a partir dos grupos financeiros na home; demais consumidores mantêm comportamento anterior.
- Service, domínio e useCentralController não foram alterados por esta tarefa.
- Após integrar, regenerar `previa/`, executar testes e verificar a prévia. A revisão integrada pelo Copilot aguarda o conjunto de Organização. Nenhum merge em main foi feito.

## Validação
Comandos usados: `npm test`, `npx playwright test --workers=1`, `npm run build:preview`, `npm run check:preview` e `git diff --check`.

O teste novo `tests/overview-fade-topbar.spec.js` amostra a opacidade das duas camadas, verifica a continuidade do canvas, foco, histórico, trocas de abas e destinos. Os testes de login existentes geram o vídeo e verificam movimento reduzido, teclado, persistência e primeira dobra em 360/1280 px.

O build mantém o aviso já existente do chunk Three.js acima de 500 kB, carregado sob demanda. Legibilidade usa superfícies grafite com opacidade de 94%, textos claros e foco verde sobre o fundo em movimento.

Resultado final: testes de domínio 9/9; bateria completa do navegador 33 aprovados e um teste novo interrompido por falta de projetos na massa inicial. Corrigida a preparação desse teste para carregar os exemplos antes de conferir os destinos; reexecução dos dois testes novos na prévia compilada: 2/2 aprovados. Assim, todos os 34 cenários foram validados entre as execuções. Build e comparação byte a byte da prévia aprovados. `git diff --check` sem erros.

Para assistir pelo navegador, use Preview em `evidencias/transicao.html` na revisão de alterações.
