# Globe por sub?rea

O componente fica em `components/ui/3d-orb.tsx`, com estilos em `components/ui/3d-orb.css`. Organiza??o mant?m o contrato atoms/selectedId; o cadastro segue em Integrantes. N?o h? providers novos. Three j? est? instalado e continua carregado sob demanda.

## Rastreabilidade do Globe fornecido

- Atmosfera: shaders vertex/fragment do exemplo preservados, incluindo normalMatrix, pot?ncia 2, AdditiveBlending, BackSide e glowColor. Raio 5.2 normalizado para 1.04.
- Malha: SphereGeometry(5,32,32) normalizada para (1,32,32), MeshBasicMaterial wireframe com opacidade 0.5. Sempre permanece vis?vel.
- Interior: SphereGeometry(4.9,64,64) normalizada para (.98,64,64). Phong substitu?do por Physical transparente, clearcoat e baixa rugosidade para acabamento de vidro.
- Rota??o: velocidades originais convertidas de incrementos por frame para segundos: malha/interior .06, atmosfera .03, estrelas .006.
- Estrelas: 10.000 pontos, distribui??o em cubo de 2.000 unidades e material do exemplo, compartilhados na cena.
- Luz ambiente e pontual preservadas; c?mera e enquadramento adaptados ao palco responsivo existente.
- Ciclo multicolorido substitu?do por cor est?vel por ID. OrbitControls omitido: a ?rbita ? autom?tica e a intera??o usa links HTML, evitando conflito com toque e teclado.
- Transi??o para texturas terrestres desativada: os tr?s arquivos do exemplo n?o existem no projeto. Nenhuma textura externa ? necess?ria ou solicitada; malha e atmosfera independem de imagens e continuam vis?veis offline. N?o foram adicionadas fotos Unsplash sem fun??o neste componente.

Geometrias s?o compartilhadas; materiais s?o individuais por cor. Uma cena/c?mera/renderer atende todas as ?reas. A cena s? ? recriada quando a lista de IDs muda ou a prefer?ncia de movimento muda; contagens usam refer?ncia atualizada. O di?metro converge exponencialmente ao alvo, inclusive ao voltar de Integrantes. Escala absoluta: raz?o n/(n+6), di?metro desktop 108+88?raz?o e celular 88+56?raz?o. Zero permanece vis?vel; uma ?rea n?o muda a escala das outras.

## Setup existente

Projeto Vite React com CSS pr?prio e suporte de transpila?ao TSX pelo Vite, sem checagem TypeScript, Tailwind ou configura??o shadcn. `components/ui` j? existe e ? o destino dos componentes reutiliz?veis; estilos globais ficam em `src/style.css`. N?o houve migra??o incidental.

Para adotar a stack completa em trabalho separado: instalar `typescript @types/react @types/react-dom @types/three` como devDependencies, criar tsconfig com jsx react-jsx, moduleResolution bundler e alias @/* para a raiz, e configurar o mesmo alias no Vite. Instalar `tailwindcss @tailwindcss/vite`, registrar o plugin no Vite e importar Tailwind no CSS global. Executar `npx shadcn@latest init`, apontando componentes para `components/ui`, CSS para `src/style.css` e alias para a raiz. Nenhum ?cone ou logo novo requer lucide-react nesta mudan?a.

## Entrega e aprova??o

A tarefa do funil gera a pr?via, v?deo e capturas com/sem filtro ap?s incorporar esta branch. A aprova??o visual continua necess?ria antes da integra??o em main. Esta tarefa n?o altera previa nem integra main.

Valida??o: build de produ??o, 15 testes de dom?nio e 5 testes Playwright de Organiza??o passaram em 360/1280 px. Incluem cadastro/persist?ncia, contagem e di?metro, enquadramento em movimento, teclado, toque, movimento reduzido e perda de contexto. Captura desktop inspecionada; r?tulos receberam largura pr?pria para evitar quebra de nomes.
