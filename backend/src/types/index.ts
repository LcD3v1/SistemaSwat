export type Nivel = 'admin' | 'moderador' | 'membro' | 'view_only'
export type StatusMembro = 'Ativo' | 'Inativo' | 'Ausência'
export type ResultadoAcao = 'Vitória' | 'Derrota' | 'Empate'
export type ResultadoRecruita = 'Aprovado' | 'Reprovado'

export interface Membro {
  id: number
  badge: string
  passaporte: string
  policial: string
  patenteNPD: string
  patenteInterna: string
  status: StatusMembro
  entrada: string
  promocao: string
  adv1: boolean
  adv2: boolean
  adv3: boolean
  ordem?: number
}

export interface ParticipanteAcao {
  memberId: number
  patenteUnidade: string
}

export interface ParticipanteExterno {
  nome: string
  patente?: string
}

export interface Acao {
  id: number
  data: string
  qru: string
  resultado: ResultadoAcao
  participants: ParticipanteAcao[]
  participantesExtras?: ParticipanteExterno[]
  comandante?: string
}

export interface Conta {
  id: number
  username: string
  password: string
  nivel: Nivel
  ativo: boolean
}

export interface CategoriaRecrutamento {
  id: number
  nome: string
  peso: number
}

export interface RecCfg {
  notaMinima: number
  categorias: CategoriaRecrutamento[]
}

export interface AvaliacaoIndividual {
  contaId: number
  username: string
  scores: Record<string, number>
  total: number
  observacoes?: string
  data: string
}

export interface Recruta {
  id: number
  nome: string
  data: string
  avaliacoes: AvaliacaoIndividual[]
  resultado?: ResultadoRecruita
  status: 'aberto' | 'fechado'
  observacoes?: string
}

export interface SwatData {
  membros: Membro[]
  acoes: Acao[]
  qrus: string[]
  recrutas: Recruta[]
  recCfg: RecCfg
  patentes: string[]
  cargos: string[]
  contas: Conta[]
  nextMemId: number
  nextAcId: number
  nextRecId: number
  nextContaId: number
  logo: string
  membrosOrder: number[]
}

export interface AuthPayload {
  contaId: number
  username: string
  nivel: Nivel
}
