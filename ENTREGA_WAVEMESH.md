# Integração WaveMesh e transições

Responsável: Implementador (Codex Medium). Entrada: proposta aprovada de Produto, copiada da branch de pesquisa para PROPOSTA_WAVEMESH_3D.md. Fonte integral preservada em docs/WaveMesh.original.tsx.

## Decisões e contribuição

A aprovação de 1.600 ms substitui o antigo teto de 1.200 ms. A suíte mede montagem e remoção com MutationObserver (evidencias/citi-duracao.json), tolerância aprovada de 1.800 ms. Sessão restaurada não repete a abertura.

O algoritmo original de ondas, projeção, neblina, cristas, colina e anéis foi adaptado de TSX para JSX, sem redesenhar o efeito. Paleta preta/verde, canvas fixo sem eventos de ponteiro, listeners passivos em window, cores padrão estáveis e montagem acima de AuthGate. Corrigido o teste de limite vertical original (sx > height para sy > height). Preferência de movimento agora responde em tempo real. Observers, RAF e listeners são removidos no cleanup. Anel e pequeno deslocamento de câmera acompanham a passagem pós-login.

Cena 3D real com câmera e portais em Three.js direto: sem necessidade de R3F, GSAP ou Motion para esta cena curta. Chunk separado, pré-carregado após montagem do login, sem aguardar para habilitar o formulário. Se indisponível, lento ou com perda de contexto, portais CSS mantêm a passagem. ?noWebGL força essa alternativa para inspeção. Movimento reduzido pula a passagem e mantém o fundo estático. Página oculta pausa RAF, animações CSS, animações de layout e o prazo da passagem. O chunk WebGL tem aproximadamente 518 kB minificados (129 kB gzip); Vite avisa sobre tamanho, mas ele fica separado do bundle principal.

Leads e Projetos preservam escala linear interna 20:1, cores de estimativa, valores exatos, alvo mínimo de 68 px e faixa fora da escala. FLIP pela Web Animations API anima deslocamentos ao mudar agrupamento ou filtros; diálogo tem entrada suave. Controller → Service → Repository e regras comerciais preservados; somente o prazo visual no controller de sessão mudou.

## Evidências e reprodução

- npm test: testes de domínio existentes.
- npm run test:e2e -- --workers=1: autenticação, filtros, percurso até squad, teclado, captura e vídeo; testes novos em tests/wavemesh.spec.js verificam identidade do mesmo canvas entre abas, toque real, modo leve, falha do chunk, preferência dinâmica e pausa com document.hidden simulado.
- npm run build e npm run build:preview: builds de produção e prévia relativa.
- npm run check:preview: compara arquivos da prévia com build atual byte a byte.
- npm run test:preview: executar após finalizar a suíte E2E; ambas usam a porta 5186.
- Com servidor dev na porta 5186: node scripts/verify-webgl.mjs registra modo WebGL e erros em evidencias/wavemesh-webgl.json, além de captura da passagem.

Vídeo: evidencias/citi-transicao.webm. Capturas: evidencias/wavemesh-Leads-360.png, wavemesh-Leads-1280.png, wavemesh-Projetos-360.png, wavemesh-Projetos-1280.png e wavemesh-transicao-3d.png. Evidências produzidas por este Implementador; a revisão independente é do Copilot, não foi simulada por outro agente.

Inspeção visual: usar Preview de previa/index.html na revisão das alterações. A validação automatizada usa Chromium; não substitui aprovação visual do usuário nem teste físico em Safari/Android. Pausa de página é simulada no teste, não uma alegação de medição em aparelho físico.

## Ocorrências durante verificação

A primeira execução revelou ausência do import React na conversão JSX, corrigida. Uma execução paralela apresentou falha no teste magnético de ponteiro; passou isolado. Alterações com Vite ativo invalidaram uma rodada de identidade de canvas; nova rodada integral foi feita sem editar fontes. Teste estático passou a aguardar confirmação da preferência aplicada antes de comparar imagens. A primeira execução de test:preview coincidiu com o servidor E2E na mesma porta; deve rodar em sequência.

Nenhuma mesclagem autorizada ou realizada. Revisão Copilot deve examinar o diff real antes da aprovação visual.

## Resultados finais do Implementador

- npm test: 9 testes aprovados, saída 0.
- npm run test:e2e -- --workers=1: 28 testes aprovados, saída 0.
- npm run build, npm run build:preview e npm run check:preview: saída 0; prévia idêntica ao build atual.
- node scripts/verify-webgl.mjs: modo webgl, nenhum pageerror.
- git diff --check: saída 0.

Na primeira execução da suíte sobre a prévia, 27 testes passaram e o teste de falha do módulo 3D não interceptou o nome com hash do build (esperado: fallback light; observado: webgl). Corrigido o padrão da interceptação para cobrir tanto JSX quanto o chunk compilado. Isso foi uma correção da instrumentação de teste. O teste de foco também foi corrigido para distinguir troca de rota de clique na aba já ativa.
- npm run test:preview -- --workers=2: rodada final com 28 testes aprovados, saída 0, incluindo falha do chunk compilado. Medição final pós-login: aproximadamente 1.585 ms, abaixo de 1.800 ms.
