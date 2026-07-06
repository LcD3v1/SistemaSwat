import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, X, Send, UserX, Shield } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useCreateAcao } from '@/hooks/useAcoes'
import { useQrus } from '@/hooks/useConfig'
import { useMembros } from '@/hooks/useMembros'
import { useUIStore } from '@/store/uiStore'
import GlowCard from '@/components/ui/GlowCard'
import HudButton from '@/components/ui/HudButton'
import LoadingHud from '@/components/ui/LoadingHud'
import type { ResultadoAcao, Membro } from '@/types'

interface FormData {
  data: string
  qru: string
  resultado: ResultadoAcao
}

interface ExtraParticipante {
  nome: string
  patente: string
}

const RESULTADO_OPTIONS: { value: ResultadoAcao; color: string }[] = [
  { value: 'Vitória',      color: 'border-green text-green bg-green/10'   },
  { value: 'Derrota',      color: 'border-red text-red bg-red/10'         },
  { value: 'Empate',       color: 'border-blue text-blue bg-blue/10'       },
]

export default function RegistrarAcaoPage() {
  const navigate = useNavigate()
  const { addToast } = useUIStore()
  const { data: qrus, isLoading: qrusLoading } = useQrus()
  const { data: membros, isLoading: membrosLoading } = useMembros()
  const createAcao = useCreateAcao()

  const [comandante, setComandante] = useState('')
  const [showComandanteDropdown, setShowComandanteDropdown] = useState(false)

  const [selectedMembros, setSelectedMembros] = useState<Array<{ memberId: number; patenteUnidade: string }>>([])
  const [membroSearch, setMembroSearch] = useState('')

  const [participantesExtras, setParticipantesExtras] = useState<ExtraParticipante[]>([])
  const [extraNome, setExtraNome] = useState('')
  const [extraPatente, setExtraPatente] = useState('')

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      data: new Date().toISOString().slice(0, 10),
      resultado: 'Vitória',
    },
  })

  const resultado = watch('resultado')

  const filteredComandanteMembros = (membros ?? []).filter((m: Membro) =>
    comandante !== '' && (
      m.policial.toLowerCase().includes(comandante.toLowerCase()) ||
      m.badge.toLowerCase().includes(comandante.toLowerCase())
    )
  )

  const filteredMembros = (membros ?? []).filter((m: Membro) =>
    !selectedMembros.some(s => s.memberId === m.id) &&
    (membroSearch === '' ||
      m.policial.toLowerCase().includes(membroSearch.toLowerCase()) ||
      m.badge.toLowerCase().includes(membroSearch.toLowerCase()))
  )

  function addMembro(m: Membro) {
    setSelectedMembros(prev => [...prev, { memberId: m.id, patenteUnidade: m.patenteInterna || m.patenteNPD }])
    setMembroSearch('')
  }

  function removeMembro(id: number) {
    setSelectedMembros(prev => prev.filter(s => s.memberId !== id))
  }

  function addExtra() {
    const nome = extraNome.trim()
    if (!nome) return
    setParticipantesExtras(prev => [...prev, { nome, patente: extraPatente.trim() }])
    setExtraNome('')
    setExtraPatente('')
  }

  function removeExtra(idx: number) {
    setParticipantesExtras(prev => prev.filter((_, i) => i !== idx))
  }

  async function onSubmit(data: FormData) {
    try {
      await createAcao.mutateAsync({
        data: data.data,
        qru: data.qru,
        resultado: data.resultado,
        comandante: comandante.trim() || undefined,
        participants: selectedMembros,
        participantesExtras: participantesExtras.map(e => ({
          nome: e.nome,
          patente: e.patente || undefined,
        })),
      })
      addToast('success', 'Ação registrada com sucesso!')
      navigate('/acoes/historico')
    } catch {
      addToast('error', 'Erro ao registrar ação.')
    }
  }

  if (qrusLoading || membrosLoading) return <LoadingHud />

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <GlowCard>
        <div className="p-6">
          <h2 className="font-orbitron text-sm font-bold text-gold tracking-wider mb-6">
            NOVA OPERAÇÃO
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Data */}
            <div>
              <label className="font-mono text-xs text-txt2 tracking-wider block mb-1.5">DATA</label>
              <input
                {...register('data', { required: 'Data obrigatória' })}
                type="date"
                className="input-gold w-full bg-card2 border border-bdr2 rounded px-3 py-2.5 text-sm font-mono text-txt"
              />
              {errors.data && <p className="text-red text-xs font-mono mt-1">{errors.data.message}</p>}
            </div>

            {/* QRU */}
            <div>
              <label className="font-mono text-xs text-txt2 tracking-wider block mb-1.5">QRU</label>
              <select
                {...register('qru', { required: 'QRU obrigatório' })}
                className="input-gold w-full bg-card2 border border-bdr2 rounded px-3 py-2.5 text-sm font-mono text-txt"
              >
                <option value="">Selecione...</option>
                {(qrus ?? []).map(q => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
              {errors.qru && <p className="text-red text-xs font-mono mt-1">{errors.qru.message}</p>}
            </div>

            {/* Resultado */}
            <div>
              <label className="font-mono text-xs text-txt2 tracking-wider block mb-2">RESULTADO</label>
              <div className="flex gap-3">
                {RESULTADO_OPTIONS.map(opt => (
                  <motion.button
                    key={opt.value}
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setValue('resultado', opt.value)}
                    className={`flex-1 py-3 border rounded font-orbitron text-xs tracking-wider transition-all ${
                      resultado === opt.value ? opt.color : 'border-bdr text-txt3'
                    }`}
                  >
                    {opt.value.toUpperCase()}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Comandante */}
            <div>
              <label className="font-mono text-xs text-txt2 tracking-wider block mb-2">
                COMANDANTE
              </label>
              <div className="relative">
                <input
                  value={comandante}
                  onChange={e => { setComandante(e.target.value); setShowComandanteDropdown(true) }}
                  onBlur={() => setTimeout(() => setShowComandanteDropdown(false), 150)}
                  onFocus={() => setShowComandanteDropdown(true)}
                  placeholder="Buscar membro ou digitar nome do comandante..."
                  className="input-gold w-full bg-card2 border border-bdr2 rounded px-3 py-2 text-sm font-mono text-txt placeholder-txt3"
                />
                {showComandanteDropdown && filteredComandanteMembros.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 bg-card border border-bdr rounded-b-lg shadow-xl max-h-48 overflow-y-auto">
                    {filteredComandanteMembros.slice(0, 8).map((m: Membro) => (
                      <button
                        key={m.id}
                        type="button"
                        onMouseDown={() => { setComandante(m.policial); setShowComandanteDropdown(false) }}
                        className="w-full text-left px-3 py-2 text-xs font-mono text-txt2 hover:bg-bdr hover:text-txt transition-colors flex items-center gap-2"
                      >
                        <Shield size={12} className="text-gold" />
                        <span>{m.policial}</span>
                        <span className="text-txt3 ml-auto">{m.patenteInterna || m.patenteNPD}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="font-mono text-[10px] text-txt3 mt-1.5">
                Selecione um membro da unidade ou digite o nome do comandante externo (opcional)
              </p>
            </div>

            {/* Participantes da Unidade */}
            <div>
              <label className="font-mono text-xs text-txt2 tracking-wider block mb-2">
                PARTICIPANTES DA UNIDADE ({selectedMembros.length})
              </label>

              {selectedMembros.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedMembros.map(s => {
                    const m = (membros ?? []).find((m: Membro) => m.id === s.memberId)
                    return (
                      <motion.span
                        key={s.memberId}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-1.5 bg-bdr border border-bdr2 rounded px-2 py-1 text-xs font-mono text-txt"
                      >
                        {m?.policial ?? `ID:${s.memberId}`}
                        <button type="button" onClick={() => removeMembro(s.memberId)}
                          className="text-txt3 hover:text-red transition-colors">
                          <X size={12} />
                        </button>
                      </motion.span>
                    )
                  })}
                </div>
              )}

              <div className="relative">
                <input
                  value={membroSearch}
                  onChange={e => setMembroSearch(e.target.value)}
                  placeholder="Buscar membro da unidade..."
                  className="input-gold w-full bg-card2 border border-bdr2 rounded px-3 py-2 text-sm font-mono text-txt placeholder-txt3"
                />
                {membroSearch && filteredMembros.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 bg-card border border-bdr rounded-b-lg shadow-xl max-h-48 overflow-y-auto">
                    {filteredMembros.slice(0, 8).map((m: Membro) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => addMembro(m)}
                        className="w-full text-left px-3 py-2 text-xs font-mono text-txt2 hover:bg-bdr hover:text-txt transition-colors flex items-center gap-2"
                      >
                        <Plus size={12} className="text-gold" />
                        <span>{m.policial}</span>
                        <span className="text-txt3 ml-auto">{m.badge}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Participantes Externos */}
            <div>
              <label className="font-mono text-xs text-txt2 tracking-wider block mb-2">
                PARTICIPANTES EXTERNOS ({participantesExtras.length})
              </label>

              {participantesExtras.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {participantesExtras.map((e, i) => (
                    <motion.span
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-1.5 bg-blue/10 border border-blue/30 rounded px-2 py-1 text-xs font-mono text-txt"
                    >
                      <UserX size={11} className="text-blue shrink-0" />
                      {e.patente ? <span className="text-txt3">[{e.patente}]</span> : null}
                      {e.nome}
                      <button type="button" onClick={() => removeExtra(i)}
                        className="text-txt3 hover:text-red transition-colors">
                        <X size={12} />
                      </button>
                    </motion.span>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  value={extraPatente}
                  onChange={e => setExtraPatente(e.target.value)}
                  placeholder="Patente (opcional)"
                  className="input-gold w-36 bg-card2 border border-bdr2 rounded px-3 py-2 text-sm font-mono text-txt placeholder-txt3"
                />
                <input
                  value={extraNome}
                  onChange={e => setExtraNome(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addExtra() } }}
                  placeholder="Nome do participante externo..."
                  className="input-gold flex-1 bg-card2 border border-bdr2 rounded px-3 py-2 text-sm font-mono text-txt placeholder-txt3"
                />
                <button
                  type="button"
                  onClick={addExtra}
                  disabled={!extraNome.trim()}
                  className="border border-bdr2 rounded px-3 py-2 text-txt3 hover:text-txt hover:border-blue/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              <p className="font-mono text-[10px] text-txt3 mt-1.5">
                Participantes de fora da unidade — não constam no cadastro de membros
              </p>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <HudButton
                type="submit"
                loading={createAcao.isPending}
                size="lg"
                className="w-full justify-center"
              >
                <Send size={16} className="inline mr-2" />
                TRANSMITIR DADOS
              </HudButton>
            </div>
          </form>
        </div>
      </GlowCard>
    </div>
  )
}
