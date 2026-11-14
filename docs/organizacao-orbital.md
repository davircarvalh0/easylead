# Organiza??o orbital em vidro

Implementa??o baseada no relat?rio publicado de Produto (branch tds/conv-01a1dbde-c0cf-7464-81dd-15ae3422c6d9), conferido antes das altera??es.

A cena remove o globo central e os cart?es. Cada ID de sub?rea mant?m uma cor: esmeralda, ciano, azul, violeta e ?mbar. O vidro combina material f?sico transl?cido no WebGL e reflexos CSS nos alvos HTML acess?veis. Nome e contagem continuam vis?veis. A escala por popula??o permanece no servi?o existente.

Os valores fixos de c?mera sugeridos no relat?rio foram substitu?dos pelo enquadramento calculado a partir da largura, altura e maior alvo, com margem para os r?tulos e profundidade. Os raios s?o 6,8 ? 4,1 em desktop e 4,1 ? 6,8 no celular. Isso evita cortar as ?rbitas em ?reas estreitas. O palco usa 640?780 px no desktop e 590?680 px no celular.

Clique, toque e foco pausam o movimento. Os links preservam Tab, setas, Home, End, Enter e Espa?o. Movimento reduzido, aus?ncia de WebGL ou perda do contexto exibem grade est?tica com os mesmos links e esferas, sem centro decorativo.

O formul?rio foi removido apenas das duas posi??es em Organiza??o. MemberForm continua exportado e usado em Integrantes; o detalhe mant?m o link para esse diret?rio. main.jsx, style.css e previa n?o foram alterados.

## Verifica??o

Build de produ??o e 12 testes de dom?nio passaram. Os cinco testes Playwright de Organiza??o passaram em 360 e 1280 px: cadastro pela tela Integrantes, persist?ncia, atualiza??o de contagem e di?metro, sele??o por teclado, toque real em contexto mobile, pausa, retorno, movimento reduzido e perda de contexto. A su?te orbital tamb?m verifica limites dos alvos durante movimento, sem corte pelo palco.

A tarefa de integra??o gera a pr?via conjunta, capturas das duas telas e v?deo curto. A aprova??o visual do usu?rio continua necess?ria antes de integrar em main.
