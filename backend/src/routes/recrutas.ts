import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { modOrAdmin } from '../middleware/roles'
import { validateBody, recrutaSchema } from '../middleware/validate'
import { audit } from '../security/audit'
import { readData, writeData } from '../data'
import { Recruta } from '../types'

const router = Router()

router.get('/', requireAuth, modOrAdmin, (_req: Request, res: Response): void => {
  res.json([...readData().recrutas].sort((a, b) => b.id - a.id))
})

router.post('/', requireAuth, modOrAdmin, validateBody(recrutaSchema), (req: Request, res: Response): void => {
  const body = req.body as Omit<Recruta, 'id'>
  const data = readData()

  const novoRecruita: Recruta = {
    id:          data.nextRecId,
    nome:        body.nome,
    data:        body.data ?? new Date().toISOString().slice(0, 10),
    scores:      body.scores,
    total:       body.total,
    resultado:   body.resultado,
    observacoes: body.observacoes,
  }

  data.recrutas.push(novoRecruita)
  data.nextRecId++
  writeData(data)

  audit('RECRUTA_CREATED', req, `Nome: ${novoRecruita.nome} | Resultado: ${novoRecruita.resultado}`)
  res.status(201).json(novoRecruita)
})

router.delete('/:id', requireAuth, modOrAdmin, (req: Request, res: Response): void => {
  const id = parseInt(String(req.params.id), 10)
  if (isNaN(id)) { res.status(400).json({ error: 'ID inválido' }); return }

  const data = readData()
  const idx = data.recrutas.findIndex(r => r.id === id)
  if (idx === -1) { res.status(404).json({ error: 'Avaliação não encontrada' }); return }

  data.recrutas.splice(idx, 1)
  writeData(data)

  audit('RECRUTA_DELETED', req, `ID: ${id}`)
  res.json({ ok: true })
})

export default router
