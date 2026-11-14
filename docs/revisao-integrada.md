# Revisao integrada atual

Esta secao substitui os resultados historicos abaixo. Proposta aprovada conferida na branch de Produto. Leads persistem apenas estagio atual; percentuais sao participacao no total filtrado, incluindo Perdido. Selecionar etapa preserva denominador e filtros.

Organizacao incorporada seletivamente: sete arquivos da branch tds/conv-01a1dbf5-b1d1-7b65-8880-d8668a213f1b, sem mudar main.jsx, Controller, Service ou Repository. Cadastro apenas em Integrantes.

Resultados por colaborador:
- Produto: composicao aprovada, conforme relatorio publicado.
- Implementador Organizacao: declarou build, 12 regras e 5 E2E aprovados; os 5 E2E confirmados independentemente depois da integracao, saida 0.
- Implementador Funil/integracao: npm test, 14 passaram, saida 0. Amostra 2/3/5, filtro, movimento, zero e vazio incluidos.
- Suite completa com configuracao funnel e um worker: 49 passaram, saida 0; antes da incorporacao final de Organizacao.
- Depois da incorporacao: 5 testes de Organizacao e 2 percursos integrados sobre previa de producao passaram, saida 0.
- Build, build:preview e check:preview passaram; oito arquivos conferidos byte a byte. Aviso existente de tamanho do Three.js permanece.

Amostra 2/3/5: 20%, 30%, 50%, Proposta mais larga nos dois tamanhos. Teclado no desktop e toque no celular abrem cinco leads mantendo base 10. Escala visual ampliada e filete de zero explicados na tela. Primeira tentativa dos novos testes falhou por codificacao do texto esperado; corrigida, a suite passou.

Previa: previa/index.html, botao Preview. Capturas e videos atualizados: evidencias/rodada/index.html. Capturas mobile do funil e Organizacao inspecionadas visualmente, legiveis e sem corte lateral. Revisao por IA solicitada ao encerrar; aprovacao visual do usuario ainda necessaria antes de merge na main.

## Historico anterior

# Revisão integrada CITi/all

As entregas de transição (09332b3) e organização orbital (323f321) foram incorporadas seletivamente a esta branch, preservando a implementação do funil, main.jsx, Service e Controller. Não houve merge na main.

Abra `previa/index.html` pelo botão de prévia na revisão de alterações. `evidencias/rodada/index.html` reúne vídeos e capturas de desktop (1280px) e celular (390px), também renderizável pelo botão de prévia.

## Resultados

| Verificação | Resultado |
| --- | --- |
| `npm test` | 12 testes de domínio passaram, saída 0 |
| `node --test tests/lead-funnel.test.js` | Amostra conhecida e regras de participação passaram, saída 0 |
| `npm run build:preview` | Build de produção passou, saída 0 |
| `npm run check:preview` | Os oito arquivos da prévia conferem byte a byte com novo build, saída 0 |
| `npx playwright test --config playwright.funnel.config.js` | 45 testes passaram, um navegador por vez, saída 0 |
| `npx playwright test --config playwright.integrated.config.js` | Dois percursos na prévia de produção passaram, saída 0; vídeos e capturas gravados |

A suíte cobre fade e foco após login, retirada da frase, movimento reduzido, órbitas em desktop/celular, seleção em movimento por toque, pausa por foco e detalhe, saída/retorno da aba, fallback por perda de contexto, cadastro, contagem/tamanho, diretório e persistência. Cobre também vínculos, erros de armazenamento e filtros existentes.

No funil, a amostra de cinco leads começa com um em cada estágio (20%). Após mover Novo para Proposta, Novo fica com zero (0%) e Proposta com dois (40%). O filtro de segmento permanece no recorte e selecionar Novo mantém o denominador em cinco; a lista fica vazia. Recorte sem leads devolve percentuais zero, sem divisão inválida. Botões foram exercitados por teclado em desktop e toque no celular.

Os vídeos da prévia mostram login, fade, órbitas animadas, seleção, cadastro com atualização de um para dois integrantes e acesso ao funil. As capturas foram inspecionadas visualmente.

## Falhas e limites

Não houve falha na execução integrada final. Na validação anterior, seis navegadores simultâneos produziram falhas de tempo da abertura e de amostragem do fade; elas passaram com um navegador por vez. Reprodução, esperado e observado estão em `funil-leads.md` e `organizacao-orbital.md`. O teste inicial do funil também teve um seletor corrigido; os arquivos registram a ocorrência sem atribuí-la ao produto.

O build avisa que o módulo compartilhado Three supera 500 kB; ele continua carregado sob demanda. Não foi feita migração de stack nem alteração de persistência. Os dados disponíveis contêm somente estágio atual: o funil mostra participação, incluindo Perdido no denominador, sem inventar conversão. As larguras desenham a sequência visual; contagens e percentuais informam os dados reais.

Aprovação do usuário continua necessária antes de merge na main. Revisão integrada solicitada ao Revisor GitHub Copilot após esta entrega.
