import { z, ZodSchema } from 'zod'
import { Request, Response, NextFunction } from 'express'

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      res.status(400).json({
        error: 'Dados inválidos',
        details: result.error.issues.map(e =>
          `${(e.path as (string|number|symbol)[]).map(String).join('.')}: ${e.message}`
        ),
      })
      return
    }
    req.body = result.data
    next()
  }
}

// ── Schemas ──────────────────────────────────────────────────────────────────
// Em Zod v4, transform() cria ZodPipe; min/max devem vir ANTES do transform

const safeStr = (min: number, max: number) =>
  z.string().min(min).max(max).transform((s: string) => s.trim())

const safeStrOpt = (max: number) =>
  z.string().max(max).transform((s: string) => s.trim())

export const loginSchema = z.object({
  username: z.string().min(1).max(64).regex(/^[\w.\-@]+$/, 'Usuário contém caracteres inválidos'),
  password: z.string().min(1).max(128),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(4).max(128),
})

export const createContaSchema = z.object({
  username: z.string().min(2).max(64).regex(/^[\w.\-]+$/, 'Usuário contém caracteres inválidos'),
  password: z.string().min(4).max(128),
  nivel: z.enum(['admin', 'moderador', 'membro', 'view_only']),
})

export const updateContaSchema = z.object({
  nivel: z.enum(['admin', 'moderador', 'membro', 'view_only']).optional(),
  ativo: z.boolean().optional(),
  password: z.string().min(4).max(128).optional(),
}).refine(body => Object.keys(body).length > 0, { message: 'Nenhum campo fornecido' })

export const membroSchema = z.object({
  badge:          safeStrOpt(20).default(''),
  passaporte:     safeStrOpt(20).default(''),
  policial:       safeStr(1, 100),
  patenteNPD:     safeStrOpt(50).default(''),
  patenteInterna: safeStrOpt(50).default(''),
  status:         z.enum(['Ativo', 'Inativo', 'Ausência']).default('Ativo'),
  entrada:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  promocao:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  adv1:           z.boolean().default(false),
  adv2:           z.boolean().default(false),
  adv3:           z.boolean().default(false),
})

export const membroUpdateSchema = z.object({
  badge:          safeStrOpt(20).optional(),
  passaporte:     safeStrOpt(20).optional(),
  policial:       safeStr(1, 100).optional(),
  patenteNPD:     safeStrOpt(50).optional(),
  patenteInterna: safeStrOpt(50).optional(),
  status:         z.enum(['Ativo', 'Inativo', 'Ausência']).optional(),
  entrada:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  promocao:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  adv1:           z.boolean().optional(),
  adv2:           z.boolean().optional(),
  adv3:           z.boolean().optional(),
}).refine(body => Object.keys(body).filter(k => body[k as keyof typeof body] !== undefined).length > 0, {
  message: 'Nenhum campo fornecido',
})

export const acaoSchema = z.object({
  data:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  qru:          safeStr(1, 50),
  resultado:    z.enum(['Vitória', 'Derrota', 'Empate']),
  comandante:   z.string().max(100).optional(),
  participants: z.array(z.object({
    memberId:       z.number().int().positive(),
    patenteUnidade: safeStrOpt(50),
  })).default([]),
  participantesExtras: z.array(z.object({
    nome:    safeStr(1, 100),
    patente: z.string().max(50).optional(),
  })).default([]),
})

export const recrutaCreateSchema = z.object({
  nome:        safeStr(1, 100),
  data:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  observacoes: safeStrOpt(500).default(''),
})

export const avaliacaoRecrutaSchema = z.object({
  scores:      z.record(z.string(), z.number().min(0).max(10)).default({}),
  total:       z.number().min(0).max(10).default(0),
  observacoes: safeStrOpt(500).default(''),
})

export const qruSchema = z.object({
  nome: z.string().min(1).max(50).regex(/^[\w\s\-]+$/, 'Nome do QRU contém caracteres inválidos').transform((s: string) => s.trim()),
})

export const patenteSchema = z.object({
  nome: safeStr(1, 50),
})

export const cargoSchema = z.object({
  nome: safeStr(1, 50),
})

export const logoSchema = z.object({
  logo: z.string()
    .min(1)
    .max(2_900_000, 'Logo excede 2MB')
    .refine(
      s => /^data:image\/(png|jpeg|webp|svg\+xml);base64,/.test(s) || s.startsWith('<svg'),
      'Formato de imagem inválido',
    ),
})

export const recCfgSchema = z.object({
  notaMinima: z.number().min(0).max(10).optional(),
  categorias: z.array(z.object({
    id:   z.number().int().positive(),
    nome: safeStr(1, 50),
    peso: z.number().min(0).max(100),
  })).optional(),
})

export const reorderSchema = z.object({
  orderedIds: z.array(z.number().int().positive()),
})

export const reorderPatenteSchema = z.object({
  patentes: z.array(z.string().max(50)),
})

export const reorderQruSchema = z.object({
  qrus: z.array(z.string().min(1).max(50)),
})
