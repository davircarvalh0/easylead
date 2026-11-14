# Produto · Validação de Requisitos e Menor Recorte da Central do CITi

> Documento de especificação e validação da **Etapa 1 (Produto · Antigravity)** da primeira rodada da Central do CITi, elaborado a partir do [`BACKLOG.md`](BACKLOG.md) e do briefing `DesafioDeInovaçãoPS.pdf`.
> **Status:** **Recorte P0 e Regras do CITi (H-01 a H-05) validados pelo usuário** — liberado como contrato de entrada para a Etapa 2 (Implementador · Codex).

---

## 1. Avaliação de Produto: O fluxo de Lead até Projeto demonstra bem a proposta da Central?

**Diagnóstico:** **Sim.** O fluxo que parte de uma oportunidade comercial (**Lead**) e chega à execução operacional (**Projeto vinculado a uma Área e a Integrantes responsáveis**) demonstra com clareza a proposta de valor da Central do CITi, desde que a entrega enfatize a **conexão relacional entre as pontas** e não apenas formulários isolados.

### Por que este fluxo comprova o valor do produto:
1. **Resolve a dor real de fragmentação:** Em uma empresa júnior, o funil comercial (prospecção/negociação) e a gestão operacional (alocação de áreas e squads em projetos) costumam ficar em planilhas ou ferramentas desconectadas. Converter um lead ganho diretamente em projeto elimina a perda de contexto na passagem de bastão.
2. **Torna visível a estrutura organizacional:** Ao exigir uma **Área responsável** e um **Integrante responsável** na conversão — e permitir que esse projeto seja encontrado imediatamente dentro da página daquela Área e nos indicadores da **Visão Geral** —, o sistema cumpre a promessa central do backlog: *"acompanhar o trabalho sem procurar a mesma informação em vários lugares"*.
3. **Alinha-se ao pitch do Desafio de Inovação:** Mostra visão de processo transformado em produto interno funcional, com estado consistente, regras de integridade (sem duplicação de projetos) e navegação fluida.

---

## 2. Regras do CITi (Hipóteses do Backlog Validadas pelo Usuário)

No `BACKLOG.md`, as regras de negócio da primeira versão estavam registradas como hipóteses. Os **5 pontos de decisão** abaixo foram submetidos e **validados pelo usuário** para a implementação do recorte P0:

| ID | Tema | Hipótese Original no `BACKLOG.md` | Status | Regra Validada para Implementação (P0) |
| :--- | :--- | :--- | :--- | :--- |
| **H-01** | **Estágios e transições do Lead** | Estágios: `Novo`, `Em contato`, `Proposta`, `Ganho` e `Perdido`. | **Validada** | Manter os **5 estágios**. Permitir troca direta entre estágios enquanto não houver projeto; **após convertido em projeto, travar o estágio em `Ganho`** para proteger a integridade do vínculo. |
| **H-02** | **Status de Projeto e status inicial** | Status: `Planejado`, `Em andamento` e `Concluído`. | **Validada** | Manter os **3 status**. Todo projeto recém-convertido nasce como **`Planejado`** por padrão, podendo ser alterado imediatamente na tela de detalhe do projeto. |
| **H-03** | **Vínculo entre Área, Responsável e Equipe** | Projeto tem 1 área responsável, 1 integrante responsável e pode ter outros integrantes. | **Validada** | Popular dados iniciais com áreas reais do contexto CITi (*Inovação*, *Comercial*, *Desenvolvimento*, *Design*, *Pessoas*). Na conversão, **filtrar/destacar integrantes da área escolhida** como responsável e vincular automaticamente o responsável à equipe do projeto. |
| **H-04** | **Unicidade na conversão Lead ↔ Projeto** | Um lead `Ganho` origina 1 projeto e mantém o vínculo; repetir a ação abre o projeto existente. | **Validada** | Relação **1:1 estrita e idempotente**: se o lead já possui `projectId` vinculado, a ação não cria outro registro e navega direto para o projeto existente. |
| **H-05** | **Cálculo dos indicadores da Visão Geral** | Exibir contagens de *leads abertos* e *projetos em andamento* que abrem listas filtradas. | **Validada** | **Leads abertos = `Novo` + `Em contato` + `Proposta`** (funil ativo, excluindo `Ganho` e `Perdido`) e **Projetos em andamento = status `Em andamento`**, além de exibir visão rápida do funil completo. |

---

## 3. O Menor Recorte Demonstrável (Escopo MVP · P0)

Para garantir uma implementação enxuta, sem controles inertes (RNF-03) e 100% focada no roteiro de demonstração, o recorte separa estritamente o que entra agora (P0) do que fica para evoluções futuras (P1/P2).

### Entra no Menor Recorte (Implementação Imediata - P0)
1. **Navegação Estrutural (RF-01):** Layout responsivo em React com rotas/visões para **Visão geral**, **Leads**, **Projetos**, **Integrantes** e **Organização** (Áreas), destacando a seção ativa.
2. **Carga Inicial Fictícia + Persistência Local (RNF-05 / RNF-06):** Estado inicial rico (áreas do CITi, integrantes distribuídos nas áreas, leads em diferentes estágios e projetos iniciais) salvo em `localStorage`, mantendo todas as alterações após `F5` / recarregamento.
3. **Gestão de Leads (RF-02):**
   - Listagem com busca textual (por nome da oportunidade/empresa ou contato) e filtro por estágio;
   - Cadastro de novo lead com validação de campos obrigatórios antes de salvar;
   - Edição de dados e avanço de estágio até `Ganho`.
4. **Conversão de Lead em Projeto (RF-03):**
   - Disponível exclusivamente para leads no estágio `Ganho`;
   - Formulário/modal solicitando **Nome do projeto** (sugerido a partir do lead), **Área responsável** e **Integrante responsável** (com opção de selecionar integrantes adicionais);
   - Criação única do projeto vinculado ao lead e redirecionamento para o detalhe do projeto;
   - Comportamento idempotente: para um lead já convertido, acionar a ação abre o detalhe do projeto existente.
5. **Acompanhamento de Projetos (RF-04):**
   - Listagem com filtro por status/área e visualização de detalhe do projeto;
   - Alteração de status (`Planejado`, `Em andamento`, `Concluído`) com persistência imediata;
   - Exibição clara da Área responsável, Integrante responsável, demais integrantes vinculados e link/referência para o Lead de origem.
6. **Consulta de Integrantes e Áreas/Organização (RF-05):**
   - Diretório de integrantes com busca por nome/papel e filtro por área;
   - Visão de Organização (Áreas): ao selecionar uma área, exibir seus integrantes e todos os projetos vinculados a ela (incluindo os recém-convertidos).
7. **Visão Geral Conectada (RF-06):**
   - Indicadores calculados em tempo real a partir do estado atual (*Leads abertos*, *Leads ganhos*, *Projetos em andamento*, *Total de projetos*);
   - Clicar nos indicadores de *Leads abertos* ou *Projetos em andamento* navega para a respectiva tela já com o filtro aplicado.

### Fica Fora do Menor Recorte (Backlog P1 e P2)
- **Fora (P1 - RF-07):** CRUD de áreas e integrantes pela interface e criação avulsa de projetos sem lead (na primeira rodada, áreas e integrantes vêm prontos na carga inicial e novos projetos nascem pela conversão do lead).
- **Fora (P1 - RF-08):** Timeline/auditoria detalhada de histórico de mudanças com data e autor.
- **Fora (P2 - RF-09):** Backend remoto, banco de dados compartilhado, login e permissões por perfil.

---

## 4. Fluxo Ponta a Ponta (Entrada → Ação → Saída)

Este mapeamento define o comportamento determinístico que o **Implementador (Codex)** deve construir e o **Revisor (GitHub Copilot)** deve auditar:

| Etapa do Fluxo | Entrada (Input) | Ação / Processamento | Saída Verificável (Output) |
| :--- | :--- | :--- | :--- |
| **1. Cadastrar e qualificar Lead** | Nome da oportunidade, organização/cliente, contato e estágio inicial (`Novo`). | Validar campos obrigatórios; se vazios, exibir erro inline sem salvar. Se válidos, gravar no estado/`localStorage`. | Novo lead aparece na lista de Leads; contador de *Leads abertos* na Visão Geral sobe em +1. |
| **2. Avançar Lead para Ganho** | Lead existente selecionado + novo estágio `Ganho`. | Atualizar estágio do lead no estado persistido e recalcular contadores. | Badge do lead muda para `Ganho`, ação **"Converter em projeto"** fica habilitada e contador de *Leads abertos* reduz em -1. |
| **3. Converter Lead em Projeto** | Lead `Ganho` + Nome do projeto + Área responsável + Integrante responsável. | Validar obrigatoriedade de nome, área e responsável; verificar se `lead.projectId` já existe; criar projeto com status inicial `Planejado` e vincular `leadId` ↔ `projectId`. | Projeto é criado uma única vez; tela de detalhe do novo projeto é aberta exibindo Área, Responsável e Lead de origem. |
| **4. Prevenir conversão duplicada** | Lead `Ganho` que já possui projeto vinculado (`projectId` preenchido). | Interceptar ação de conversão/acesso ao projeto a partir do lead. | Nenhum projeto extra é criado; o sistema navega diretamente para o detalhe do projeto já vinculado. |
| **5. Evoluir Status e consultar Área** | Projeto criado + mudança de status para `Em andamento` + clique na Área vinculada. | Atualizar status do projeto no estado/`localStorage` e consultar relações da Área. | Indicador *Projetos em andamento* na Visão Geral sobe em +1; detalhe da Área lista o novo projeto junto aos seus integrantes. |
| **6. Persistência após recarregar** | Estado alterado na sessão + recarregamento da página (`F5`). | Hidratar estado da aplicação a partir do `localStorage`. | Lead convertido, projeto em andamento, vínculos de área/responsável e indicadores da Visão Geral permanecem idênticos após o reload. |

---

## 5. Critérios de Aceite Verificáveis (Primeira Implementação)

- **CA-01 · Rotas e Navegação Ativa (RF-01, RNF-01):** As 5 seções (`Visão geral`, `Leads`, `Projetos`, `Integrantes`, `Organização`) abrem sem erros, destacam visualmente o item ativo no menu e permitem navegação completa por teclado (`Tab`, `Enter`/`Space`, foco visível).
- **CA-02 · Busca, Filtro e Validação de Leads (RF-02, RNF-03):** Na seção `Leads`, a busca textual e o filtro por estágio combinam seus critérios corretamente (exibindo estado vazio amigável quando não há correspondência). Tentar salvar um lead sem os campos obrigatórios exibe mensagem de erro clara e impede a gravação.
- **CA-03 · Conversão Exclusiva e Vínculo Completo (RF-03):** Apenas leads no estágio `Ganho` oferecem a conversão para projeto. A conversão exige Nome do projeto, Área e Integrante responsável, cria o projeto com referência ao lead de origem e abre imediatamente a visão de detalhe desse projeto.
- **CA-04 · Idempotência da Conversão (RF-03, RNF-05):** Tentar converter novamente um lead já convertido não duplica o projeto na listagem nem nos contadores; a ação leva o usuário ao projeto previamente criado.
- **CA-05 · Gestão de Status e Relações em Projetos (RF-04):** No detalhe do projeto é possível alterar o status entre `Planejado`, `Em andamento` e `Concluído`. O detalhe exibe Área responsável, Integrante responsável, equipe vinculada e o Lead de origem clicável.
- **CA-06 · Consulta Cruzada em Integrantes e Organização (RF-05):** A seção `Integrantes` permite buscar membros e identificar sua área. Na seção `Organização`, abrir uma área exibe seus integrantes e todos os projetos vinculados a ela (incluindo o projeto gerado no passo de conversão).
- **CA-07 · Indicadores Vivos e Acionáveis na Visão Geral (RF-06):** Os contadores de *Leads abertos* (`Novo`, `Em contato`, `Proposta`) e *Projetos em andamento* (`Em andamento`) refletem imediatamente qualquer criação, mudança de estágio/status ou conversão, e clicar neles leva à listagem correspondente já filtrada.
- **CA-08 · Responsividade, Movimento e Persistência (RNF-02, RNF-04, RNF-05, RNF-06):** A interface não apresenta barra de rolagem horizontal em `360px` nem em `1280px`, respeita `prefers-reduced-motion`, preserva todos os dados criados/editados no `localStorage` após recarregar a página e inclui instruções no `README.md` para rodar e reproduzir o roteiro de 5 passos.

---

## 6. Registro da Etapa (Para a Documentação do Desafio)

| Campo | Registro |
| :--- | :--- |
| **Etapa** | Etapa 1 · Produto — Validação dos requisitos e definição do menor recorte demonstrável |
| **Agente responsável** | **Produto · Antigravity** (Gemini 4 Argon) |
| **O que entregou** | 1. Avaliação estratégica confirmando a aderência do fluxo *Lead → Projeto → Área/Integrantes* à proposta da Central do CITi;<br>2. Identificação estruturada das **5 hipóteses de regras de negócio do CITi (H-01 a H-05)** e consolidação das decisões após validação do usuário;<br>3. Definição do **Menor Recorte Demonstrável (MVP P0)** validado pelo usuário, separando o que entra na 1ª implementação do que fica em P1/P2;<br>4. Mapeamento determinístico de **Entrada → Ação → Saída** e **8 Critérios de Aceite Verificáveis (CA-01 a CA-08)** versionados em `RECORTE_PRODUTO.md`. |
| **Como o resultado foi verificado** | - **Rastreabilidade de requisitos:** Cruzamento item a item contra o `BACKLOG.md` (RF-01 a RF-09 e RNF-01 a RNF-06), garantindo que nenhum requisito P0 ou RNF ficou sem critério de aceite verificável;<br>- **Teste de mesa do roteiro de demo:** Simulação lógica dos 5 passos do roteiro da primeira demonstração sobre a tabela *Entrada → Ação → Saída* (cadastro de lead → avanço para Ganho → conversão com área/responsável → atualização de status e consulta na área → conferência de indicadores na Visão Geral, reload de persistência e tentativa de reconversão idempotente);<br>- **Validação humana explícita:** Confirmação direta do usuário aprovando o recorte P0 e validando as 5 regras de negócio sugeridas (H-01 a H-05). |
