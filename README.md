# Central do CITi

Demonstração React do fluxo lead → projeto, com dados fictícios e armazenamento local.

O percurso agora inclui squad, fases Discovery → Delivery, filtros combinados e médias por subárea ou segmento. Veja [a entrega da esteira](ENTREGA_ESTEIRA_MEDIAS.md) para abrir a prévia, conferir fontes, capturas e resultados de teste.

## Executar

Requer Node.js 22.12+ (verificado com Node 24.14.1).

```sh
npm ci
npm run dev
```

Abra o endereço exibido pelo Vite. As rotas usam `#`, permitindo recarregar qualquer detalhe sem configuração de servidor.

A interface é escrita em componentes React (`src/main.jsx` e `src/Magnetic.jsx`). Node.js executa o Vite, que transforma JSX e empacota React, JavaScript e CSS para o navegador. O HTML é o ponto de entrada da aplicação; os arquivos em `previa/assets/` são o resultado dessa compilação. Node.js também executa os testes de domínio. Os dados continuam locais ao navegador.

Para testar exatamente a prévia versionada:

```sh
npm run check:preview
npm run preview -- --port 5186 --strictPort
```

Abra `http://localhost:5186`. `check:preview` faz uma compilação independente do código React e compara todos os arquivos com `previa/`, byte a byte; falha se a prévia estiver desatualizada. Após mudar a interface, atualize-a com `npm run build:preview`. Para executar a suíte automatizada sobre essa compilação, pare o servidor manual e rode `npm run test:preview`. A suíte inicia seu próprio servidor na porta 5186.

Na revisão de alterações da tarefa, o botão **Preview** em `previa/index.html` abre a mesma aplicação compilada. As capturas e o roteiro visual estão em [ENTREGA_REDESIGN.md](ENTREGA_REDESIGN.md).

```sh
npm run build
npm test
npx playwright install chromium
npm run test:e2e
```

## Roteiro de demonstração

1. Em Leads, cadastre oportunidade, organização e contato fictícios. Na visão geral, confira o aumento dos leads abertos.
2. Edite o lead, marque Ganho e salve. O contador de abertos diminui.
3. Preencha a conversão com nome, área e responsável; opcionalmente adicione outros integrantes. O projeto abre como Planejado.
4. Altere para Em andamento. Abra a área para consultar projeto e integrantes; confira o indicador na visão geral e clique para abrir a lista filtrada.
5. Recarregue. Abra o lead de origem e use Abrir projeto vinculado: o mesmo projeto abre, sem duplicação. O estágio do lead permanece travado em Ganho.

Dados ficam neste navegador e nesta origem, na chave `central-citi-v1`; não há servidor compartilhado, autenticação ou uso de dados reais. Para reiniciar a demonstração, remova essa chave nas ferramentas do navegador. Falhas na escrita impedem a alteração e mostram erro; dados locais ilegíveis não são sobrescritos automaticamente. Evite edições simultâneas em abas diferentes.

Áreas, integrantes e decisões adicionais são exemplos de demonstração, não uma representação institucional confirmada. Consulte [o registro da rodada](REGISTRO_RODADA.md) e [a entrada de Produto preservada](RECORTE_PRODUTO.md).
