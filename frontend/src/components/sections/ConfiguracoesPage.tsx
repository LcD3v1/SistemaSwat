import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Image, List, Briefcase, Radio, UserPlus, Users,
  Plus, Trash2,
} from 'lucide-react'
import {
  useQrus, useAddQru, useDeleteQru, useReorderQrus,
  usePatentes, useAddPatente, useDeletePatente,
  useCargos, useAddCargo, useDeleteCargo,
  useLogo,
  useRecCfg, useUpdateRecCfg,
} from '@/hooks/useConfig'
import { useContas, useCreateConta, useUpdateConta, useDeleteConta } from '@/hooks/useContas'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import GlowCard from '@/components/ui/GlowCard'
import HudButton from '@/components/ui/HudButton'
import ModalOverlay from '@/components/ui/ModalOverlay'
import LoadingHud from '@/components/ui/LoadingHud'
import LogoUploader from '@/components/ui/LogoUploader'
import DragHandle from '@/components/ui/DragHandle'
import type { CategoriaRecrutamento, Nivel } from '@/types'

const TABS = [
  { id: 'logo',       label: 'Logo',          icon: Image,    minNivel: 'moderador' },
  { id: 'patentes',   label: 'Patentes',       icon: List,     minNivel: 'moderador' },
  { id: 'cargos',     label: 'Cargos',         icon: Briefcase, minNivel: 'moderador' },
  { id: 'qrus',       label: 'QRUs',           icon: Radio,    minNivel: 'moderador' },
  { id: 'recrutamento', label: 'Recrutamento', icon: UserPlus, minNivel: 'moderador' },
  { id: 'contas',     label: 'Contas',         icon: Users,    minNivel: 'admin' },
] as const

const RANK: Record<Nivel, number> = { view_only: -1, membro: 0, moderador: 1, admin: 2 }

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
      {canEdit && canReorder && (
        <DragHandle
          listeners={listeners as unknown as Record<string, unknown>}
          attributes={attributes as unknown as Record<string, unknown>}
        />
      )}
      <span className="font-mono text-xs text-txt flex-1">{item}</span>
      {canEdit && (
        <button onClick={() => onDelete(item)} className="opacity-0 group-hover:opacity-100 text-txt3 hover:text-red transition-all">
          <Trash2 size={12} />
        </button>
      )}
    </div>
  )
}

function ListEditor({
  items, onAdd, onDelete, onReorder, placeholder, canEdit,
}: {
  items: string[]; onAdd: (v: string) => void; onDelete: (v: string) => void
  onReorder?: (items: string[]) => void
  placeholder: string; canEdit: boolean
}) {
  const [val, setVal] = useState('')
  const [localItems, setLocalItems] = useState(items)
  const canReorder = Boolean(onReorder && canEdit)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    setLocalItems(items)
  }, [items])

  function handleDragEnd(event: DragEndEvent) {
    if (!onReorder) return
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = localItems.indexOf(String(active.id))
    const newIndex = localItems.indexOf(String(over.id))
    if (oldIndex < 0 || newIndex < 0) return

    const next = arrayMove(localItems, oldIndex, newIndex)
    setLocalItems(next)
    onReorder(next)
  }

  return (
    <div className="space-y-3">
      {canEdit && (
        <div className="flex gap-2">
          <input
            value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && val.trim()) { onAdd(val.trim()); setVal('') } }}
            placeholder={placeholder}
            className="input-gold flex-1 bg-card2 border border-bdr2 rounded px-3 py-2 text-sm font-mono text-txt"
          />
          <HudButton size="sm" onClick={() => { if (val.trim()) { onAdd(val.trim()); setVal('') } }}>
            <Plus size={14} />
          </HudButton>
        </div>
      )}
      <div className="space-y-1 max-h-60 overflow-y-auto">
        {canReorder ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={localItems} strategy={verticalListSortingStrategy}>
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
            </SortableContext>
          </DndContext>
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
        {localItems.length === 0 && (
          <p className="font-mono text-xs text-txt3 text-center py-4">Nenhum item cadastrado</p>
        )}
      </div>
    </div>
  )
}

export default function ConfiguracoesPage() {
  const { user } = useAuthStore()
  const { addToast } = useUIStore()
  const [activeTab, setActiveTab] = useState('logo')

  const userNivel = user?.nivel ?? 'membro'
  const visibleTabs = TABS.filter(t => RANK[userNivel] >= RANK[t.minNivel as Nivel])

  const { data: qrus = [] } = useQrus()
  const addQru = useAddQru()
  const deleteQru = useDeleteQru()
  const reorderQrus = useReorderQrus()

  const { data: patentes = [] } = usePatentes()
  const addPatente = useAddPatente()
  const deletePatente = useDeletePatente()

  const { data: cargos = [] } = useCargos()
  const addCargo = useAddCargo()
  const deleteCargo = useDeleteCargo()

  const { data: logoData } = useLogo()

  const { data: recCfg } = useRecCfg()
  const updateRecCfg = useUpdateRecCfg()

  const { data: contas = [] } = useContas()
  const createConta = useCreateConta()
  const updateConta = useUpdateConta()
  const deleteConta = useDeleteConta()

  const [novaContaModal, setNovaContaModal] = useState(false)
  const [novaContaForm, setNovaContaForm] = useState({ username: '', password: '', nivel: 'membro' })

  // Recrutamento
  const [newCatNome, setNewCatNome] = useState('')
  function addCategoria() {
    if (!newCatNome.trim() || !recCfg) return
    const novaCategoria: CategoriaRecrutamento = {
      id: Date.now(),
      nome: newCatNome.trim(),
      peso: 1,
    }
    updateRecCfg.mutate({
      categorias: [...recCfg.categorias, novaCategoria],
    })
    setNewCatNome('')
  }
  function deleteCategoria(id: number) {
    if (!recCfg) return
    updateRecCfg.mutate({
      categorias: recCfg.categorias.filter(c => c.id !== id),
    })
  }

  return (
    <div className="p-6 space-y-4">
      {/* Tabs */}
      <GlowCard>
        <div className="p-3 flex gap-1 flex-wrap">
          {visibleTabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded text-xs font-mono transition-all ${
                  activeTab === tab.id
                    ? 'bg-bdrg text-gold border border-gold/30'
                    : 'text-txt2 hover:bg-bdr hover:text-txt border border-transparent'
                }`}
              >
                <Icon size={13} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </GlowCard>

      {/* Conteúdo */}
      <GlowCard>
        <div className="p-6">
          {/* Logo */}
          {activeTab === 'logo' && (
            <LogoUploader currentLogo={logoData?.logo ?? ''} />
          )}

          {/* Patentes */}
          {activeTab === 'patentes' && (
            <div>
              <h3 className="font-orbitron text-xs text-gold tracking-wider mb-4">HIERARQUIA DE PATENTES</h3>
              <ListEditor
                items={patentes}
                onAdd={v => addPatente.mutate(v)}
                onDelete={v => deletePatente.mutate(v)}
                placeholder="Nova patente..."
                canEdit={true}
              />
            </div>
          )}

          {/* Cargos */}
          {activeTab === 'cargos' && (
            <div>
              <h3 className="font-orbitron text-xs text-gold tracking-wider mb-4">CARGOS INTERNOS</h3>
              <ListEditor
                items={cargos}
                onAdd={v => addCargo.mutate(v)}
                onDelete={v => deleteCargo.mutate(v)}
                placeholder="Novo cargo..."
                canEdit={true}
              />
            </div>
          )}

          {/* QRUs */}
          {activeTab === 'qrus' && (
            <div>
              <h3 className="font-orbitron text-xs text-gold tracking-wider mb-4">GERENCIAR QRUs</h3>
              <ListEditor
                items={qrus}
                onAdd={v => addQru.mutate(v)}
                onDelete={v => deleteQru.mutate(v)}
                onReorder={items => reorderQrus.mutate(items)}
                placeholder="Novo QRU..."
                canEdit={true}
              />
            </div>
          )}

          {/* Recrutamento */}
          {activeTab === 'recrutamento' && recCfg && (
            <div className="space-y-5">
              <h3 className="font-orbitron text-xs text-gold tracking-wider">CONFIGURAÇÕES DE RECRUTAMENTO</h3>
              <div>
                <label className="font-mono text-xs text-txt2 tracking-wider block mb-1.5">NOTA MÍNIMA</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0} max={10} step={0.5}
                    defaultValue={recCfg.notaMinima}
                    onBlur={e => updateRecCfg.mutate({ notaMinima: parseFloat(e.target.value) })}
                    className="input-gold w-24 bg-card2 border border-bdr2 rounded px-3 py-2 text-sm font-mono text-txt"
                  />
                  <span className="font-mono text-xs text-txt2">/ 10</span>
                </div>
              </div>
              <div>
                <h4 className="font-mono text-xs text-txt2 tracking-wider mb-3">CATEGORIAS DE AVALIAÇÃO</h4>
                <div className="space-y-2 mb-3">
                  {recCfg.categorias.map(cat => (
                    <div key={cat.id} className="flex items-center gap-3 px-3 py-2 bg-card2 border border-bdr rounded group">
                      <span className="font-mono text-xs text-txt flex-1">{cat.nome}</span>
                      <span className="font-mono text-xs text-txt2">peso: {cat.peso}</span>
                      <button onClick={() => deleteCategoria(cat.id)} className="opacity-0 group-hover:opacity-100 text-txt3 hover:text-red transition-all">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={newCatNome}
                    onChange={e => setNewCatNome(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addCategoria() }}
                    placeholder="Nova categoria..."
                    className="input-gold flex-1 bg-card2 border border-bdr2 rounded px-3 py-2 text-sm font-mono text-txt"
                  />
                  <HudButton size="sm" onClick={addCategoria}><Plus size={14} /></HudButton>
                </div>
              </div>
            </div>
          )}

          {/* Contas (admin only) */}
          {activeTab === 'contas' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-orbitron text-xs text-gold tracking-wider">CONTAS DE ACESSO</h3>
                <HudButton size="sm" onClick={() => setNovaContaModal(true)}>
                  <Plus size={14} className="inline mr-1.5" />
                  Nova Conta
                </HudButton>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-bdr">
                    {['Usuário', 'Nível', 'Status', 'Ações'].map(h => (
                      <th key={h} className="text-left font-mono text-xs text-txt3 px-3 py-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {contas.map(conta => (
                    <tr key={conta.id} className="border-b border-bdr/50 hover:bg-bdr/30 transition-colors">
                      <td className="px-3 py-2.5 font-mono text-xs text-txt">{conta.username}</td>
                      <td className="px-3 py-2.5">
                        <select
                          value={conta.nivel}
                          disabled={conta.id === user?.contaId}
                          onChange={e => updateConta.mutate({ id: conta.id, nivel: e.target.value })}
                          className="bg-card2 border border-bdr2 rounded px-2 py-0.5 text-xs font-mono text-txt disabled:opacity-50"
                        >
                          <option value="admin">👑 Admin</option>
                          <option value="moderador">🔷 Moderador</option>
                          <option value="membro">👤 Membro</option>
                          <option value="view_only">👁 View Only</option>
                        </select>
                      </td>
                      <td className="px-3 py-2.5">
                        <button
                          disabled={conta.id === user?.contaId}
                          onClick={() => updateConta.mutate({ id: conta.id, ativo: !conta.ativo })}
                          className={`font-mono text-xs px-2 py-0.5 rounded border disabled:opacity-40 ${
                            conta.ativo
                              ? 'border-green/40 text-green bg-green/10'
                              : 'border-red/40 text-red bg-red/10'
                          }`}
                        >
                          {conta.ativo ? '● Ativo' : '○ Inativo'}
                        </button>
                      </td>
                      <td className="px-3 py-2.5">
                        {conta.id !== user?.contaId && (
                          <button
                            onClick={() => {
                              if (!confirm('Excluir esta conta?')) return
                              deleteConta.mutate(conta.id)
                            }}
                            className="text-txt3 hover:text-red transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </GlowCard>

      {/* Modal Nova Conta */}
      <ModalOverlay open={novaContaModal} onClose={() => setNovaContaModal(false)} title="NOVA CONTA">
        <div className="space-y-4">
          <div>
            <label className="font-mono text-xs text-txt2 block mb-1">USUÁRIO</label>
            <input
              value={novaContaForm.username}
              onChange={e => setNovaContaForm(p => ({ ...p, username: e.target.value }))}
              placeholder="min. 2 chars — só letras, números, _ . -"
              className="input-gold w-full bg-card2 border border-bdr2 rounded px-3 py-2 text-sm font-mono text-txt placeholder:text-txt3"
            />
          </div>
          <div>
            <label className="font-mono text-xs text-txt2 block mb-1">SENHA</label>
            <input
              type="password"
              value={novaContaForm.password}
              onChange={e => setNovaContaForm(p => ({ ...p, password: e.target.value }))}
              placeholder="min. 4 caracteres"
              className="input-gold w-full bg-card2 border border-bdr2 rounded px-3 py-2 text-sm font-mono text-txt placeholder:text-txt3"
            />
          </div>
          <div>
            <label className="font-mono text-xs text-txt2 block mb-1">NÍVEL</label>
            <select
              value={novaContaForm.nivel}
              onChange={e => setNovaContaForm(p => ({ ...p, nivel: e.target.value }))}
              className="input-gold w-full bg-card2 border border-bdr2 rounded px-3 py-2 text-sm font-mono text-txt"
            >
              <option value="membro">👤 Membro</option>
              <option value="moderador">🔷 Moderador</option>
              <option value="admin">👑 Admin</option>
              <option value="view_only">👁 View Only</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <HudButton
              loading={createConta.isPending}
              onClick={() => {
                if (!novaContaForm.username || !novaContaForm.password) return
                createConta.mutate(novaContaForm, {
                  onSuccess: () => { addToast('success', 'Conta criada!'); setNovaContaModal(false); setNovaContaForm({ username: '', password: '', nivel: 'membro' }) },
                  onError: (err: unknown) => {
                    const data = (err as { response?: { data?: { error?: string; details?: string[] } } })?.response?.data
                    const msg = data?.details?.length ? data.details.join(' | ') : (data?.error ?? 'Erro ao criar conta.')
                    addToast('error', msg)
                  },
                })
              }}
              className="flex-1"
            >
              CRIAR CONTA
            </HudButton>
            <HudButton variant="ghost" onClick={() => setNovaContaModal(false)} className="flex-1">
              CANCELAR
            </HudButton>
          </div>
        </div>
      </ModalOverlay>
    </div>
  )
}
