# Organização — verde e malha simplificada

A cena usa o mesmo #00e676 na malha, atmosfera, núcleo e fallback. O tamanho continua vindo da quantidade de integrantes, sem mudanças de dados ou escala.

A esfera triangulada 32 × 32 gerava 3.008 arestas únicas (incluindo diagonais). Agora são 480 segmentos curvos: 10 meridianos e 5 paralelos, redução de 84%. A opacidade da malha continua em 0,5. Atmosfera e núcleo continuam superfícies suaves sem wireframe. A geometria é alocada uma vez e compartilhada: seleção, retorno e zoom só movem câmera e grupos. Mudança de movimento reduzido recria a mesma geometria simplificada.

Estrelas anteriores estavam espalhadas em um cubo de 2.000 unidades com câmera limitada a 100. Agora são 360 pontos determinísticos atrás da órbita e dentro do alcance visível, sobre fundo escuro com profundidade.

## Evidências

Abra a prévia de `evidencias/organizacao-espaco/comparacao.html` na revisão: comparação no mesmo enquadramento da visão completa e duas seleções, mais vídeo WebM. Reprodução: com Vite na porta 5186, execute `node scripts/capture-organization-space.mjs antes` na base e `node scripts/capture-organization-space.mjs depois` na implementação. Capturas usam sessão inicial idêntica, viewport 1280 × 900 e movimento reduzido para fixar a órbita; final do vídeo reativa movimento, arrasta e aproxima.

## Integração

Arquivos de produto: `components/ui/3d-orb.tsx`, `components/ui/3d-orb.css`, `components/ui/globe-geometry.js`. Não alterados main, estilo global, dependências, prévia ou funil. Relatório aprovado de Produto consultado; AnalyticsBento integral lido: Card, CountUp, gráficos, tooltip e abas destinam-se aos dashboards, sem peça de geometria reaproveitável aqui. Mantidos o ResizeObserver e o suporte a movimento reduzido já presentes na cena.

Testes: build de produção gerado (avisos de chunk e motion); teste unitário compara quantidade real de arestas e valida raio; Playwright verifica entrada direta, duas seleções/retornos e mantém canvas, além dos testes existentes de exploração, pinça, fallback, toque, teclado, escala e órbita em desktop/celular.
