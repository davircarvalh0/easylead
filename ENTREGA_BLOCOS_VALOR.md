# CITi/all · blocos de valor e prévia integrada

Contribuição do Codex: implementação de Leads/Projetos sobre a entrega de identidade, login e Visão geral. A correção posterior do usuário solicita **Medium**; este registro não afirma mudança da configuração de um runtime já iniciado.

## Origem e integração

- Base desta conversa: `ed27e66bec46400af25db5595480bbf53726b397`.
- Produto: `PROPOSTA_ABERTURA_VALORES.md` e `proposta-visual/` na branch `tds/conv-01a1db0d-891d-7849-adce-45404ca83e9a`, consultados após fetch pelo git da plataforma. Conferidos contra a aprovação registrada no cartão às 14:39 de 14/11/2026: valores por tela, R$ 200 mil/R$ 10 mil, faixa sem valor e piso mobile de 68 px.
- Identidade: branch `tds/conv-01a1db26-beee-78f9-b6bb-3f1dcfb1eb1b`, commit **`4f0df14fa5817b1e0b51156903685efec06cde82`**. `ENTREGA_IDENTIDADE_LOGIN.md` lido antes de alterar os arquivos comuns. A diferença binária completa entre a base e esse commit foi aplicada nesta conversa, com verificação prévia de aplicação limpa. Assim, sua contribuição inteira está no diff integrado, sem criar outra branch ou mesclar main. A ancestralidade do commit de origem não foi alterada.
- Código de sessão, AuthGate, identidade, foco, movimento reduzido, navegação da cena e composição da Visão geral foram preservados. Prévia recompilada a partir do conjunto integrado.
- Não há ambiguidade material pendente. A proposta usa cartões ampliados e uma camada proporcional. Para que a **área colorida medida**, e não apenas sua porcentagem CSS, seja realmente 20:1, as faixas internas têm a mesma largura e altura em todos os cartões. Preencher 100% de um cartão grande e 5% de um cartão pequeno não produziria essa proporção geométrica. Essa precisão mantém a semântica aprovada e é explicada na interface.

## Comportamento entregue

Leads usa estimativa positiva até existir projeto com contrato e valor positivo. Depois usa o contratado, mantendo o estimado na origem no detalhe. Projetos considera exclusivamente contratos positivos; itens sem valor ou sem contrato ficam em faixa separada, coerente com a média existente. Zero, valores negativos, não finitos e ausentes não entram na escala.

Aurora e Horizonte começam com estimativas de R$ 200.000 e R$ 10.000 em sessões novas. O botão **Adicionar comparação Aurora e Horizonte**, em Leads e Projetos, cria os dois contratos e squads demonstrativos; Aurora mantém R$ 185.000 de estimativa na origem e R$ 200.000 contratado. O botão de exemplos anterior continua independente, preservando o cenário de médias original. A carga é idempotente e não substitui projetos existentes. Dados salvos anteriormente não recebem estimativas inventadas por migração.

Os cartões têm tamanhos por faixa de valor e uma faixa interna com área proporcional exata. O piso é de pelo menos 68 px no celular; textos e metadados podem aumentar a altura necessária. O cartão inteiro permanece clicável, com hover, toque, foco e seleção. A faixa colorida é verde para contratado e ciano para estimativa, acompanhada por rótulo textual e valor em reais.

Há comparação direta, agrupamento de Leads por etapa e de Projetos por squad/subárea ou fase, com subtotal. A escala é comum a todos os grupos do recorte. Segmento, fase/tipo, subárea e estágio/status se combinam; a busca atualiza os blocos. Parâmetros dos filtros e agrupamento ficam no hash e sobrevivem ao reload. Leads sem projeto são excluídos quando o recorte exige fase/subárea/status de projeto: não são classificados por suposição.

Selecionar abre diálogo nativo com empresa, segmento, valores, responsável, equipe, fase, squad, subárea e vínculos. Enter e toque abrem; Tab permanece no diálogo; Escape e Fechar devolvem o foco ao bloco. Links conduzem ao lead, projeto e nova página do squad, com responsável, integrantes, subárea e projetos. O percurso do inspetor ao projeto e ao squad conserva os parâmetros de recorte. As listas e formulários existentes continuam acessíveis.

Regras financeiras, filtragem, agrupamentos e carga da demonstração estão em `leadProjectService`; persistência permanece no Repository. `useCentralController` fornece os modelos e coordena mutações; o componente renderiza o modelo e a interação nativa do diálogo.

## Como conferir a prévia

Na revisão de alterações, use **Preview em `previa/index.html`**. É o React compilado, com arquivos relativos, sem instalação. Para o vídeo real da abertura, use **Preview em `evidencias/transicao.html`**, que reproduz `citi-transicao.webm`.

1. Entre com o acesso demonstrativo. Confira o erro com dados inválidos, a abertura no login válido e o reload sem repetir a animação.
2. Abra Leads e clique em **Adicionar comparação Aurora e Horizonte**. Compare R$ 200 mil e R$ 10 mil, observe os rótulos e selecione ambos por teclado ou toque.
3. No detalhe de Aurora, confira estimado de R$ 185 mil e contratado de R$ 200 mil. Siga **Abrir projeto vinculado →** e **Explorar squad →**.
4. Combine segmento Finanças & Pagamentos, Delivery e Inovação; em Leads, combine também Ganho. Recarregue e confira o recorte.
5. Em Projetos, alterne comparação direta, squad/subárea e fase. Para incluir exemplos sem valor e sem contrato, adicione os exemplos de filtros e médias na Visão geral e volte a Projetos.
6. Confira em 1280 e 360 px e com movimento reduzido. A explicação da escala diferencia a área colorida do tamanho externo do alvo.

Capturas do conjunto: `evidencias/valores-leads-1280.png`, `valores-leads-360.png`, `valores-projetos-1280.png` e `valores-projetos-360.png`. As capturas de login/Visão geral e vídeo da entrega anterior estão incluídos e foram revalidados com o código integrado.

## Verificação

| Comando | Resultado |
| --- | --- |
| `npm ci` | Dependências instaladas, auditoria sem vulnerabilidades |
| `npm test` | 9 testes de domínio passaram, incluindo semântica financeira, escala, agrupamentos, filtros e idempotência |
| `npm run build` | Build de produção passou |
| `npm run build:preview` | Prévia relativa gerada |
| `npm run check:preview` | 6 arquivos conferem byte a byte com build independente |
| `npm run test:preview -- --workers=2` | 24 cenários integrados, incluindo os 22 existentes e os 2 novos para desktop/mobile |
| `git diff --check` | Sem erros de whitespace |

Os testes novos medem largura × altura das áreas coloridas no DOM, verificam 20:1 nas duas telas, diferença de tamanho dos cartões, piso de toque, seleção por Enter/toque, Escape com retorno de foco, filtros combinados, reload, percurso até squad, busca vazia e ausência de erros JavaScript/overflow horizontal. Os testes legados continuam cobrindo login válido/inválido, sessão ativa, movimento reduzido, foco, persistência e vínculos. O teste de fluxo de Leads foi atualizado para abrir o detalhe pelo bloco antes de editar.

Durante a verificação foram corrigidos a codificação dos textos gerados pelo shell e os seletores novos de teste. A validação final usa a prévia recompilada. Revisão integrada do Revisor GitHub Copilot solicitada ao encerrar a entrega; seu parecer ainda é uma etapa posterior. Nenhum merge em main: a prévia continua sujeita à aprovação final do usuário.
