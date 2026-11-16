# Analytics e navegação flutuante

Referência: leitura do anexo dsahboard.tsx (AnalyticsBento, vasnev.art) e proposta aprovada PROPOSTA_ANALYTICS_CX.md na branch de Produto. Reaproveitado o algoritmo squarify, convertido de TypeScript para JavaScript em analyticsLayout.js. Cartões assimétricos, controles de agrupamento e leitura tabular adaptados ao CSS e domínio existentes. Ondas de sessões substituídas por comparação de valores independentes por lead. Radar e deltas não representam os dados disponíveis e foram omitidos.

Metas são persistidas pelo Controller → Service → Repository, com indicador, objetivo positivo e período descritivo editável. O realizado é o acumulado atual; o período cadastrado é uma identificação e ainda não filtra os registros. Total e média usam exclusivamente contratos elegíveis. Reconciliação automatizada: R$ 54.000 + R$ 72.000 = R$ 126.000; média R$ 63.000; contrato sem situação elegível excluído; meta R$ 200.000 resulta em 63%.

Datas opcionais de criação, conversão e vigência são armazenadas sem retroagir dados existentes. A evolução temporal permanece vazia nesta entrega: agregação e filtro temporal ainda precisam ser implementados. A origem dos indicadores é acessível nos cartões e os projetos na tabela; ainda não existe gaveta individual de reconciliação como na proposta.

Funil: baseline em 86e78c7. Fixture seed e fixture sample-0..9 do teste lead-funnel.spec.js, distribuição 2/3/5, viewports 1280×900 e 390×900. Filtros Não classificado, Novo e Saúde & Biotech, com edição para Proposta. Capturas anteriores em evidencias/analytics-baseline e posteriores em evidencias/funil*.png. LeadFunnel.jsx, lead-funnel.css e leadFunnelService.js intactos. Topbar usa altura medida para reservar espaço, posição fixa sem faixa integral, foco, toque, hover e indicador animado, respeitando movimento reduzido.

Organização integrada da branch tds/conv-01a1e1da-47df-7516-a3ec-92e5fe9c61c4: componentes próprios, geometria, testes e evidências. Comparação e vídeo em evidencias/organizacao-espaco/. Nenhum dado salvo é migrado ou substituído pela limpeza da demo.

Validação: testes unitários, testes de navegação/metas desktop/celular com teclado e movimento reduzido, regressão funcional do funil e teste integrado da cena. A primeira captura de regressão excedeu 30s; a execução com 60s passou. A inspeção visual encontrou desalinhamento da barra em movimento reduzido, corrigido e coberto por verificação dos limites horizontais.

Prévia: previa/index.html, abrir pelo botão de prévia na revisão de alterações. Não mesclar antes do aceite. Pendências de escopo: filtro temporal e série com datas; rastreio individual completo; refinamento visual da composição para substituir módulos legados que continuam abaixo dos novos cartões. Esta entrega deve ser tratada como implementação parcial em revisão, não aceite final.
