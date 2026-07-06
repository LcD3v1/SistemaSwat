# Redesign de Motion e Layout — Sistema SWAT (frontend) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unificar as animações do frontend (transição de rota, troca de aba interna, entrada/hover de cards e tabelas) num kit de motion central com personalidade tática/HUD, e resolver as inconsistências de layout associadas (cabeçalhos ad-hoc, modal duplicado).

**Architecture:** Um novo módulo `frontend/src/lib/motion.ts` concentra timing/easing/variantes; componentes de layout (`AppShell`, `Sidebar`) e de UI (`GlowCard`, novo `PageHeader`) passam a consumir esse kit; as 9 páginas migram suas animações locais para as variantes centrais e ganham o `PageHeader` compartilhado.

**Tech Stack:** React 19, Framer Motion 12, Tailwind 4, TypeScript, Vite. Sem framework de teste unitário no projeto — a verificação de cada tarefa é `npm run build` (typecheck + build) rodado em `frontend/`, mais checagem visual manual no navegador (o app já roda em `http://localhost:3001` via backend servindo o `dist`, ou `npm run dev` do frontend para hot-reload).

---

## Nota sobre verificação

Este projeto não tem Jest/Vitest configurado (`frontend/package.json` só tem `dev`, `build`, `lint`, `preview`). Por isso, em vez do ciclo clássico "escreve teste falhando → implementa → teste passa", cada tarefa usa:
1. `npm run build` em `frontend/` (roda `tsc -b && vite build` — falha se houver erro de tipo).
2. Checagem visual manual descrita no próprio step (o que observar no navegador).

---

### Task 1: Kit de motion central

**Files:**
- Create: `frontend/src/lib/motion.ts`

- [ ] **Step 1: Criar o arquivo com as constantes e variantes**

```ts
// frontend/src/lib/motion.ts
export const DURATION = {
  fast: 0.15,
  base: 0.2,
  page: 0.22,
} as const

export const EASE_SHARP = [0.4, 0, 0.2, 1] as const

export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
}

export const staggerItem = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE_SHARP } },
}

export const tacticalReveal = {
  initial: { opacity: 0, x: -8 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 8 },
  transition: { duration: DURATION.page, ease: EASE_SHARP },
}
```

Nota: o `clipPath` de "varredura" descrito na spec foi removido desta primeira
versão — misturar `clipPath` animado com o layout flexível das páginas
(`overflow-y-auto`, tabelas largas) tem risco real de cortar conteúdo
durante a transição. Fica `opacity + x` (o mesmo espírito, sem o risco).
Se depois da Task 2 o efeito parecer fraco demais, ajustar os valores de
`x`/`duration` aqui é a única mudança necessária — é exatamente o motivo
de centralizar essas constantes.

- [ ] **Step 2: Verificar que o projeto ainda compila**

Run: `cd frontend && npm run build`
Expected: build conclui sem erros (o arquivo novo ainda não é importado por ninguém, então não pode quebrar nada).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/motion.ts
git commit -m "feat(motion): adiciona kit de motion central (timing/easing/variantes)"
```

---

### Task 2: Transição de rota tática (`AppShell`)

**Files:**
- Modify: `frontend/src/components/layout/AppShell.tsx:1-49`

- [ ] **Step 1: Importar o kit e trocar a transição do `motion.div` do `Outlet`**

Substituir o import do topo:

```tsx
import { Outlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import ToastContainer from '@/components/ui/ToastNotification'
import ScanlineOverlay from '@/components/ui/ScanlineOverlay'
import api from '@/lib/axios'
import { useAuthStore } from '@/store/authStore'
import { tacticalReveal } from '@/lib/motion'
```

E o bloco do `<main>` (era):

```tsx
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
```

vira:

```tsx
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={tacticalReveal.initial}
              animate={tacticalReveal.animate}
              exit={tacticalReveal.exit}
              transition={tacticalReveal.transition}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
```

- [ ] **Step 2: Verificar build**

Run: `cd frontend && npm run build`
Expected: build passa sem erros.

- [ ] **Step 3: Checagem visual**

Rodar `npm run dev` no frontend, logar no sistema e navegar entre pelo menos 3 páginas do menu lateral (ex: Dashboard → Membros → Configurações). Confirmar que a troca de página tem um leve deslizar horizontal + fade em vez do fade vertical anterior, e que nada "pisca" ou corta conteúdo.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/layout/AppShell.tsx
git commit -m "feat(motion): usa tacticalReveal na transição de rota do AppShell"
```

---

### Task 3: Indicador de rota ativa animado na Sidebar

**Files:**
- Modify: `frontend/src/components/layout/Sidebar.tsx:1-127`

- [ ] **Step 1: Importar `useLocation` e as constantes do kit**

Trocar a linha de import do `react-router-dom` (linha 2) de:

```tsx
import { NavLink } from 'react-router-dom'
```

para:

```tsx
import { NavLink, useLocation } from 'react-router-dom'
```

E adicionar, junto aos outros imports:

```tsx
import { DURATION, EASE_SHARP } from '@/lib/motion'
```

- [ ] **Step 2: Obter a rota atual dentro do componente**

Dentro de `export default function Sidebar()`, logo após `const { data: logoData } = useLogo()`, adicionar:

```tsx
  const location = useLocation()
```

- [ ] **Step 3: Substituir o bloco de navegação para usar indicador com `layoutId`**

O bloco (linhas 80-108 do arquivo original):

```tsx
      <nav className="flex-1 py-4 flex flex-col gap-1 px-2 overflow-y-auto">
        {visibleItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200 group
              ${isActive
                ? 'bg-bdrg border-l-2 border-gold text-gold'
                : 'text-txt2 hover:text-txt hover:bg-bdr border-l-2 border-transparent'
              }`
            }
          >
            <item.icon size={18} className="shrink-0" />
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-mono text-xs tracking-wide whitespace-nowrap overflow-hidden"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>
```

vira:

```tsx
      <nav className="flex-1 py-4 flex flex-col gap-1 px-2 overflow-y-auto">
        {visibleItems.map(item => {
          const isActive = location.pathname === item.to
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors duration-200 group ${
                isActive ? 'text-gold' : 'text-txt2 hover:text-txt hover:bg-bdr'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-nav-indicator"
                  className="absolute inset-0 bg-bdrg border-l-2 border-gold rounded-md"
                  transition={{ duration: DURATION.base, ease: EASE_SHARP }}
                />
              )}
              <item.icon size={18} className="relative shrink-0" />
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative font-mono text-xs tracking-wide whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          )
        })}
      </nav>
```

(`relative` no ícone e no label garante que fiquem acima do indicador
absoluto, que não tem `z-index` explícito mas vem antes deles no DOM.)

- [ ] **Step 2: Verificar build**

Run: `cd frontend && npm run build`
Expected: build passa sem erros.

- [ ] **Step 3: Checagem visual**

No navegador, clicar em diferentes itens do menu lateral e observar a
barra dourada de fundo deslizando suavemente de um item pro outro (não
"pulando" instantaneamente).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/layout/Sidebar.tsx
git commit -m "feat(motion): indicador de rota ativa com layoutId deslizante na Sidebar"
```

---

### Task 4: Transição entre abas internas de `ConfiguracoesPage`

**Files:**
- Modify: `frontend/src/components/sections/ConfiguracoesPage.tsx:1-32,247-253,408-411`

- [ ] **Step 1: Importar `AnimatePresence` e `tacticalReveal`**

Trocar a linha 1 de:

```tsx
import { motion } from 'framer-motion'
```

para:

```tsx
import { motion, AnimatePresence } from 'framer-motion'
```

E adicionar, junto aos outros imports do topo do arquivo:

```tsx
import { tacticalReveal } from '@/lib/motion'
```

- [ ] **Step 2: Envolver o conteúdo condicional com transição por aba**

O bloco (era):

```tsx
      {/* Conteúdo */}
      <GlowCard>
        <div className="p-6">
          {/* Logo */}
          {activeTab === 'logo' && (
```

vira:

```tsx
      {/* Conteúdo */}
      <GlowCard>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={tacticalReveal.initial}
            animate={tacticalReveal.animate}
            exit={tacticalReveal.exit}
            transition={tacticalReveal.transition}
            className="p-6"
          >
          {/* Logo */}
          {activeTab === 'logo' && (
```

E o fechamento do bloco (era, próximo ao fim do arquivo):

```tsx
        </div>
      </GlowCard>

      {/* Modal Nova Conta */}
```

vira:

```tsx
          </motion.div>
        </AnimatePresence>
      </GlowCard>

      {/* Modal Nova Conta */}
```

(A indentação interna do conteúdo entre esses dois pontos não muda —
só a abertura/fechamento do wrapper.)

- [ ] **Step 3: Verificar build**

Run: `cd frontend && npm run build`
Expected: build passa sem erros.

- [ ] **Step 4: Checagem visual**

Ir em Configurações e clicar em cada aba (Logo, Patentes, Cargos, QRUs,
Recrutamento, Contas), confirmando que o conteúdo troca com a mesma
sensação de "varredura" da transição de rota, sem sobreposição de
conteúdo de abas diferentes.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/sections/ConfiguracoesPage.tsx
git commit -m "feat(motion): transição tática entre abas internas de Configurações"
```

---

### Task 5: `GlowCard` com hover/tap/stagger

**Files:**
- Modify: `frontend/src/components/ui/GlowCard.tsx` (arquivo inteiro, 21 linhas)

- [ ] **Step 1: Reescrever o componente**

```tsx
import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { staggerItem } from '@/lib/motion'

interface Props {
  children: ReactNode
  className?: string
  onClick?: () => void
  index?: number
  interactive?: boolean
}

export default function GlowCard({ children, className = '', onClick, index, interactive }: Props) {
  const isInteractive = interactive ?? Boolean(onClick)

  return (
    <motion.div
      className={`cyber-card-wrap ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      whileHover={isInteractive ? { y: -2 } : undefined}
      whileTap={isInteractive ? { scale: 0.98 } : undefined}
      variants={index !== undefined ? staggerItem : undefined}
    >
      <div className="cyber-card">
        {children}
      </div>
    </motion.div>
  )
}
```

`index` não é usado diretamente dentro do componente (não precisa — as
`variants` do Framer Motion propagam pelo contexto do pai quando o pai
usa `staggerContainer`). Ele existe na assinatura só pra deixar explícito
no call-site "este card faz parte de um grupo com stagger", e para uma
eventual necessidade futura de atrasar itens individualmente — por ora
o parâmetro apenas habilita a variante; isso é suficiente para o uso
atual (nenhuma página precisa de delay por índice além do
`staggerChildren` do container pai).

- [ ] **Step 2: Verificar build**

Run: `cd frontend && npm run build`
Expected: build passa sem erros — nenhum call-site de `GlowCard` quebra porque as novas props são opcionais.

- [ ] **Step 3: Checagem visual**

Abrir qualquer página com `GlowCard` clicável (ex: lista de Recrutamento)
e passar o mouse sobre o card — deve subir levemente (2px) além do glow
que já existia.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/ui/GlowCard.tsx
git commit -m "feat(motion): GlowCard ganha hover/tap e suporte a stagger via props opcionais"
```

---

### Task 6: Utilitário CSS de entrada para linhas com drag-and-drop

**Contexto:** `MembrosPage` (tabela de membros) e o editor de QRUs em
`ConfiguracoesPage` usam `@dnd-kit`, que controla a propriedade CSS
`transform` inline via `style` para o arrasto. Animar a entrada dessas
linhas com Framer Motion (que também usa `transform`) arriscaria os dois
sistemas brigarem pelo mesmo estilo. Solução: uma animação CSS pura de
opacidade/translateY que só roda uma vez na montagem (via `@keyframes` +
`animation-delay`), sem tocar a propriedade `transform` gerenciada pelo
`dnd-kit` fora da animação.

**Files:**
- Modify: `frontend/src/index.css` (adicionar ao final do arquivo)

- [ ] **Step 1: Adicionar o utilitário no CSS**

Adicionar ao final de `frontend/src/index.css`:

```css
/* ── Entrada de linha (compatível com dnd-kit) ──────────────────── */
@keyframes rowFadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
.row-fade-in {
  animation: rowFadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1) backwards;
  animation-delay: calc(var(--row-i, 0) * 40ms);
}
```

- [ ] **Step 2: Verificar build**

Run: `cd frontend && npm run build`
Expected: build passa sem erros (CSS puro, não afeta TypeScript).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/index.css
git commit -m "feat(motion): utilitário CSS row-fade-in compatível com dnd-kit"
```

---

### Task 7: Aplicar `row-fade-in` em `MembrosPage` e no editor de QRUs

**Files:**
- Modify: `frontend/src/components/sections/MembrosPage.tsx:100,304-314`
- Modify: `frontend/src/components/sections/ConfiguracoesPage.tsx:55-63,134-144`

- [ ] **Step 1: `MembrosPage` — receber e usar o índice na `SortableRow`**

Adicionar `index: number` à interface `SortableRowProps` (era):

```tsx
interface SortableRowProps {
  membro: Membro
  canEdit: boolean
  onUpdate: (id: number, data: Partial<Membro>) => void
  onDelete: (id: number) => void
  patentes: string[]
  cargos: string[]
}
```

vira:

```tsx
interface SortableRowProps {
  membro: Membro
  index: number
  canEdit: boolean
  onUpdate: (id: number, data: Partial<Membro>) => void
  onDelete: (id: number) => void
  patentes: string[]
  cargos: string[]
}
```

A assinatura da função (era):

```tsx
function SortableRow({ membro, canEdit, onUpdate, onDelete, patentes, cargos }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: membro.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <tr ref={setNodeRef} style={style} className="border-b border-bdr/50 hover:bg-bdr/30 transition-colors group">
```

vira:

```tsx
function SortableRow({ membro, index, canEdit, onUpdate, onDelete, patentes, cargos }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: membro.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    '--row-i': index,
  } as React.CSSProperties

  return (
    <tr ref={setNodeRef} style={style} className="row-fade-in border-b border-bdr/50 hover:bg-bdr/30 transition-colors group">
```

- [ ] **Step 2: Passar o índice no call-site**

O bloco de renderização (era):

```tsx
                    orderedMembros.map(m => (
                      <SortableRow
                        key={m.id}
                        membro={m}
                        canEdit={canEdit}
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
                        patentes={patentes}
                        cargos={cargos}
                      />
                    ))
```

vira:

```tsx
                    orderedMembros.map((m, i) => (
                      <SortableRow
                        key={m.id}
                        membro={m}
                        index={i}
                        canEdit={canEdit}
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
                        patentes={patentes}
                        cargos={cargos}
                      />
                    ))
```

- [ ] **Step 3: Mesmo padrão no `SortableListItem` de `ConfiguracoesPage` (usado pelas QRUs)**

Adicionar `index: number` aos parâmetros da função (era):

```tsx
function SortableListItem({
  item, canEdit, onDelete, canReorder,
}: {
  item: string
  canEdit: boolean
  onDelete: (v: string) => void
  canReorder: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.55 : 1,
      }}
      className="flex items-center gap-2 px-3 py-2 bg-card2 border border-bdr rounded group"
    >
```

vira:

```tsx
function SortableListItem({
  item, index, canEdit, onDelete, canReorder,
}: {
  item: string
  index: number
  canEdit: boolean
  onDelete: (v: string) => void
  canReorder: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.55 : 1,
        '--row-i': index,
      } as React.CSSProperties}
      className="row-fade-in flex items-center gap-2 px-3 py-2 bg-card2 border border-bdr rounded group"
    >
```

E o call-site dentro de `ListEditor` (era):

```tsx
              <div className="space-y-1">
                {localItems.map(item => (
                  <SortableListItem
                    key={item}
                    item={item}
                    canEdit={canEdit}
                    canReorder={canReorder}
                    onDelete={onDelete}
                  />
                ))}
              </div>
```

vira:

```tsx
              <div className="space-y-1">
                {localItems.map((item, i) => (
                  <SortableListItem
                    key={item}
                    item={item}
                    index={i}
                    canEdit={canEdit}
                    canReorder={canReorder}
                    onDelete={onDelete}
                  />
                ))}
              </div>
```

- [ ] **Step 4: Verificar build**

Run: `cd frontend && npm run build`
Expected: build passa sem erros.

- [ ] **Step 5: Checagem visual**

Recarregar a página de Membros — as linhas devem aparecer em cascata
rápida (não todas de uma vez). Recarregar Configurações → QRUs — mesmo
comportamento na lista de QRUs. Testar arrastar uma linha em ambas as
telas — o arrasto deve continuar funcionando normalmente, sem "pulos".

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/sections/MembrosPage.tsx frontend/src/components/sections/ConfiguracoesPage.tsx
git commit -m "feat(motion): entrada em cascata nas linhas de Membros e QRUs via row-fade-in"
```

---

### Task 8: Stagger de entrada na tabela de Contas e listas de Patentes/Cargos

**Files:**
- Modify: `frontend/src/components/sections/ConfiguracoesPage.tsx:1,148-158,352-406`

Estes dois pontos **não** usam `dnd-kit`, então usam o kit de motion
(Framer Motion) diretamente, em vez do utilitário CSS da Task 6/7.

- [ ] **Step 1: Importar `staggerContainer`/`staggerItem`**

Adicionar ao bloco de imports do topo do arquivo:

```tsx
import { staggerContainer, staggerItem } from '@/lib/motion'
```

- [ ] **Step 2: Lista não-sortable de `ListEditor` (Patentes/Cargos)**

O bloco (era):

```tsx
        ) : (
          localItems.map(item => (
            <div key={item} className="flex items-center justify-between px-3 py-2 bg-card2 border border-bdr rounded group">
              <span className="font-mono text-xs text-txt">{item}</span>
              {canEdit && (
                <button onClick={() => onDelete(item)} className="opacity-0 group-hover:opacity-100 text-txt3 hover:text-red transition-all">
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))
        )}
```

vira:

```tsx
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            {localItems.map(item => (
              <motion.div
                key={item}
                variants={staggerItem}
                className="flex items-center justify-between px-3 py-2 bg-card2 border border-bdr rounded group"
              >
                <span className="font-mono text-xs text-txt">{item}</span>
                {canEdit && (
                  <button onClick={() => onDelete(item)} className="opacity-0 group-hover:opacity-100 text-txt3 hover:text-red transition-all">
                    <Trash2 size={12} />
                  </button>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
```

- [ ] **Step 3: Tabela de Contas**

O `tbody` (era):

```tsx
                <tbody>
                  {contas.map(conta => (
                    <tr key={conta.id} className="border-b border-bdr/50 hover:bg-bdr/30 transition-colors">
```

vira:

```tsx
                <motion.tbody variants={staggerContainer} initial="hidden" animate="visible">
                  {contas.map(conta => (
                    <motion.tr key={conta.id} variants={staggerItem} className="border-b border-bdr/50 hover:bg-bdr/30 transition-colors">
```

E o fechamento correspondente (era):

```tsx
                  ))}
                </tbody>
              </table>
```

(no bloco da aba "Contas") vira:

```tsx
                  ))}
                </motion.tbody>
              </table>
```

- [ ] **Step 4: Verificar build**

Run: `cd frontend && npm run build`
Expected: build passa sem erros.

- [ ] **Step 5: Checagem visual**

Configurações → Patentes/Cargos: itens da lista aparecem em cascata ao
trocar de aba. Configurações → Contas: linhas da tabela idem.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/sections/ConfiguracoesPage.tsx
git commit -m "feat(motion): stagger de entrada na lista de Patentes/Cargos e tabela de Contas"
```

---

### Task 9: Migrar `DashboardPage` para o kit central

**Files:**
- Modify: `frontend/src/components/sections/DashboardPage.tsx:1-23,171-182`

- [ ] **Step 1: Trocar as variantes locais pelo import do kit**

Remover do topo do arquivo (linhas 16-23):

```tsx
const ITEM_VARIANTS = {
  hidden: { opacity: 0, scale: 0.95, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3 } },
}
const CONTAINER_VARIANTS = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}
```

E adicionar ao bloco de imports, no lugar:

```tsx
import { staggerContainer, staggerItem } from '@/lib/motion'
```

- [ ] **Step 2: Atualizar as referências de `ITEM_VARIANTS`/`CONTAINER_VARIANTS`**

No JSX, trocar todas as ocorrências de `variants={CONTAINER_VARIANTS}` por
`variants={staggerContainer}` e `variants={ITEM_VARIANTS}` por
`variants={staggerItem}`. São 3 ocorrências no arquivo: o grid de stat
cards (`variants={CONTAINER_VARIANTS}` no container, `variants={ITEM_VARIANTS}`
em cada `StatCard`) e as duas listas de "Últimas Operações"/"Ranking de
Operadores" (mesmo par).

- [ ] **Step 3: Verificar build**

Run: `cd frontend && npm run build`
Expected: build passa sem erros.

- [ ] **Step 4: Checagem visual**

Abrir o Dashboard — o comportamento de entrada dos cards deve parecer
idêntico a antes (a troca é só de onde vem a definição, os valores são
equivalentes em espírito — leve diferença aceitável: duração 0.2s em vez
de 0.3s, e sem o `scale: 0.95` inicial, que não fazia parte do padrão
tático definido no kit).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/sections/DashboardPage.tsx
git commit -m "refactor(motion): DashboardPage usa staggerContainer/staggerItem do kit central"
```

---

### Task 10: Migrar `EstatisticasPage` para o kit central

**Files:**
- Modify: `frontend/src/components/sections/EstatisticasPage.tsx:1-28`

- [ ] **Step 1: Trocar as variantes locais pelo import do kit**

Remover (linhas 21-28):

```tsx
const ROW_VARIANTS = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
}
const TABLE_VARIANTS = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}
```

Adicionar ao bloco de imports:

```tsx
import { staggerContainer, staggerItem } from '@/lib/motion'
```

- [ ] **Step 2: Atualizar as referências**

Trocar as 2 ocorrências de `variants={TABLE_VARIANTS}` (nos dois
`motion.tbody`) por `variants={staggerContainer}`, e as 2 ocorrências de
`variants={ROW_VARIANTS}` (nos `motion.tr`) por `variants={staggerItem}`.

- [ ] **Step 3: Verificar build**

Run: `cd frontend && npm run build`
Expected: build passa sem erros.

- [ ] **Step 4: Checagem visual**

Ir em Estatísticas — as tabelas de "Performance por Operador" e
"Estatísticas por QRU" devem continuar entrando linha por linha.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/sections/EstatisticasPage.tsx
git commit -m "refactor(motion): EstatisticasPage usa staggerContainer/staggerItem do kit central"
```

---

### Task 11: Adicionar entrada em cascata em `HistoricoPage`

**Files:**
- Modify: `frontend/src/components/sections/HistoricoPage.tsx:1-2,123-136`

`HistoricoPage` hoje só anima a **saída** das linhas (`exit`), sem
entrada — este task adiciona a entrada usando o kit central.

- [ ] **Step 1: Importar o kit**

Adicionar ao bloco de imports:

```tsx
import { staggerContainer, staggerItem } from '@/lib/motion'
```

- [ ] **Step 2: Envolver o `tbody` com o container de stagger e usar `staggerItem` na entrada**

O bloco (era):

```tsx
            <tbody>
              <AnimatePresence>
                {acoes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 font-mono text-xs text-txt3">
                      Nenhuma ação encontrada
                    </td>
                  </tr>
                ) : acoes.map((acao: Acao) => (
                  <motion.tr
                    key={acao.id}
                    layout
                    exit={{ opacity: 0, x: 200 }}
                    transition={{ duration: 0.25 }}
                    className="border-b border-bdr/50 hover:bg-bdr/40 transition-colors group"
                  >
```

vira:

```tsx
            <motion.tbody variants={staggerContainer} initial="hidden" animate="visible">
              <AnimatePresence>
                {acoes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 font-mono text-xs text-txt3">
                      Nenhuma ação encontrada
                    </td>
                  </tr>
                ) : acoes.map((acao: Acao) => (
                  <motion.tr
                    key={acao.id}
                    layout
                    variants={staggerItem}
                    exit={{ opacity: 0, x: 200 }}
                    transition={{ duration: 0.25 }}
                    className="border-b border-bdr/50 hover:bg-bdr/40 transition-colors group"
                  >
```

E o fechamento (era):

```tsx
                ))}
              </AnimatePresence>
            </tbody>
```

vira:

```tsx
                ))}
              </AnimatePresence>
            </motion.tbody>
```

- [ ] **Step 3: Verificar build**

Run: `cd frontend && npm run build`
Expected: build passa sem erros.

- [ ] **Step 4: Checagem visual**

Ir em Histórico — ao carregar a página, as linhas devem entrar em
cascata (novidade); ao deletar uma ação, a linha ainda deve sair
deslizando pra direita (comportamento preexistente, não deve ter
mudado).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/sections/HistoricoPage.tsx
git commit -m "feat(motion): adiciona entrada em cascata nas linhas de HistoricoPage"
```

---

### Task 12: Migrar `RecrutamentoPage` para o kit central e trocar o modal bespoke por `ModalOverlay`

**Files:**
- Modify: `frontend/src/components/sections/RecrutamentoPage.tsx` (arquivo inteiro, 232 linhas)

- [ ] **Step 1: Atualizar imports**

O bloco de imports (era):

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, ChevronRight, Users, Lock, Unlock } from 'lucide-react'
import { useRecrutos, useCreateRecruta, useDeleteRecruta } from '@/hooks/useRecrutos'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import GlowCard from '@/components/ui/GlowCard'
import HudButton from '@/components/ui/HudButton'
import LoadingHud from '@/components/ui/LoadingHud'
import { formatDate } from '@/lib/utils'
import type { Recruta } from '@/types'
```

vira:

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, ChevronRight, Users, Lock, Unlock } from 'lucide-react'
import { useRecrutos, useCreateRecruta, useDeleteRecruta } from '@/hooks/useRecrutos'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import GlowCard from '@/components/ui/GlowCard'
import HudButton from '@/components/ui/HudButton'
import LoadingHud from '@/components/ui/LoadingHud'
import ModalOverlay from '@/components/ui/ModalOverlay'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { formatDate } from '@/lib/utils'
import type { Recruta } from '@/types'
```

- [ ] **Step 2: Envolver a lista com `staggerContainer`/`staggerItem`**

O bloco da lista (era):

```tsx
      <GlowCard>
        <div className="divide-y divide-bdr">
          {(recrutas ?? []).length === 0 ? (
            <p className="text-center font-mono text-xs text-txt3 py-12">Nenhum candidato registrado</p>
          ) : (
            <AnimatePresence>
              {(recrutas ?? []).map((r: Recruta) => {
                const media = mediaAvaliações(r)
                const jaAvaliou = r.avaliacoes.some(a => a.contaId === user?.contaId)
                return (
                  <motion.div
                    key={r.id}
                    layout
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    onClick={() => navigate(`/recrutamento/${r.id}`)}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-bdr/40 cursor-pointer transition-colors group"
                  >
```

vira:

```tsx
      <GlowCard>
        <motion.div className="divide-y divide-bdr" variants={staggerContainer} initial="hidden" animate="visible">
          {(recrutas ?? []).length === 0 ? (
            <p className="text-center font-mono text-xs text-txt3 py-12">Nenhum candidato registrado</p>
          ) : (
            <AnimatePresence>
              {(recrutas ?? []).map((r: Recruta) => {
                const media = mediaAvaliações(r)
                const jaAvaliou = r.avaliacoes.some(a => a.contaId === user?.contaId)
                return (
                  <motion.div
                    key={r.id}
                    layout
                    variants={staggerItem}
                    exit={{ opacity: 0 }}
                    onClick={() => navigate(`/recrutamento/${r.id}`)}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-bdr/40 cursor-pointer transition-colors group"
                  >
```

E o fechamento (era):

```tsx
              })}
            </AnimatePresence>
          )}
        </div>
      </GlowCard>
```

vira:

```tsx
              })}
            </AnimatePresence>
          )}
        </motion.div>
      </GlowCard>
```

- [ ] **Step 3: Trocar o modal bespoke pelo `ModalOverlay` compartilhado**

O bloco do modal (era, ~70 linhas no fim do arquivo):

```tsx
      {/* Modal novo candidato */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border border-bdr rounded-lg p-6 w-full max-w-sm shadow-2xl"
            >
              <h3 className="font-orbitron text-xs font-bold text-gold tracking-wider mb-4">NOVO CANDIDATO</h3>
              <div className="space-y-3">
                <div>
                  <label className="font-mono text-xs text-txt2 block mb-1">NOME</label>
                  <input
                    autoFocus
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
                    className="input-gold w-full bg-card2 border border-bdr2 rounded px-3 py-2 text-sm font-mono text-txt"
                    placeholder="Nome do candidato"
                  />
                </div>
                <div>
                  <label className="font-mono text-xs text-txt2 block mb-1">DATA</label>
                  <input
                    type="date"
                    value={data}
                    onChange={e => setData(e.target.value)}
                    className="input-gold w-full bg-card2 border border-bdr2 rounded px-3 py-2 text-sm font-mono text-txt"
                  />
                </div>
                <div>
                  <label className="font-mono text-xs text-txt2 block mb-1">OBSERVAÇÕES</label>
                  <textarea
                    value={observacoes}
                    onChange={e => setObservacoes(e.target.value)}
                    rows={2}
                    className="input-gold w-full bg-card2 border border-bdr2 rounded px-3 py-2 text-sm font-mono text-txt resize-none"
                    placeholder="Opcional..."
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 border border-bdr2 rounded font-mono text-xs text-txt3 hover:text-txt transition-colors"
                >
                  CANCELAR
                </button>
                <HudButton
                  onClick={handleCreate}
                  loading={createRecruta.isPending}
                  disabled={!nome.trim()}
                  className="flex-1 justify-center"
                >
                  REGISTRAR
                </HudButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
```

vira:

```tsx
      {/* Modal novo candidato */}
      <ModalOverlay open={showModal} onClose={() => setShowModal(false)} title="NOVO CANDIDATO" maxWidth="max-w-sm">
        <div className="space-y-3">
          <div>
            <label className="font-mono text-xs text-txt2 block mb-1">NOME</label>
            <input
              autoFocus
              value={nome}
              onChange={e => setNome(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
              className="input-gold w-full bg-card2 border border-bdr2 rounded px-3 py-2 text-sm font-mono text-txt"
              placeholder="Nome do candidato"
            />
          </div>
          <div>
            <label className="font-mono text-xs text-txt2 block mb-1">DATA</label>
            <input
              type="date"
              value={data}
              onChange={e => setData(e.target.value)}
              className="input-gold w-full bg-card2 border border-bdr2 rounded px-3 py-2 text-sm font-mono text-txt"
            />
          </div>
          <div>
            <label className="font-mono text-xs text-txt2 block mb-1">OBSERVAÇÕES</label>
            <textarea
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              rows={2}
              className="input-gold w-full bg-card2 border border-bdr2 rounded px-3 py-2 text-sm font-mono text-txt resize-none"
              placeholder="Opcional..."
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setShowModal(false)}
            className="flex-1 py-2 border border-bdr2 rounded font-mono text-xs text-txt3 hover:text-txt transition-colors"
          >
            CANCELAR
          </button>
          <HudButton
            onClick={handleCreate}
            loading={createRecruta.isPending}
            disabled={!nome.trim()}
            className="flex-1 justify-center"
          >
            REGISTRAR
          </HudButton>
        </div>
      </ModalOverlay>
```

- [ ] **Step 4: Verificar build**

Run: `cd frontend && npm run build`
Expected: build passa sem erros.

- [ ] **Step 5: Checagem visual**

Ir em Recrutamento: lista deve continuar entrando em cascata; clicar em
"Novo Candidato" deve abrir o mesmo estilo de modal usado em Membros
("Novo Membro") e Configurações ("Nova Conta") — spring de abertura,
fundo com blur, tecla Esc fechando.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/sections/RecrutamentoPage.tsx
git commit -m "refactor: RecrutamentoPage usa kit de motion central e ModalOverlay compartilhado"
```

---

### Task 13: Componente `PageHeader` compartilhado

**Files:**
- Create: `frontend/src/components/ui/PageHeader.tsx`

- [ ] **Step 1: Criar o componente**

```tsx
// frontend/src/components/ui/PageHeader.tsx
import { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface Props {
  icon: LucideIcon
  title: string
  subtitle?: string
  actions?: ReactNode
}

export default function PageHeader({ icon: Icon, title, subtitle, actions }: Props) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Icon size={20} className="text-gold shrink-0" />
        <div>
          <h2 className="font-orbitron text-sm font-bold text-gold tracking-widest">{title}</h2>
          {subtitle && (
            <p className="font-mono text-[10px] text-txt3 tracking-wider mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  )
}
```

- [ ] **Step 2: Verificar build**

Run: `cd frontend && npm run build`
Expected: build passa sem erros (componente novo, ainda não importado por ninguém).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ui/PageHeader.tsx
git commit -m "feat(ui): novo componente PageHeader compartilhado"
```

---

### Task 14: Aplicar `PageHeader` em `RecrutamentoPage` e `RecrutaCandidatoPage`

**Files:**
- Modify: `frontend/src/components/sections/RecrutamentoPage.tsx:1-14,62-72`
- Modify: `frontend/src/components/sections/RecrutaCandidatoPage.tsx:1-13,77-101`

- [ ] **Step 1: `RecrutamentoPage` — importar e usar `PageHeader`**

Adicionar ao bloco de imports:

```tsx
import PageHeader from '@/components/ui/PageHeader'
```

O cabeçalho manual (era):

```tsx
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-orbitron text-sm font-bold text-gold tracking-wider">RECRUTAMENTO</h2>
        {canEdit && (
          <HudButton size="sm" onClick={() => setShowModal(true)}>
            <Plus size={14} className="inline mr-1.5" />
            NOVO CANDIDATO
          </HudButton>
        )}
      </div>
```

vira:

```tsx
      <PageHeader
        icon={UserPlus}
        title="RECRUTAMENTO"
        actions={canEdit && (
          <HudButton size="sm" onClick={() => setShowModal(true)}>
            <Plus size={14} className="inline mr-1.5" />
            NOVO CANDIDATO
          </HudButton>
        )}
      />
```

E adicionar `UserPlus` ao import de `lucide-react` já existente (era):

```tsx
import { Plus, Trash2, ChevronRight, Users, Lock, Unlock } from 'lucide-react'
```

vira:

```tsx
import { Plus, Trash2, ChevronRight, Users, Lock, Unlock, UserPlus } from 'lucide-react'
```

- [ ] **Step 2: `RecrutaCandidatoPage` — importar e usar `PageHeader`**

Adicionar ao bloco de imports:

```tsx
import PageHeader from '@/components/ui/PageHeader'
```

O cabeçalho manual (era, linhas 79-101):

```tsx
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/recrutamento')} className="text-txt3 hover:text-txt transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-orbitron text-sm font-bold text-gold tracking-wider">{recruta.nome}</h2>
            <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded border tracking-widest ${
              aberto ? 'text-gold border-gold/40 bg-gold/10' : 'text-txt3 border-bdr2 bg-bdr'
            }`}>
              {aberto ? 'ABERTO' : 'FECHADO'}
            </span>
          </div>
          <p className="font-mono text-[10px] text-txt3 mt-0.5">{formatDate(recruta.data)}</p>
        </div>
        {canEdit && aberto && (
          <HudButton variant="ghost" size="sm" onClick={handleFechar} loading={fechar.isPending}>
            <Lock size={13} className="inline mr-1" />
            ENCERRAR
          </HudButton>
        )}
      </div>
```

Este cabeçalho tem elementos que não cabem no `PageHeader` genérico (o
botão "voltar" e o badge de status inline no título). Em vez de forçar
esses casos no componente compartilhado, mantém-se este cabeçalho como
está — ele já usa a mesma tipografia/cor do `PageHeader` (`font-orbitron
text-sm font-bold text-gold tracking-wider`), então visualmente já é
consistente. **Não aplicar `PageHeader` aqui.**

- [ ] **Step 3: Verificar build**

Run: `cd frontend && npm run build`
Expected: build passa sem erros.

- [ ] **Step 4: Checagem visual**

Ir em Recrutamento — cabeçalho com ícone de "adicionar pessoa" + título
+ botão à direita, alinhados. Confirmar que a página de detalhe do
candidato não mudou visualmente (Step 2 foi decidido como "não mudar").

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/sections/RecrutamentoPage.tsx
git commit -m "feat(ui): aplica PageHeader em RecrutamentoPage"
```

---

### Task 15: Aplicar `PageHeader` em `HistoricoPage`, `EstatisticasPage`, `MembrosPage`, `RegistrarAcaoPage`, `ConfiguracoesPage`

Estas 5 páginas hoje **não têm cabeçalho nenhum** — o conteúdo começa
direto na barra de filtros/ações dentro de um `GlowCard`. Cada uma ganha
um `PageHeader` acima do `GlowCard` existente, sem remover nada do que já
existe dentro dele.

**Files:**
- Modify: `frontend/src/components/sections/HistoricoPage.tsx:1-13,73-77`
- Modify: `frontend/src/components/sections/EstatisticasPage.tsx:1-18,248-252`
- Modify: `frontend/src/components/sections/MembrosPage.tsx:1-27,253-278`
- Modify: `frontend/src/components/sections/RegistrarAcaoPage.tsx:1-13,115-118`
- Modify: `frontend/src/components/sections/ConfiguracoesPage.tsx:1-33,222-246`

- [ ] **Step 1: `HistoricoPage`**

Adicionar import:

```tsx
import PageHeader from '@/components/ui/PageHeader'
```

Adicionar `History` ao import de ícones (era `import { Trash2, Download, Filter } from 'lucide-react'`, vira `import { Trash2, Download, Filter, History } from 'lucide-react'`).

O início do `return` (era):

```tsx
  return (
    <div className="p-6 space-y-4">
      {/* Filtros */}
      <GlowCard>
```

vira:

```tsx
  return (
    <div className="p-6 space-y-4">
      <PageHeader icon={History} title="HISTÓRICO DE OPERAÇÕES" />

      {/* Filtros */}
      <GlowCard>
```

- [ ] **Step 2: `EstatisticasPage`**

Adicionar import:

```tsx
import PageHeader from '@/components/ui/PageHeader'
```

Adicionar `BarChart2` ao import de ícones (era `import { Download, X, Calendar } from 'lucide-react'`, vira `import { Download, X, Calendar, BarChart2 } from 'lucide-react'`).

O início do `return` (era):

```tsx
  return (
    <div className="p-6 space-y-6">
      {/* Filtros e exportação */}
      <GlowCard>
```

vira:

```tsx
  return (
    <div className="p-6 space-y-6">
      <PageHeader icon={BarChart2} title="ESTATÍSTICAS" />

      {/* Filtros e exportação */}
      <GlowCard>
```

- [ ] **Step 3: `MembrosPage`**

Adicionar import:

```tsx
import PageHeader from '@/components/ui/PageHeader'
```

Adicionar `Users` ao import de ícones (era `import { Plus, Trash2 } from 'lucide-react'`, vira `import { Plus, Trash2, Users } from 'lucide-react'`).

O início do `return` (era):

```tsx
  return (
    <div className="p-6 space-y-4">
      <GlowCard>
        <div className="p-4 flex items-center gap-4">
```

vira:

```tsx
  return (
    <div className="p-6 space-y-4">
      <PageHeader icon={Users} title="MEMBROS DA UNIDADE" />

      <GlowCard>
        <div className="p-4 flex items-center gap-4">
```

- [ ] **Step 4: `RegistrarAcaoPage`**

Adicionar import:

```tsx
import PageHeader from '@/components/ui/PageHeader'
```

Adicionar `Radio` ao import de ícones (era `import { Plus, X, Send, UserX, Shield } from 'lucide-react'`, vira `import { Plus, X, Send, UserX, Shield, Radio } from 'lucide-react'`).

O início do `return` (era):

```tsx
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <GlowCard>
        <div className="p-6">
          <h2 className="font-orbitron text-sm font-bold text-gold tracking-wider mb-6">
            NOVA OPERAÇÃO
          </h2>
```

vira:

```tsx
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      <PageHeader icon={Radio} title="REGISTRAR AÇÃO" />

      <GlowCard>
        <div className="p-6">
```

(o `<h2>NOVA OPERAÇÃO</h2>` interno é removido — o título já está no
`PageHeader` acima; o `mx-auto` do container ganha `space-y-4` para
espaçar o header do card, seguindo o padrão das outras páginas.)

- [ ] **Step 5: `ConfiguracoesPage`**

Adicionar import:

```tsx
import PageHeader from '@/components/ui/PageHeader'
```

Adicionar `Settings` ao import de ícones já existente (era
`import { Image, List, Briefcase, Radio, UserPlus, Users, Plus, Trash2 } from 'lucide-react'`,
vira `import { Image, List, Briefcase, Radio, UserPlus, Users, Plus, Trash2, Settings } from 'lucide-react'`).

O início do `return` (era):

```tsx
  return (
    <div className="p-6 space-y-4">
      {/* Tabs */}
      <GlowCard>
```

vira:

```tsx
  return (
    <div className="p-6 space-y-4">
      <PageHeader icon={Settings} title="CONFIGURAÇÕES" />

      {/* Tabs */}
      <GlowCard>
```

- [ ] **Step 6: Verificar build**

Run: `cd frontend && npm run build`
Expected: build passa sem erros.

- [ ] **Step 7: Checagem visual**

Navegar pelas 5 páginas (Histórico, Estatísticas, Membros, Registrar
Ação, Configurações) e confirmar que cada uma agora tem um cabeçalho com
ícone + título consistente antes do conteúdo, sem quebrar o layout
existente abaixo.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/components/sections/HistoricoPage.tsx frontend/src/components/sections/EstatisticasPage.tsx frontend/src/components/sections/MembrosPage.tsx frontend/src/components/sections/RegistrarAcaoPage.tsx frontend/src/components/sections/ConfiguracoesPage.tsx
git commit -m "feat(ui): aplica PageHeader compartilhado em Historico, Estatisticas, Membros, RegistrarAcao e Configuracoes"
```

---

### Task 16: Decisão final sobre o shared-element do Recrutamento

A spec propôs um efeito de transição shared-element (lista → detalhe do
candidato) usando `layoutId` compartilhado entre `RecrutamentoPage` e
`RecrutaCandidatoPage`, mas identificou um conflito real: isso só
funciona se as duas páginas ficarem montadas simultaneamente por um
instante, e a Task 2 configurou a transição de rotas do `AppShell` com
`mode="wait"` (a página de saída desmonta antes da de entrada montar) —
que é o comportamento certo para o resto do app (evita qualquer duas
páginas cobrando dados/efeitos ao mesmo tempo).

**Decisão:** não implementar o shared-element cross-route. O ganho
visual não justifica trocar o `mode="wait"` do `AppShell` (que afetaria
as 9 páginas) por uma exceção de uma feature só. A navegação
lista→detalhe do Recrutamento já herda a transição tática padrão da
Task 2 (mesmo efeito de todas as outras páginas), o que por si só já é
uma melhoria em relação ao corte instantâneo que existia antes deste
plano.

- [ ] **Step 1: Nenhuma ação de código — apenas confirmar visualmente**

Ir em Recrutamento e clicar num candidato da lista. Confirmar que a
navegação para a página de detalhe usa a mesma transição tática das
demais rotas (herdada da Task 2), e que a lista, ao voltar, também
recebe a mesma transição.

- [ ] **Step 2: Nenhum commit necessário nesta task**

(Documentado aqui para não deixar a decisão da spec sem resposta no
plano — é uma resolução explícita, não uma lacuna.)

---

## Self-Review

**Cobertura da spec:**
- Kit de motion central → Task 1. ✓
- Transição de rota → Task 2. ✓
- Indicador de rota ativa na Sidebar → Task 3. ✓
- Transição de abas internas de Configurações → Task 4. ✓
- `GlowCard` hover/tap/stagger → Task 5. ✓
- Rollout de stagger nos pontos sem animação (Membros, QRUs, Contas, Patentes/Cargos) → Tasks 6-8. ✓
- Migração das páginas com stagger local pro kit central (Dashboard, Estatísticas, Histórico, Recrutamento) → Tasks 9-12. ✓
- `PageHeader` compartilhado → Tasks 13-15. ✓
- Reuso de `ModalOverlay` no Recrutamento → Task 12, Step 3. ✓
- Extra shared-element do Recrutamento → Task 16 (decisão documentada de não implementar, com justificativa técnica). ✓

**Consistência de tipos/nomes:** `staggerContainer`, `staggerItem`,
`tacticalReveal`, `DURATION`, `EASE_SHARP` são definidos uma única vez na
Task 1 e reusados com os mesmos nomes em todas as tasks seguintes —
conferido nas Tasks 3, 4, 5, 8, 9, 10, 11, 12.

**Placeholders:** nenhum "TBD"/"depois eu vejo" — a única decisão em
aberto da spec (shared-element) foi resolvida explicitamente na Task 16
em vez de deixada pendente.
