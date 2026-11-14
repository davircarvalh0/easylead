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
