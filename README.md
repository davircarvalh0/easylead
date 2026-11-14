# Central do CITi

Demonstração React do fluxo lead → projeto, com dados fictícios e armazenamento local.

## Executar

Requer Node.js 22.12+ (verificado com Node 24.14.1).

```sh
npm ci
npm run dev
```

Abra o endereço exibido pelo Vite. As rotas usam `#`, permitindo recarregar qualquer detalhe sem configuração de servidor.

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
