# Organização atômica e cadastro — entrega integrada

A contribuição publicada da tarefa de fade/topbar foi incorporada por cópia dos arquivos da revisão 671e928, lidos pelo git da plataforma. A integração preserva OverviewBento, TopNavigation, AuthGate, Pipeline e os estilos compartilhados. Não houve merge em main.

Organização usa os dados existentes, um átomo por subárea, contagem exata e escala normalizada por raiz quadrada aprovada: 108–196px no desktop e 88–144px no celular. O alvo mínimo é 104px. Links funcionam com toque, Tab, Enter e Espaço; setas e Home/End movem o foco.

O formulário está na Organização e no diretório. Dentro da subárea, ela vem selecionada. Nome e Subárea são obrigatórios; Papel é opcional, com padrão Integrante. O fluxo continua Controller → Service → Repository, na chave central-citi-v1. Erros de escrita não publicam o novo estado. O feedback só confirma após persistir.

## Evidências

- evidencias/organizacao-1280.png e organizacao-360.png: comparação 6 × 1, contagem, formulário e pessoa cadastrada.
- evidencias/integrantes-1280.png e integrantes-360.png: diretório após recarga, mantendo a pessoa cadastrada.
- evidencias/citi-transicao.webm e transicao.html: passagem integrada.
- previa/index.html: usar Preview na revisão de alterações para abrir a aplicação compilada.

## Validação

npm test: 12 testes aprovados. npm run build:preview: aprovado, com aviso existente do chunk Three.js acima de 500 kB. npm run check:preview: prévia idêntica byte a byte ao build atual.

A suíte de navegador foi executada contra a prévia na porta 5197, usando configuração temporária equivalente a playwright.preview.config.js (a porta padrão estava ocupada). Os novos testes percorrem cadastro, validação, duas telas, recarga, comparação de diâmetros, alvo mínimo, teclado e ausência de overflow em 1280 e 360px, com movimento reduzido.

Capturas inspecionadas visualmente para desktop e celular. Os testes de login/topbar existentes cobrem o modo animado e a navegação/histórico integrada. A revisão Copilot é solicitada ao final desta entrega, sem merge automático.

Resultado final: 36/36 cenários do navegador aprovados na prévia integrada. npm run build também aprovado. git diff --check sem erros. Capturas e comandos ficam registrados nesta entrega para consulta fora do chat.
