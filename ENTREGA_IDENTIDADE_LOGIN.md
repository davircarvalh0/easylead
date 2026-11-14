# CITi/all · identidade, login e Visão geral

## Base e decisões verificadas

Contribuição do Codex para a implementação de identidade/login, sobre `main` em `ed27e66` (confirmado no início). Entrada de Produto: `PROPOSTA_ABERTURA_VALORES.md` e `proposta-visual/` da branch `tds/conv-01a1db0d-891d-7849-adce-45404ca83e9a`, consultada com a ferramenta git após fetch. As respostas do usuário no cartão de Produto, em 14/11/2026 às 14:39 Fortaleza, aprovam login demonstrativo, abertura até 1,2 segundo, nova Visão geral e regras de valores da etapa seguinte.

O aviso “aguardando aprovação” no documento de Produto foi desconsiderado porque o cartão posterior contém a aprovação explícita. Nenhuma ambiguidade material impede esta entrega. Os valores, mosaicos e escala 20:1 pertencem à implementação seguinte; não se alteram aqui dados nem regras financeiras para simular aquele resultado. A logo oficial PNG extraída do PDF já existe e foi reutilizada. Não falta ativo para esta entrega.

## Resultado

- CITi/all no login, marca superior, contexto, rodapé e título da aba; preto/verde e controles com transparência, reflexo e desfoque, sem sidebar.
- Login demo aceita qualquer e-mail com formato válido e domínio e código com quatro ou mais caracteres. O botão de preenchimento usa o exemplo aprovado, sem consultar provedor externo. A tela explica que não é senha institucional.
- Inválido mantém campos e formulário e anuncia o erro. Falha ao salvar sessão impede a entrada e permite tentar novamente.
- Novo login abre `#/`, monta a Visão geral ao fundo e mostra a marca centralizada por 1.050 ms. A abertura tem botão de pular, foco contido e conteúdo ao fundo inerte. Ao terminar, o foco vai ao título da Visão geral.
- Movimento reduzido pula a abertura; mudar essa preferência durante a abertura também a encerra. Recarregar sessão ativa preserva a rota/hash e seus filtros, sem repetir a abertura, inclusive se o reload ocorrer durante a animação.
- Sair remove apenas a sessão, preservando dados. Sessão ilegível retorna ao login. O código digitado não é persistido. Esta é uma demonstração local, não um mecanismo de proteção de dados ou autenticação institucional.
- Indicadores e valor médio precedem filtros, filas, cena 3D e funil. Na primeira dobra de 360×900 e 1280×900 aparecem os quatro indicadores e o valor médio. O estado vazio permanece verdadeiro até cadastrar projetos ou adicionar exemplos.
- A cena mantém seleção das estações e oferece “Explorar etapa” para abrir a seção selecionada. O atalho de pular conteúdo fica oculto até receber foco.

## Prévia e evidências

Na revisão de alterações, use **Preview em `previa/index.html`** para testar o React compilado, sem instalação. Use **Preview em `evidencias/transicao.html`** para reproduzir o vídeo versionado `citi-transicao.webm`. Ambos usam arquivos relativos da própria branch.

1. Abra a prévia sem sessão ou clique em Sair. Envie vazio ou código curto para conferir o erro.
2. Clique em Preencher acesso de demonstração e depois Entrar no CITi/all. Observe a marca, a passagem e o foco no título; Tab segue pelos links da tela.
3. Navegue até Projetos, recarregue e confirme que continua ali sem abertura. O link Visão geral e a marca voltam à rota inicial.
4. Ative movimento reduzido no navegador/sistema e repita o login: a tela abre direto.
5. Confira em 360 e 1280 pixels. Adicione exemplos para exercitar médias, filtros e o percurso existente.

Capturas desta entrega: `evidencias/citi-login-{360,1280}.png`, `citi-overview-{360,1280}.png` e `citi-overview-demo-{360,1280}.png`. Capturas anteriores não foram substituídas. A duração medida por MutationObserver no navegador foi **1.028 ms**, registrada em `evidencias/citi-duracao.json`; limite verificado de 1.200 ms. O vídeo é curto e usa a abertura real, sem acelerar a reprodução.

## Comandos e resultados

Executados em Windows com Node 24.14.1 / npm 11.11.0:

| Comando | Resultado |
| --- | --- |
| `npm ci` | Dependências instaladas; auditoria sem vulnerabilidades |
| `npm test` | 8 testes de domínio passaram |
| `npm run build` | Build de produção passou |
| `npx playwright test --workers=2` | 21 testes passaram antes da inclusão do cenário adicional de reload durante abertura |
| `npm run build:preview` | Prévia relativa atualizada |
| `npm run check:preview` | Os seis arquivos da prévia conferem byte a byte com build independente |
| `npm run test:preview -- --workers=2` | 22 testes passaram contra o build final, incluindo o cenário adicional |
| `git diff --check` | Sem erros |

As suítes legadas recebem sessão ativa por fixture para continuarem verificando os fluxos de negócio. Os testes de login usam contexto limpo e não usam esse helper. O teste de armazenamento negado isola a falha dos dados da esteira e mantém a sessão acessível; o bloqueio da gravação da sessão é coberto separadamente. Os testes também verificam teclado, caminhos existentes, dimensões mobile, médias e preservação de dados anteriores.

## Integração para blocos de valor

Esta entrega fica na branch `tds/conv-01a1db26-beee-78f9-b6bb-3f1dcfb1eb1b`. O envio da branch ocorre ao encerrar este turno. Não houve merge em main nem início de revisão integrada.

A implementação seguinte deve incorporar esta branch na sua própria branch de conversa pelo fluxo autorizado de integração antes de editar os arquivos comuns. Não partir novamente de main nem sobrescrever arquivos inteiros com a versão antiga. No cache compartilhado, usar apenas fetch/leitura; alterações pertencem ao worktree da tarefa seguinte.

Pontos de atenção:

- `src/main.jsx`: manter AuthGate na raiz, callbacks de saída, identidade e a composição `overview-summary`. Conectar ValueBlocks apenas aos trechos Leads/Projetos apropriados.
- `src/style.css`: preservar os estilos de login/entrada, foco e responsividade. Acrescentar estilos do mosaico sem substituir a folha.
- `src/views/EsteiraScene3D.jsx`: preservar o link da etapa selecionada.
- Sessão isolada em `src/controllers/useSessionController.js`, `src/services/sessionService.js`, `src/repositories/sessionRepository.js` e `src/views/AuthGate.jsx`, reduzindo conflito com a segunda implementação. Chave `citi-all-session-v1`; dados da esteira continuam em `central-citi-v1`.
- `src/domain.js`, `useCentralController.js`, `leadProjectService.js` e `stateRepository.js` não foram alterados por esta entrega. A etapa seguinte pode estendê-los para valores/agrupamentos sem carregar mudanças de sessão nesses módulos.
- Preservar `tests/session-fixture.js` nas suítes que navegam com sessão ativa; `tests/auth.spec.js` cobre login real da demo.
- Regenerar `previa/` pelo comando de build após integrar código. Não resolver conflito escolhendo assets compilados antigos. Repetir build, check:preview, domínio e E2E.

Após os blocos de valor, revisar o conjunto das duas contribuições e aguardar aprovação do usuário antes de integrar main.
