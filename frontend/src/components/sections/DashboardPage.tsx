import { motion } from 'framer-motion'
import { useMemo } from 'react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, Tooltip, Legend,
} from 'recharts'
import { Shield, Activity, TrendingUp, AlertTriangle, Users, UserPlus } from 'lucide-react'
import { useAllAcoes } from '@/hooks/useAcoes'
import { useMembros } from '@/hooks/useMembros'
import GlowCard from '@/components/ui/GlowCard'
import AnimatedCounter from '@/components/ui/AnimatedCounter'
import LoadingHud from '@/components/ui/LoadingHud'
import { calcWinRate, formatDate } from '@/lib/utils'
import type { Membro } from '@/types'

const ITEM_VARIANTS = {
  hidden: { opacity: 0, scale: 0.95, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3 } },
}
const CONTAINER_VARIANTS = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

const RESULTADO_COLORS: Record<string, string> = {
  'Vitória':      '#27ae60',
  'Derrota':      '#c0392b',
  'Empate': '#2980b9',
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function StatCard({
  icon: Icon, label, value, color, suffix = '',
}: {
  icon: React.ElementType; label: string; value: number; color: string; suffix?: string
}) {
  return (
    <motion.div variants={ITEM_VARIANTS}>
      <GlowCard>
        <div className="p-5 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center`}
            style={{ background: color + '15', border: `1px solid ${color}30` }}>
            <Icon size={22} style={{ color }} />
          </div>
          <div>
            <p className="font-mono text-xs text-txt2 tracking-wider mb-1">{label}</p>
            <p className="font-orbitron text-2xl font-bold" style={{ color }}>
              <AnimatedCounter value={value} suffix={suffix} />
            </p>
          </div>
        </div>
        <div className="h-0.5 w-full" style={{ background: `linear-gradient(to right, ${color}40, transparent)` }} />
      </GlowCard>
    </motion.div>
  )
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean; payload?: Array<{ name: string; value: number; fill: string }>; label?: string
}) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-bdr rounded p-2 text-xs font-mono">
      <p className="text-txt2 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.fill }}>
          {p.name}: {p.value}{p.name.includes('%') ? '%' : ''}
        </p>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const { data: acoesData, isLoading: acoesLoading } = useAllAcoes()
  const { data: membros, isLoading: membrosLoading } = useMembros()

  const acoes = acoesData?.acoes ?? []

  const stats = useMemo(() => {
    const ativos = (membros ?? []).filter((m: Membro) => m.status === 'Ativo').length
    const comAdv = (membros ?? []).filter((m: Membro) => m.adv1 || m.adv2 || m.adv3).length
    const currentMonthKey = getMonthKey(new Date())
    const monthAcoes = acoes.filter(a => a.data.startsWith(currentMonthKey))
    const semExternos = acoes.filter(a => (a.participantesExtras ?? []).length === 0)
    const comExternos = acoes.filter(a => (a.participantesExtras ?? []).length > 0)
    const monthWinRate = calcWinRate(monthAcoes)
    const tacticalWinRate = calcWinRate(semExternos)
    const externalWinRate = calcWinRate(comExternos)
    return { ativos, comAdv, monthWinRate, tacticalWinRate, externalWinRate }
  }, [membros, acoes])

  const pieData = useMemo(() => {
    const currentMonthKey = getMonthKey(new Date())
    const monthAcoes = acoes.filter(a => a.data.startsWith(currentMonthKey))
    const v = monthAcoes.filter(a => a.resultado === 'Vitória').length
    const d = monthAcoes.filter(a => a.resultado === 'Derrota').length
    const p = monthAcoes.filter(a => a.resultado === 'Empate').length
    return [
      { name: 'Vitórias', value: v, color: '#27ae60' },
      { name: 'Derrotas', value: d, color: '#c0392b' },
      { name: 'Empates', value: p, color: '#2980b9' },
    ].filter(x => x.value > 0)
  }, [acoes])

  // Ações por mês (últimos 6 meses)
  const barData = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
      const monthKey = getMonthKey(d)
      const monthAcoes = acoes.filter(a => a.data.startsWith(monthKey))
      return {
        mes: MONTH_NAMES[d.getMonth()],
        ações: monthAcoes.length,
        'win rate %': calcWinRate(monthAcoes),
      }
    })
  }, [acoes])

  // Ranking de operadores
  const operatorRanking = useMemo(() => {
    if (!membros) return []
    return membros
      .map((m: Membro) => {
        const memAcoes = acoes.filter(a => a.participants.some(p => p.memberId === m.id))
        const winR = calcWinRate(memAcoes)
        return { ...m, totalAcoes: memAcoes.length, winRate: winR }
      })
      .filter(m => m.totalAcoes > 0)
      .sort((a, b) => b.winRate - a.winRate || b.totalAcoes - a.totalAcoes)
      .slice(0, 5)
  }, [membros, acoes])

  const recentOps = acoes.slice(0, 8)

  if (acoesLoading || membrosLoading) return <LoadingHud />

  return (
    <div className="p-6 space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="hex-grid-bg rounded-xl border border-bdr p-8 text-center relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 rounded-full border-2 border-gold/40 flex items-center justify-center bg-card pulse-gold">
              <Shield size={32} className="text-gold" />
            </div>
          </div>
          <h1 className="font-orbitron text-2xl font-bold text-gold tracking-widest mb-1">UNIDADE SWAT</h1>
          <p className="font-mono text-xs text-txt2 tracking-wider mb-4">SISTEMA DE GESTÃO OPERACIONAL</p>
          <div className="inline-block bg-card border border-bdr rounded-lg px-6 py-2">
            <span className="font-mono text-xs text-txt2 mr-2">WIN RATE</span>
            <span className="font-orbitron text-3xl font-black text-gold">
              <AnimatedCounter value={stats.monthWinRate} suffix="%" />
            </span>
          </div>
        </div>
      </motion.div>

      {/* Stat cards */}
      <motion.div
        variants={CONTAINER_VARIANTS}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-5 gap-4"
      >
        <StatCard icon={Activity}       label="% DO MÊS"             value={stats.monthWinRate} color="#c9a227" suffix="%" />
        <StatCard icon={TrendingUp}     label="MEMBROS ATIVOS"       value={stats.ativos} color="#27ae60" />
        <StatCard icon={Users}          label="WIN RATE SWAT"        value={stats.tacticalWinRate} color="#2980b9" suffix="%" />
        <StatCard icon={UserPlus}       label="WIN RATE EXTERNOS"    value={stats.externalWinRate} color="#ddbb4a" suffix="%" />
        <StatCard icon={AlertTriangle}  label="COM ADVERTÊNCIAS"     value={stats.comAdv} color="#c0392b" />
      </motion.div>

      <div className="grid grid-cols-3 gap-6">
        {/* Gráfico de rosca */}
        <GlowCard>
          <div className="p-4">
            <h3 className="font-orbitron text-xs text-txt2 tracking-wider mb-4">RESULTADOS DO MÊS</h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.length ? (
                        <div className="bg-card border border-bdr rounded p-2 text-xs font-mono">
                          <p style={{ color: (payload[0].payload as { color: string }).color }}>
                            {payload[0].name}: {payload[0].value}
                          </p>
                        </div>
                      ) : null
                    }
                  />
                  <Legend
                    formatter={(value) => <span className="font-mono text-[10px] text-txt2">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center">
                <p className="font-mono text-xs text-txt3">Sem dados</p>
              </div>
            )}
          </div>
        </GlowCard>

        {/* Gráfico de barras */}
        <GlowCard className="col-span-2">
          <div className="p-4">
            <h3 className="font-orbitron text-xs text-txt2 tracking-wider mb-4">% POR MÊS</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData}>
                <XAxis dataKey="mes" tick={{ fill: '#787878', fontSize: 10, fontFamily: 'Share Tech Mono' }} />
                <YAxis
                  tick={{ fill: '#787878', fontSize: 10 }}
                  allowDecimals={false}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="win rate %" fill="#c9a227" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlowCard>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Últimas operações */}
        <GlowCard>
          <div className="p-4">
            <h3 className="font-orbitron text-xs text-txt2 tracking-wider mb-4">ÚLTIMAS OPERAÇÕES</h3>
            {recentOps.length === 0 ? (
              <p className="font-mono text-xs text-txt3 py-4 text-center">Nenhuma operação registrada</p>
            ) : (
              <motion.div
                variants={CONTAINER_VARIANTS}
                initial="hidden"
                animate="visible"
                className="space-y-2"
              >
                {recentOps.map(op => (
                  <motion.div
                    key={op.id}
                    variants={ITEM_VARIANTS}
                    className="flex items-center gap-3 py-2 border-b border-bdr last:border-0"
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: RESULTADO_COLORS[op.resultado] }}
                    />
                    <span className="font-mono text-xs text-txt2">{formatDate(op.data)}</span>
                    <span className="font-mono text-xs text-txt3">{op.qru}</span>
                    <span className="ml-auto font-mono text-xs" style={{ color: RESULTADO_COLORS[op.resultado] }}>
                      {op.resultado}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </GlowCard>

        {/* Ranking de operadores */}
        <GlowCard>
          <div className="p-4">
            <h3 className="font-orbitron text-xs text-txt2 tracking-wider mb-4">RANKING DE OPERADORES</h3>
            {operatorRanking.length === 0 ? (
              <p className="font-mono text-xs text-txt3 py-4 text-center">Sem dados suficientes</p>
            ) : (
              <motion.div
                variants={CONTAINER_VARIANTS}
                initial="hidden"
                animate="visible"
                className="space-y-3"
              >
                {operatorRanking.map((op, idx) => (
                  <motion.div key={op.id} variants={ITEM_VARIANTS} className="flex items-center gap-3">
                    <span className="font-orbitron text-xs w-5 text-txt3 shrink-0">#{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs text-txt truncate">{op.policial}</p>
                      <div className="mt-1 h-1 rounded bg-bdrg overflow-hidden">
                        <motion.div
                          className="h-full rounded"
                          style={{ background: '#c9a227' }}
                          initial={{ width: 0 }}
                          animate={{ width: `${op.winRate}%` }}
                          transition={{ duration: 0.8, delay: idx * 0.1 }}
                        />
                      </div>
                    </div>
                    <span className="font-orbitron text-xs text-gold w-10 text-right shrink-0">{op.winRate}%</span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </GlowCard>
      </div>
    </div>
  )
}
