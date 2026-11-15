# FunnelChart: fonte e adaptações

A fonte integral recebida está em fontes/funnel-chart.original.tsx, preservada sem alterações.
O componente de produção está em components/ui/FunnelChart.jsx.

- vSegmentPath: mesma fórmula Bézier vertical (0,44 da largura, controle em 0,55 da altura).
- VSegment: preserva as três camadas, escala 1 − l/layers × 0,35 e opacidade 0,18 a 0,83.
- VRing: preserva useSpring e expansão progressiva das camadas.
- Entrada: preserva useSpring/useTransform, origem superior central e atraso 0,12 por etapa.
- Labels: mantém valor, percentual central e nome, com fade de entrada; agora em botão nativo para mouse, toque, Enter e Espaço.
- Escala: maior valor de data, sem reordenar; percentual usa soma de data. Divisores zerados produzem zero.
- Todas as etapas, inclusive Perdido, entram na mesma escala e no total.
- Service continua responsável pelos filtros e contagens; Controller coordena seleção e Repository mantém persistência.
- Tailwind/clsx/tailwind-merge substituídos pelo CSS existente do projeto. Motion foi instalado para manter as animações originais. Não há novos providers.
- O recorte vertical dispensa caminho horizontal, grid e layouts opcionais não usados. SVG usa viewBox responsivo em vez de ResizeObserver. IDs são únicos por instância.
- Movimento reduzido elimina entrada e expansão. Paleta neutra sobre fundo escuro, verde discreto em hover, foco e seleção.

## Verificação
Build e 14 testes de regras passaram. Cinco testes de navegador do funil passaram em desktop/celular, incluindo primeira etapa zero (0/2/3/5), seleção e edição após filtro.
Globos incorporados, prévia conjunta e vídeo/capturas em evidencias/rodada. Resultados finais em revisao-integrada.md.

