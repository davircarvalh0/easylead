# Importação da biblioteca React

Verificação em 13/11/2026 (Fortaleza). Resultado: **0 novas importadas, 1 pulada por já existir, 9 pendentes de publicação**. As nove skills exatas foram encontradas nas fontes indicadas e suas pastas completas estão preservadas em `sources/`. O redesign pode continuar; esta tarefa não altera o aplicativo nem os padrões dos agentes.

## Inventário

| Skill | Origem | Pasta na origem | Arquivos / bytes | Estado / skillId |
| --- | --- | --- | --- | --- |
| vercel-react-best-practices | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | Não baixada: já instalada | Não reimportada | Pulada; usar `neGYGk5pqLrLmpfc5CwBO`; duplicata inicialmente listada: `xvHtF_g3iEe869ObRYJ6p` |
| gsap-react | [greensock/gsap-skills](https://github.com/greensock/gsap-skills) | `skills/gsap-react` | 1 / 6.565 | Pendente; sem novo ID |
| react-native-best-practices | [callstackincubator/agent-skills](https://github.com/callstackincubator/agent-skills) | `skills/react-native-best-practices` | 44 / 6.641.022 | Pendente; sem novo ID |
| clerk-react-patterns | [clerk/skills](https://github.com/clerk/skills) | `skills/clerk-react-patterns` | 12 / 20.541 | Pendente; sem novo ID |
| react-doctor | [millionco/react-doctor](https://github.com/millionco/react-doctor) | `skills/react-doctor` | 2 / 10.906 | Pendente; sem novo ID |
| react-email | [resend/react-email](https://github.com/resend/react-email) | `skills/react-email` | 9 / 114.166 | Pendente; sem novo ID |
| react-patterns | [affaan-m/ecc](https://github.com/affaan-m/ecc) | `skills/react-patterns` | 1 / 11.466 | Pendente; sem novo ID |
| react-router-framework-mode | [remix-run/agent-skills](https://github.com/remix-run/agent-skills) | `skills/react-router-framework-mode` | 13 / 86.030 | Pendente; sem novo ID |
| react-mcp | [assistant-ui/skills](https://github.com/assistant-ui/skills) | `assistant-ui/skills/react-mcp` | 4 / 29.172 | Pendente; sem novo ID |
| react-hook-form | [pproenca/dot-skills](https://github.com/pproenca/dot-skills) | `skills/.curated/react-hook-form` | 41 / 112.171 | Pendente; sem novo ID |

O [manifesto completo](../skills-import-manifest.json) registra, para cada pasta recuperada, repositório, commit da origem, caminho e SHA-256/tamanho de **cada arquivo**. Não houve substituição por skills de nomes semelhantes. `vercel-react-native-skills` (`X8eqgrKQpxM7W9Fv0VuFI`) não foi tratada como equivalente à skill da Callstack. Não apagamos nem atualizamos nenhuma skill existente.

## Preservação e verificação

Foram preservados 127 arquivos: `SKILL.md`, referências, metadados, templates, instruções auxiliares e imagens, quando presentes na pasta original. Cada arquivo foi extraído do objeto Git com `git cat-file blob`, evitando conversão CRLF e problemas de checkout com caminhos longos no Windows. Os checkouts de millionco/react-doctor e pproenca/dot-skills tiveram falhas; a extração dos objetos recuperou suas pastas completas. As cópias foram verificadas byte a byte na preparação e novamente por SHA-256 no destino versionado. Nenhuma instrução original foi reescrita.

Todas as pastas têm `SKILL.md` na raiz e respeitam os limites de 256 arquivos e 10 MB por skill. A skill Callstack inclui suas 12 imagens PNG; não foi reduzida a texto. `.gitattributes` desativa a conversão de finais de linha nas pastas preservadas, inclusive em checkouts com `core.autocrlf=true`. Os clones completos são temporários e ignorados; apenas as pastas das skills e suas evidências são versionadas. A preservação cobre a pasta da skill, não todo o monorepositório nem dependências externas mencionadas nas instruções.

Para repetir a conferência local: `python skills-import/verify.py`. A aplicação não foi alterada; testes de interface/build não se aplicam a esta entrega. A conferência de integridade não valida a execução de exemplos, comandos ou APIs recomendados por terceiros.

## Bloqueio exato da publicação

A ferramenta disponível é `mcp__tds__call_tool`, com `name: "create_skill"` e `params: {"dir": "skills-import/sources/<nome>"}`. O schema foi recarregado após a informação do usuário sobre Nitro5; continua aceitando `dir` relativo ao worktree, pasta inteira, inclusive binários. Não existe nesta sessão uma operação de importação GitHub exposta pelo schema de criação. Por isso foi usado o método local completo, a partir dos repositórios GitHub.

Houve uma primeira tentativa das nove pastas temporárias e uma segunda tentativa das nove pastas preservadas acima. Todas retornaram exatamente:

> This machine's Todos CLI predates directory import (needs ≥ 0.1.65): ask the user to run `tds upgrade` on it, or pass small text files inline via files.

**Essa mensagem não comprova que o Nitro5 precisa de upgrade.** O usuário informou que `machines` mostra v0.1.71. A inspeção local confirmou `@todos-dev/cli` **0.1.71** em `C:/Users/Davi Carvalho/AppData/Local/Programs/Todos/resources/machine/package.json`. O processo de daemon identificado no `daemon.json` é um processo utilitário de `Todos.exe` dessa instalação. Seu `dist/index.js` contém `withLocalSkillTools`, `readSkillDir`, `uploadSkillDir` e suporte multipart a binários. O comando `tds` não está no PATH deste shell; isso não muda a versão do pacote embarcado.

Há processos MCP Node com argumento relativo `./mcp/server.mjs`, mas não foi possível estabelecer, com os metadados disponíveis, o diretório desse script nem qual deles serve esta chamada. O código embarcado intercepta localmente os nomes diretos `skills`, `create_skill` e `update_skill`; a chamada disponível nesta sessão é o invólucro `call_tool`. **Hipótese:** a chamada aninhada não passa pela interceptação local. Isso explica a divergência, mas não foi comprovado como causa do erro. Não afirmar que o executável errado foi identificado. `machines` não é exposto no catálogo desta sessão e sua consulta não foi reproduzida por este agente.

Nenhuma instalação foi atualizada, nenhum serviço reiniciado e nenhum segredo foi acessado. Não usamos `files` para colar conteúdo que já está em disco nem descartamos binários para contornar o bloqueio. Não houve publicação parcial. É preciso corrigir ou disponibilizar o encaminhamento local de `create_skill(dir)` e repetir a publicação das pastas preservadas; depois, conferir os arquivos carregados e registrar os novos IDs neste relatório. Até lá, as nove skills **não estão disponíveis na biblioteca**.

A consulta inicial de `skills` listou as duas cópias Vercel e a skill Vercel Native. A consulta final retornou somente `neGYGk5pqLrLmpfc5CwBO`. Esta tarefa não fez chamadas de remoção/atualização; a diferença de listagem não permite concluir o que ocorreu com as outras entradas.

## Encaminhamento sob demanda

O Chief foi informado do bloqueio, da versão confirmada e da correção da conclusão inicial sobre upgrade. Também recebeu o encaminhamento confirmado:

- Implementador: `react-patterns` (ID pendente) e `vercel-react-best-practices` (`neGYGk5pqLrLmpfc5CwBO`).
- Revisor: `react-doctor` (ID pendente).
- `gsap-react`: somente se a implementação usar GSAP; ID pendente.
- Demais: biblioteca sob demanda; nenhum padrão de agente foi alterado.

O envio ao Chief foi confirmado pela ferramenta; o carregamento nos agentes destinatários não foi executado nem comprovado nesta tarefa. O redesign fica com a tarefa responsável, sem bloqueio por estas pendências. A documentação da plataforma descreve [importação de pastas e uso por conversa](https://todos.dev/docs/skills).
