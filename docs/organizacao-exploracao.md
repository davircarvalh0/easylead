# Organização: integração e validação

## Entrega

Arquivos próprios: `components/ui/3d-orb.tsx`, `components/ui/3d-orb.css`, `src/views/OrganizationAtoms.jsx`, `src/views/organization-atoms.css`, testes `organization-exploration`, `organization-orbit` e `organization-preservation`.

Nenhuma alteração em main.jsx, style.css, previa, cadastro de integrantes ou arquivos do funil. A prévia fica com a tarefa de integração.

## Dependência obrigatória da integração

Em main.jsx, trocar a key da route-content para:

```jsx
key={parts[1] === 'organizacao' ? 'organizacao' : path}
```

A tarefa de integração confirmou essa alteração. Ela evita desmontar o canvas ao selecionar e fechar detalhe. Para verificar os componentes, esse ajuste foi aplicado temporariamente e retirado da entrega. Os testes de continuidade do canvas exigem essa integração.

## Causas verificadas

Na base b40930b, live=false expunha a esfera CSS durante importação de Three. Agora há estado de carregamento separado, sem bola antiga. Fallback CSS fica reservado a indisponibilidade/perda real de WebGL. Movimento reduzido mantém o Globe e remove órbita e transição de câmera.

A seleção original pausava a órbita, mas não movia a câmera. Além disso, key={path} desmontava a cena em cada seleção. O foco agora interpola posição e alvo da câmera, mantendo as três camadas originais. Retorno restaura enquadramento, rotação manual e zoom. Esc funciona mesmo após o foco global ir para o título da página.

A base já possuía somente um anel verde, sem feixes cruzados. Mantive essa conexão mínima e sua cor verde em todos os estados, sem inventar remoções adicionais. Cores por id e diâmetros calculados por integrantes foram preservados.

## Interação

Arrasto com limiar de 6px, captura de ponteiro, zoom por roda e pinça limitado entre 0,65 e 1,8, controles por botão, teclado e toque. Arrasto não navega; clique no fundo, Esc e botão retornam à visão completa. Detalhe lateral no desktop e abaixo da cena em mobile.

## Evidências e execução

- Build Vite passou (avisos de tamanho de bundle preexistentes).
- Testes de exploração: desktop/mobile, mesmo canvas na seleção, Escape, arrasto, zoom por botão/roda, movimento reduzido, troca de aba e retorno passaram.
- Teste de pinça via eventos Pointer e fallback sem WebGL passou. Toque real via touchscreen e perda de contexto passaram no teste de órbita.
- Testes de órbita em 360 e 1280 passaram, incluindo mudança de contagem após cadastro e visibilidade da aba.
- Pinça foi exercitada com eventos sintetizados; não substitui validação física em aparelho.

Comandos (após integrar a key acima):

```sh
npx playwright test --config playwright.funnel.config.js tests/organization-exploration.spec.js tests/organization-orbit.spec.js --workers=1
npm run build
```

`evidencias/organizacao/` contém capturas de foco e o mesmo recorte real de Leads antes/depois, na base b40930b, com sessão autenticada, dados seed e sem filtros, viewports 360/390/1280 × 900. Esperei 1800ms para finalizar a transição de entrada. Geometria x/y/largura/altura e outerHTML completos do funil foram exatamente iguais nas três larguras. Capturas PNG não são idênticas: o fundo animado compartilhado varia com o tempo. Não se afirma igualdade pixel a pixel do fundo.

Para repetir a captura, definir RECORTE=antes ou depois e executar `tests/organization-preservation.spec.js`. A revisão integrada deve repetir o mesmo recorte com os módulos da tarefa de integração; estas evidências cobrem exclusivamente esta mudança.
