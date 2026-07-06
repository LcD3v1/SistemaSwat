import fs from 'fs'
import path from 'path'
import bcrypt from 'bcrypt'
import { SwatData } from './types'

const DATA_PATH = process.env.DATA_PATH
  ? path.resolve(process.env.DATA_PATH)
  : path.resolve(__dirname, '..', 'data.json')

const DEFAULT_DATA: SwatData = {
  membros: [],
  acoes: [],
  qrus: ['QRU-1', 'QRU-2', 'QRU-3'],
  recrutas: [],
  recCfg: {
    notaMinima: 7,
    categorias: [
      { id: 1, nome: 'Comunicação', peso: 1 },
      { id: 2, nome: 'Tiro', peso: 1 },
      { id: 3, nome: 'Táticas', peso: 1 },
      { id: 4, nome: 'Disciplina', peso: 1 },
    ],
  },
  patentes: ['Recruta', 'Soldado', 'Cabo', 'Sargento', 'Tenente', 'Capitão', 'Major', 'Coronel'],
  cargos: ['Operador', 'Sniper', 'Médico de Campo', 'Líder de Esquadrão', 'Comandante'],
  contas: [],
  nextMemId: 200,
  nextAcId: 1,
  nextRecId: 1,
  nextContaId: 1,
  logo: '',
  membrosOrder: [],
}

export function readData(): SwatData {
  if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(DEFAULT_DATA, null, 2), 'utf-8')
    return JSON.parse(JSON.stringify(DEFAULT_DATA))
  }
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf-8')
    const parsed = JSON.parse(raw) as SwatData
    // Garante que campos novos existam em dados legados
    return { ...DEFAULT_DATA, ...parsed }
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_DATA))
  }
}

export function writeData(data: SwatData): void {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

export async function ensureDefaultAdmin(): Promise<void> {
  const data = readData()
  if (data.contas.length === 0) {
    const hashed = await bcrypt.hash('admin123', 12)
    data.contas.push({
      id: 1,
      username: 'admin',
      password: hashed,
      nivel: 'admin',
      ativo: true,
    })
    data.nextContaId = 2
    writeData(data)
    console.log('[SWAT] Conta admin padrão criada: admin / admin123')
  }
}
