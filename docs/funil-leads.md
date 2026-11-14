# Funil de Leads

O funil usa Novo, Em contato, Proposta e Ganho; Perdido aparece como saída lateral. A largura acompanha a participação no recorte com escala visual ampliada: meia largura 12 + participação * 0,72, limitada a 48; zero usa filete 7. As curvas suavizam as bordas mantendo a largura central de cada etapa.

O armazenamento atual contém somente o estágio atual. A métrica exibida é participação: quantidade na etapa dividida pelo total que atende segmento, busca e filtros de projeto vinculado. O denominador inclui Perdido e ignora a seleção de estágio, inclusive Abertos. A seleção restringe a lista abaixo e os blocos de valores existentes. Fase, subárea e status exigem projeto vinculado compatível. Nenhum histórico foi inventado.

Regras em `src/services/leadFunnelService.js`, expostas pelo Service e pelo Controller. Alterações continuam usando a persistência existente. Seleção usa botões nativos com estado pressionado, teclado e toque.

## Validação inicial

- `npm test`: 12 testes existentes passaram.
- `node --test tests/lead-funnel.test.js`: amostra conhecida, filtros cruzados, denominador estável, movimento e vazio passaram.
- `npm run build`: passou; aviso de tamanho do bundle 3D existente.
- `npx playwright test tests/lead-funnel.spec.js --config playwright.funnel.config.js`: desktop 1280 e celular 390 passaram, com toque/teclado, edição Novo → Proposta (20% → 0%, Proposta 20% → 40%), zero e vazio.
- Capturas: `evidencias/funil-1280.png` e `evidencias/funil-390.png`.

A primeira execução de navegador falhou ao localizar o campo de estágio por label exato, pois o label contém opções. Corrigido o teste para localizar o combobox pelo nome acessível. A execução seguinte passou nos dois tamanhos.

Transição importada da entrega publicada 09332b3, incluindo teste e vídeos. A integração orbital e a prévia final foram concluídas na rodada seguinte; veja revisao-integrada.md para os resultados finais. Não foi feito merge na main.

## Regressão com transição incorporada

A execução completa com seis navegadores teve 38 aprovações e quatro falhas nos testes sensíveis ao tempo da abertura/fade. Repetidos os dois arquivos afetados com um navegador por vez, os seis testes passaram. Reprodução da interferência: suíte completa com seis workers enquanto outras tarefas também usam navegadores nesta máquina. Esperado: abertura ainda visível sob relógio controlado e amostras intermediárias de opacidade. Observado: abertura já ausente ou nenhuma amostra intermediária. Não foi alterado código de produção por essa ocorrência. A configuração dedicada usa porta 5198 e um worker para evitar disputar a porta padrão e reduzir interferência.


## Rodada de proporcoes

Amostra 2/3/5: 20%, 30%, 50%, larguras centrais 52,8%, 67,2%, 96% do SVG. Curvas suavizam apenas as bordas; o centro de cada etapa depende dos seus dados. Escala ampliada e filete de zero ficam explicitos na tela. Vidro neutro em repouso, verde em selecao ou foco.
