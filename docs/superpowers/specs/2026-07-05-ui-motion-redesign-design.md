# Redesign de motion e layout — Sistema SWAT (frontend)

## Contexto

O frontend (React + Tailwind + Framer Motion 12) já usa animação em todas as
9 páginas, mas de forma inconsistente: cada página define suas próprias
variantes locais (`ITEM_VARIANTS`, `ROW_VARIANTS`, etc.), com timings e
easings diferentes, e várias telas não têm animação nenhuma onde deveriam
(linhas de tabela em Membros e Contas, abas internas de Configurações).
A transição de rota é um fade+slide genérico sem relação com a identidade
visual do sistema (tema SWAT: dourado `#c9a227` sobre preto).

Este documento cobre o redesign do sistema de motion e ajustes de layout
associados. Não inclui mudança de paleta de cores ou de componentes de
domínio (isso já foi feito em trabalho anterior).

## Objetivo

1. Unificar timing/easing de todas as animações num único lugar ("kit de
   motion"), com uma personalidade **tática/HUD**: transições rápidas e
   secas, sem springs "molengas" (exceto onde já funcionam bem: modais e
   toasts).
2. Dar transição visual às trocas de "aba" em dois sentidos: navegação de
   rota (Sidebar → página) e abas internas (`ConfiguracoesPage`).
3. Padronizar animação de entrada/hover/tap em cards e listas/tabelas,
   cobrindo os pontos hoje sem nenhuma animação.
4. Resolver inconsistências de layout que atrapalham a hierarquia visual
   (cabeçalhos ad-hoc, modal duplicado).
5. Como extra: transição shared-element no fluxo Recrutamento (lista →
   detalhe do candidato).

## Fora de escopo

- Mudança de paleta de cores, tipografia ou componentes de domínio.
- Mudanças de arquitetura de dados/back-end.
- Code-splitting do bundle (o aviso de chunk grande do Vite já existe hoje
  e não é afetado por este trabalho).

## Arquitetura

### 1. Kit de motion (`frontend/src/lib/motion.ts`, novo arquivo)

Único ponto de verdade para timing, easing e variantes reutilizáveis:

```ts
export const DURATION = {
  fast: 0.15,   // hover/tap/microinterações
  base: 0.2,    // entrada de cards/itens de lista
  page: 0.22,   // transição de rota / troca de aba
}

export const EASE_SHARP = [0.4, 0, 0.2, 1] as const // entra rápido, sai seco

export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
}

export const staggerItem = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE_SHARP } },
}

export const tacticalReveal = {
  initial: { opacity: 0, x: -8, clipPath: 'inset(0 100% 0 0)' },
  animate: { opacity: 1, x: 0, clipPath: 'inset(0 0% 0 0)' },
  exit:    { opacity: 0, x: 8 },
  transition: { duration: DURATION.page, ease: EASE_SHARP },
}
```

Os valores exatos de `clipPath`/deslocamento serão ajustados visualmente
durante a implementação (o objetivo é o efeito de "varredura" da esquerda
pra direita, sutil — não deve parecer uma cortina lenta).

Páginas e componentes passam a importar dessas constantes em vez de
declarar suas próprias variantes locais. As variantes locais hoje
duplicadas (`ITEM_VARIANTS`/`CONTAINER_VARIANTS` em `DashboardPage.tsx`,
`ROW_VARIANTS`/`TABLE_VARIANTS` em `EstatisticasPage.tsx`) são removidas e
substituídas pelas importações do kit.

### 2. Transições de "aba para aba"

**Rotas** (`frontend/src/components/layout/AppShell.tsx`): a
`motion.div` que envolve o `<Outlet />` troca o `initial/animate/exit`
atual (fade + 8px) pelo spread de `tacticalReveal`.

**Abas internas de Configurações**
(`frontend/src/components/sections/ConfiguracoesPage.tsx`): o bloco de
conteúdo (hoje um `<div className="p-6">` com renderização condicional
direta) passa a ser envolvido por `<AnimatePresence mode="wait">` com uma
`motion.div` `key={activeTab}` usando `tacticalReveal`, para que trocar de
"Logo" → "Patentes" tenha a mesma linguagem visual da troca de rota.

**Indicador de rota ativa na Sidebar**
(`frontend/src/components/layout/Sidebar.tsx`): a borda estática
`border-l-2 border-gold` do item ativo é substituída por uma
`motion.div` absoluta com `layoutId="active-nav-indicator"`, renderizada
dentro do item ativo — o Framer Motion anima a posição automaticamente
quando o item ativo muda.

### 3. Sistema de cards

**`GlowCard`** (`frontend/src/components/ui/GlowCard.tsx`) ganha novas
props opcionais, mantendo compatibilidade com quem já o usa sem elas:

```ts
interface Props {
  children: ReactNode
  className?: string
  onClick?: () => void
  index?: number        // se presente, usa staggerItem dentro de um staggerContainer pai
  interactive?: boolean // default: true se onClick existir
}
```

Comportamento:
- Com `onClick` (ou `interactive={true}` explícito): `whileHover={{ y: -2 }}`
  e `whileTap={{ scale: 0.98 }}`, complementando o glow que já existe via
  CSS (`cyber-card-wrap:hover`).
- Com `index` definido: o card vira um `motion.div` com `variants={staggerItem}`
  em vez de `div` estático — o pai precisa envolver o grupo de cards com
  uma `motion.div variants={staggerContainer} initial="hidden" animate="visible"`.

**Rollout do stagger de entrada** nos pontos hoje sem animação:
- Linhas da tabela em `MembrosPage.tsx` (`SortableRow` — atenção: precisa
  conviver com o `dnd-kit`, que já aplica `transform`/`transition` inline
  via `style`; a entrada em stagger só se aplica na carga inicial da lista,
  não durante o drag).
- Tabela de contas em `ConfiguracoesPage.tsx` (aba "Contas").
- Itens de lista em `ListEditor` (Patentes/Cargos/QRUs) dentro de
  `ConfiguracoesPage.tsx`.

**Migração das páginas que já tinham stagger local** (`DashboardPage.tsx`,
`EstatisticasPage.tsx`, `HistoricoPage.tsx`, `RecrutamentoPage.tsx`) para
usar `staggerContainer`/`staggerItem`/`tacticalReveal` do kit central, em
vez das variantes locais duplicadas.

### 4. Ajustes de layout

**Novo componente `PageHeader`**
(`frontend/src/components/ui/PageHeader.tsx`):

```ts
interface Props {
  icon: LucideIcon
  title: string
  subtitle?: string
  actions?: ReactNode
}
```

Renderiza ícone + título (font-orbitron, tracking-wide, cor gold) +
subtítulo opcional (font-mono, txt2) à esquerda, e o slot `actions` à
direita (para botões como "Novo Membro", "Exportar CSV" etc.).

Aplicado em `RegistrarAcaoPage`, `HistoricoPage`, `EstatisticasPage`,
`RecrutamentoPage`, `MembrosPage`, `ConfiguracoesPage`, `RecrutaCandidatoPage`
— substituindo cabeçalhos ad-hoc ou a ausência deles. `DashboardPage`
mantém seu hero atual (tela de entrada, propositalmente diferente).

**Reuso de `ModalOverlay`**: o modal "Novo Candidato" em
`RecrutamentoPage.tsx` (hoje reimplementado com `motion.div` própria,
overlay e spring customizados) passa a usar o componente `ModalOverlay`
já usado pelas outras 3 telas com modal. Remove duplicação e unifica a
sensação de abertura/fechamento.

**Escala de espaçamento**: confirmar `p-6 space-y-4` como padrão de
página em todas as telas (é o padrão majoritário hoje); ajustar os poucos
casos que fogem disso durante a implementação de `PageHeader`.

### 5. Extra: shared-element no fluxo Recrutamento

Em `RecrutamentoPage.tsx`, cada linha da lista ganha
`layoutId={`recruta-${r.id}`}` no container da linha. Em
`RecrutaCandidatoPage.tsx`, o cabeçalho da página de detalhe (nome +
badge de status do candidato) usa o mesmo `layoutId={`recruta-${id}`}`.
O Framer Motion detecta o `layoutId` compartilhado entre as duas telas
(mesmo estando em rotas diferentes, contanto que a transição de rota use
`AnimatePresence`, o que já é o caso via `AppShell`) e anima a
interpolação de posição/tamanho automaticamente — não é necessário nenhum
código de transição manual além de definir o `layoutId` nos dois lugares
e garantir que a estrutura do elemento (não o conteúdo interno completo)
seja compatível o suficiente para a interpolação fazer sentido
visualmente.

Risco conhecido: shared-element transitions entre rotas via
`react-router` + `AnimatePresence` podem exigir que a página de saída e a
de entrada estejam montadas simultaneamente por um instante — isso já é
garantido pelo `mode="wait"` atual? **Não** — `mode="wait"` espera a saída
terminar antes de montar a entrada, o que impediria a interpolação
shared-element (as duas precisam coexistir brevemente). Para este efeito
específico funcionar, a transição de `AppShell` não pode usar
`mode="wait"` — ou o efeito shared-element fica restrito a um mecanismo
próprio dentro do fluxo Recrutamento (ex.: renderizar o detalhe como um
estado local/overlay em vez de navegação de rota separada).
**Decisão**: manter `mode="wait"` na transição geral de rotas (é o
comportamento certo pro resto do app) e implementar o efeito
Recrutamento como uma exceção pontual, avaliando durante a implementação
se compensa (via `mode="popLayout"` ou um estado local só para essa
tela). Se a complexidade/risco se mostrar maior que o benefício visual
na prática, o fallback é usar `tacticalReveal` normal nessa navegação e
descartar o shared-element — decisão a ser validada visualmente, não é
um requisito rígido.

## Ordem de implementação

1. Kit de motion (`lib/motion.ts`)
2. `AppShell` (transição de rota) + `Sidebar` (indicador ativo) +
   `ConfiguracoesPage` (transição de aba interna)
3. `GlowCard` (props novas) + rollout do stagger nos pontos sem animação
   + migração das páginas com stagger local para o kit
4. `PageHeader` (novo componente) aplicado nas 7 páginas + correção do
   modal do Recrutamento para usar `ModalOverlay`
5. Extra: shared-element no fluxo Recrutamento (avaliação visual durante
   a implementação; pode ser revertido para `tacticalReveal` simples sem
   impacto no restante do trabalho)

## Verificação

- `npm run build` (typecheck via `tsc -b` + build do Vite) a cada etapa
  da ordem acima.
- Depois de cada etapa, abrir o app no navegador e navegar pelas 9
  páginas + todas as abas de `ConfiguracoesPage`, conferindo visualmente:
  sem "pulo" de layout, sem z-index quebrado, sem animação disparando
  duas vezes (ex.: stagger reiniciando ao trocar filtro em vez de só na
  carga inicial).
- Testar especificamente o comportamento do `dnd-kit` em `MembrosPage`
  após adicionar stagger de entrada — o drag-and-drop não pode herdar
  transições de entrada durante o arrasto.
