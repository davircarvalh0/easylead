# Organização orbital

`components/ui/3d-orb.tsx` recebe `atoms` (id, nome, contagem e diâmetros do Service) e `selectedId` da rota. Não grava dados: OrganizationAtoms mantém o formulário e Controller → Service → Repository mantém cadastro, vínculos, diretório e persistência.

Adaptação da fonte Globe recebida: preserva Scene, PerspectiveCamera, WebGLRenderer, globo wireframe e halo verde aditivo. Substitui fullscreen por ResizeObserver, ciclo multicolorido por preto/verde, texturas externas por materiais locais e acrescenta esferas com posição orbital em três dimensões. Não exige imagens, ícones, providers nem OrbitControls: câmera fixa evita conflito com seleção por toque. Todos os recursos gráficos são descartados ao desmontar. Three já consta nas dependências.

Links HTML acompanham as projeções das esferas e exibem contagens exatas. Hover, foco, toque e detalhe aberto pausam a órbita. Tab, setas e Enter selecionam; sair do detalhe pela navegação Organização permite retomar. A aba oculta cancela o frame; o retorno reinicia sem salto de tempo. Movimento reduzido, `?noWebGL`, falha de criação ou perda do contexto apresentam mapa estático com núcleo CITi e os mesmos links e cadastro. No celular há alvos de pelo menos 104px e canvas limitado ao contêiner.

## Estrutura e setup opcional

A aplicação é React/Vite JSX com CSS em `src/style.css` e estilos por componente. Vite compila o novo TSX, mas o projeto ainda não tem verificação TypeScript, Tailwind nem configuração shadcn. Não houve migração incidental. `components/ui` foi criado na raiz para manter o caminho solicitado e concentrar componentes reutilizáveis; o import existente é relativo, sem depender do alias `@`.

Para adotar a stack completa em uma mudança própria:

1. Instale `npm install -D typescript @types/react @types/react-dom @types/three` e configure tsconfig com `allowJs`, `jsx: react-jsx`, `moduleResolution: bundler`, `noEmit` e alias `@/*` para `./*`.
2. Instale `npm install -D tailwindcss @tailwindcss/vite`, adicione o plugin Tailwind à configuração Vite e `@import "tailwindcss";` ao CSS principal.
3. Configure também o alias `@` na resolução Vite; execute `npx shadcn@latest init`, indicando o CSS principal e `components/ui` no components.json. Revise alterações globais antes de aplicá-las ao visual atual.

A revisão conjunta de fade, funil, vídeo e prévia pertence à entrega de integração; esta branch não altera main.jsx, Service/Controller nem previa.

## Validação desta entrega

- `npm test`: 12 testes de domínio passaram.
- `npm run build`: passou; aviso de tamanho do chunk Three (carregado dinamicamente).
- `organization-atoms.spec.js`: os dois cenários existentes passaram, em 360 e 1280px, incluindo cadastro de cinco pessoas, tamanhos distintos, diretório e reload.
- `organization-orbit.spec.js`: três cenários em Chromium, com seleção por teclado, toque real nas coordenadas em movimento, pausa por foco/detalhe/aba oculta, retomada, reduced-motion, perda de contexto e cadastro na cena animada.
- Suíte completa: 33/39 passaram na primeira execução com seis workers. Os três casos externos à órbita que falharam passaram na repetição isolada (`--last-failed --workers=1`). Os três casos novos passaram após corrigir a codificação dos seletores do próprio teste. Não se afirma uma execução única de 39/39.

| Reprodução da falha inicial | Esperado | Observado e tratamento |
| --- | --- | --- |
| Toque com locator.tap numa esfera em movimento | Abrir detalhe | Playwright aguardava estabilidade indefinidamente; teste usa touchscreen nas coordenadas reais, sem aguardar imobilidade |
| Perda de contexto após animação | Links estáticos sem deslocamento | Posições inline poderiam deslocar o mapa; CSS estático agora ignora left/top |
| Testes novos após edição pelo shell Windows | Encontrar Subárea | Texto do seletor foi recodificado incorretamente; arquivo corrigido para UTF-8 |
| Suíte com seis workers: fluxo completo | Percorrer rotas em 30s | Timeout; passou isoladamente |
| Suíte com seis workers: abertura 1280px | Capturar formulário ainda oculto | A animação já havia terminado; passou isoladamente |
| Suíte com seis workers: falha do chunk LoginScene | Observar passagem leve | Passagem já ausente na asserção; passou isoladamente |

Capturas antigas geradas pelos testes gerais foram descartadas para não misturar evidências de outras entregas. Vídeo, fade e funil devem ser revistos na branch integrada antes da aprovação do usuário.
