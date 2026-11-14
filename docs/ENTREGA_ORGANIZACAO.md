# Organização atômica e cadastro — entrega parcial

Base conferida: main 7ca0a26. Contrato: proposta de Produto na branch tds/conv-01a1db7c-57c5-74c9-b568-dac8bf7e663e e aprovação registrada na tarefa.

Componentes preparados, ainda sem conexão nas rotas públicas para respeitar a sequência com a tarefa de fade/topbar:

- OrganizationAtoms recebe state, atoms, selectedId, saveMember e projectList.
- MemberForm recebe areas, initialAreaId e saveMember; pode ser usado também no diretório.
- useCentralController expõe saveMember e organizationAtoms, derivados do estado publicado após persistência.
- CSS dedicado contém escala responsiva, alvo mínimo de 104px, foco, teclado e movimento reduzido.

Integração pendente: incorporar entrega publicada de fade/topbar na branch desta conversa; conectar Organização ao OrganizationAtoms e adicionar MemberForm ao diretório. Não modificar main antes dessa sequência. Nenhum merge na main foi feito.

Validação desta etapa: npm test passou com 12 testes (incluindo cadastro mínimo, preservação, reload pelo repository, falha de escrita e escala 6×1). Build e suíte de navegador são registrados após instalação das dependências.

Ainda faltam validação visual real, fluxo entre as duas telas, capturas desktop/mobile, prévia integrada e AI review com Copilot. A prévia existente não representa esta contribuição.

Verificação adicional: npm ci concluiu (sem vulnerabilidades); npm run build passou, com aviso de chunk acima de 500 kB. O build atual ainda não inclui o componente desconectado. npm run test:e2e não iniciou: a porta 5186 já estava ocupada; nenhum processo alheio foi encerrado. Reexecutar a suíte na integração em porta livre.
