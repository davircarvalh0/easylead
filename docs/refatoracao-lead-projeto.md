# Refatoração lead → projeto

## Base e plano aprovado

Base confirmada por consulta remota da plataforma: `main`, HEAD `50d992dd41a6b8e6a33c0e97d80794c8f9a35f1e`, igual ao HEAD inicial desta conversa. O redesign já está integrado nessa base. A implementação acontece na branch da conversa; nenhuma branch antiga foi usada.

Objetivo aprovado: separar View → Controller → Service → Repository no cadastro/edição de lead, conversão e atualização do projeto resultante, preservando comportamento, rotas, visual, interações e dados anteriores. Manter JavaScript, React e Vite, sem dependências adicionais, store global ou novas regras de produto.

Mapa anterior:

- `src/main.jsx`: App e todas as telas, navegação por hash, filtros, foco; LeadForm e Conversion com dados, eventos, regras chamadas diretamente, erros e navegação. App.commit serializava e gravava antes de atualizar a tela. Inicialização e efeito tratavam leitura indisponível.
- `src/domain.js`: seed, estágios, status, saveLead, convert, changeStatus, metrics, actionableLeads, chave persistida e readState.
- `src/Magnetic.jsx` e `src/style.css`: interações e visual preservados.

Mudanças aprovadas e executadas:

| Arquivo | Responsabilidade |
| --- | --- |
| `src/repositories/stateRepository.js` | Storage injetado, readState, chave, validação do formato, JSON e gravação completa; impedir sobrescrita após leitura inválida. |
| `src/services/leadProjectService.js` | Regras puras saveLead, convert e changeStatus movidas sem mudar contratos; serviço com repository injetado para carregar e persistir resultados. |
| `src/domain.js` | Dados iniciais, constantes e consultas puras; retirar regras de mutação e persistência. |
| `src/controllers/useCentralController.js` | Carregamento, estado compartilhado, feedback e ações; publicar somente após persistência bem-sucedida. |
| `src/controllers/useLeadController.js` | Hooks de edição e conversão: dados, eventos, erros, troca de área, equipe e navegação após sucesso. |
| `src/views/LeadForm.jsx` | JSX do formulário de lead, preservando labels, classes, chaves de montagem e Magnetic. |
| `src/views/Conversion.jsx` | JSX de conversão, preservando campos, equipe e mensagens. |
| `src/main.jsx` | Integrar Controllers e Views, retirando acesso direto ao storage e mutações; manter composição das outras telas, rotas, filtros e foco. |
| `tests/domain.test.js` | Ajustar imports e verificar regras, repository, compatibilidade e falhas com storage simulado. |
| `tests/flow.spec.js` | Acrescentar regressões de dados anteriores, repetição de conversão, troca de área e falhas sem navegação nem alteração indevida. |
| `tests/redesign.spec.js` | Apenas ajustar imports das regras transferidas. |
| `previa/index.html`, `previa/assets/*` | Regenerar a prévia pelo build existente. |
| Este documento | Plano, mapa, estrutura, contribuição, verificações e revisão. |

Estrutura resultante:

```text
src/
  main.jsx
  domain.js
  Magnetic.jsx
  style.css
  views/
    LeadForm.jsx
    Conversion.jsx
  controllers/
    useCentralController.js
    useLeadController.js
  services/
    leadProjectService.js
  repositories/
    stateRepository.js
```

A View chama hooks Controllers. Controllers chamam o Service; o Service usa o Repository. Service e Repository não importam React, Views ou Controllers. Todos podem consumir dados/constantes compartilhados do domínio. Não há dependência inversa.

## Comportamento preservado e decisões de implementação

- Chave `central-citi-v1`, versão do esquema, arrays e campos extras preservados; uma única gravação do estado inteiro mantém ambos os vínculos lead/projeto. Nenhuma migração ou fragmentação por entidade.
- Mesmas validações, mensagens e ordem das regras: lead deve existir; projeto já vinculado por leadId retorna o mesmo projeto antes de validar nova entrada; só Ganho converte; responsável deve pertencer à área. Outros integrantes podem ser de outras áreas; a equipe inclui responsável e elimina duplicatas.
- Projeto inicia Planejado, lead convertido permanece Ganho; identificadores e links persistidos continuam válidos.
- Storage é resolvido de forma tardia, incluindo o caso em que o próprio getter localStorage lança erro. Falha de leitura usa demonstração em memória e bloqueia gravação. Falha de escrita mantém estado, formulário e rota, permitindo repetir a operação após corrigir o armazenamento.
- O Controller mantém uma referência ao último estado publicado para duas submissões síncronas não trabalharem sobre snapshots diferentes e criarem projetos duplicados. Não foram introduzidos efeitos de autosave.
- Mantidos os estados controlados dos formulários, chaves de montagem, marcação e CSS. A leitura inicial única substitui a leitura duplicada anterior, mantendo a mensagem de erro.
- Fora do escopo: reorganizar as demais telas, mudar visual, validar novos requisitos, sincronizar abas ou adicionar bibliotecas.

## Registro de contribuição e verificação

Implementador: Codex. Aplicadas as skills atribuídas `react-patterns` e `vercel-react-best-practices`, com hooks no topo, estado derivado sem efeitos extras, inicialização preguiçosa e imports diretos. A extração dos hooks atende a separação explicitamente aprovada pelo usuário.

Baseline antes das mudanças:

| Comando | Resultado |
| --- | --- |
| `npm ci` | Sucesso; nenhuma vulnerabilidade reportada. |
| `npm test` | Sucesso: 2 testes. |
| `npm run test:e2e` | Sucesso: 6 testes. |
| `npm run build` | Sucesso. |

Os testes adicionados usam o esquema anterior, incluindo um projeto persistido com identificador fixo e campos extras, sem gerar essa fixture pelo novo serviço. Cobrem edição, área/responsável, equipe de outra área, submissão dupla, retorno ao mesmo projeto, recarga, JSON inválido, formato incompatível, getter bloqueado, quota e falha ao alterar status. A suíte existente mantém indicadores, filtros, teclado, foco, movimento reduzido e percursos desktop/mobile.

Durante a primeira verificação ampliada, a passagem de texto por um pipe de edição corrompeu acentos em mensagens novas. Os testes detectaram o problema, a codificação foi corrigida e a suíte completa foi repetida. Não foi necessário alterar as expectativas para contornar falhas.

Resultados finais (todos com saída zero):

| Comando | Resultado |
| --- | --- |
| `npm test` | 5 testes aprovados. |
| `npm run test:e2e` | 12 testes aprovados, incluindo percursos desktop/mobile. |
| `npm run build` | Build de produção concluído. |
| `npm run build:preview` | Prévia regenerada. |
| `npm run check:preview` | Os três arquivos da prévia coincidem byte a byte com uma compilação independente. |
| `npm run test:preview` | 12 testes aprovados sobre a prévia compilada. |

As oito capturas finais coincidem byte a byte com as capturas da base; nenhuma alteração visual precisou ser versionada. CSS e Magnetic permanecem sem mudanças. O diff também foi conferido com `git diff --check`.

## Revisão e aprovação

Após concluir as verificações, solicitar AI review ao Revisor · GitHub Copilot, com foco na direção das dependências, compatibilidade dos dados anteriores e regressões lead → projeto. O parecer chega em turno posterior; não é uma aprovação já obtida. Achados deverão ser registrados com passos de reprodução, corrigidos pelo Implementador e acompanhados da repetição das verificações afetadas.

Diff disponível na revisão de alterações da tarefa. A prévia visual abre pelo botão Preview de `previa/index.html`. Nenhum merge foi realizado: a entrega depende da aprovação do usuário sobre diff, resultados e revisão.
