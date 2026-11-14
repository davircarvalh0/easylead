# Transição CITi/all

Removida a frase do AuthGate. Sem o parágrafo, o flex existente centraliza a marca nos dois eixos; botão de pular continua no rodapé. Nenhuma alteração em estilos compartilhados, controllers, services ou repositories.

Validação em Chromium: novo login em 390×844 e 1280×844, com e sem movimento reduzido. Os testes verificam ausência da frase no overlay, centro da marca com tolerância de 2px e soma das opacidades das superfícies acima de 0,95 em cada frame. Movimento reduzido entrega diretamente a Visão geral com foco no título. A frase da seção do funil na Visão geral permanece: está fora da transição.

- npm run build: passou (aviso de chunk Three.js acima de 500 kB).
- npm test: 12 testes passaram.
- npx playwright test --workers=2: 40 testes passaram.
- Vídeos desktop.webm e celular.webm: novo login com alternativa leve forçada por ?noWebGL; a suíte existente também cobre a cena normal e falha do chunk 3D.

Sem falhas observadas. Não foi gerada previa integrada nem realizado merge. Testes em viewports móveis no Chromium, sem aparelho físico.
