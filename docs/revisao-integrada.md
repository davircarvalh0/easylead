# Revisão integrada — FunnelChart e globos

O funil deriva do anexo integral em docs/fontes/funnel-chart.original.tsx; o mapa verificável está em docs/funnel-adaptacoes.md. Curvas, camadas e animações originais preservadas na orientação vertical. Largura normalizada pela maior contagem; participação no total filtrado; ordem fixa, inclusive Perdido.

Os seis arquivos dos globos foram incorporados da branch publicada tds/conv-01a1e16e-d51a-726b-831a-6b2e544c558c. Camadas e escala documentadas em docs/globe-camadas.md. Cadastro permanece em Integrantes.

Resultados:
- npm test: 15 passaram.
- Suíte completa via playwright.funnel.config.js com dois workers: 50 passaram.
- Após ajuste final de empilhamento dos rótulos, os cinco testes do funil passaram novamente.
- Build de produção/prévia concluído; check:preview confere os oito arquivos byte a byte.
- Percurso de produção em desktop/celular: cadastro, globo atualizado, seleção e funil com/sem filtro.
- Caso 0/2/3/5: 0%, 20%, 30%, 50%; maior contagem usa largura máxima, sem primeira etapa no denominador. Filtros, edição, vazio, mouse, toque, Enter e Espaço exercitados.
- Inspeção visual das capturas desktop e celular; rótulos acima das camadas SVG.
- Tentativas anteriores: erro inicial de declaração corrigido; builds concorrentes causaram recarga da página durante testes e uma gravação excedeu 30 segundos. Execução estável completa passou. O teste de vídeo agora permite 60 segundos.
- Avisos de build: diretivas use client do Motion ignoradas pelo Vite e chunk compartilhado Three acima de 500 kB, sem impedir build.

Abra previa/index.html pelo botão de prévia na revisão de alterações. evidencias/rodada/index.html reúne vídeos e capturas com/sem filtro.

Main permanece sem alteração. Revisão por IA do conjunto e aprovação visual do usuário precedem a integração.
