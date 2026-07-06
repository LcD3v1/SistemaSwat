import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Lock, User } from 'lucide-react'
import Particles, { ParticlesProvider, useParticlesProvider } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import type { ISourceOptions } from '@tsparticles/engine'
import { useForm } from 'react-hook-form'
import api from '@/lib/axios'
import { useAuthStore } from '@/store/authStore'
import { useLogo } from '@/hooks/useConfig'
import ScanlineOverlay from '@/components/ui/ScanlineOverlay'
import type { AuthUser } from '@/types'

interface LoginForm {
  username: string
  password: string
}

const PARTICLES_OPTIONS: ISourceOptions = {
  fullScreen: false,
  background: { color: { value: 'transparent' } },
  fpsLimit: 60,
  particles: {
    number: { value: 50 },
    color: { value: '#c9a227' },
    opacity: { value: { min: 0.05, max: 0.35 } },
    size: { value: { min: 1, max: 2.5 } },
    move: {
      enable: true, speed: 0.4, direction: 'top',
      outModes: { default: 'out' },
    },
  },
}

function LoginParticles() {
  const { loaded } = useParticlesProvider()
  if (!loaded) return null
  return (
    <Particles
      id="login-particles"
      options={PARTICLES_OPTIONS}
      className="absolute inset-0 z-0"
    />
  )
}

const BOOT_TEXT = 'SISTEMA SWAT v3.0 — AUTENTICAÇÃO REQUERIDA'

export default function LoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { setAuth } = useAuthStore()

  const [bootText, setBootText] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>()
  const { data: logoData } = useLogo()

  // Animação de texto digitando
  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      setBootText(BOOT_TEXT.slice(0, i))
      i++
      if (i > BOOT_TEXT.length) {
        clearInterval(interval)
        setTimeout(() => setShowForm(true), 400)
      }
    }, 35)
    return () => clearInterval(interval)
  }, [])

  async function onSubmit(data: LoginForm) {
    setStatus('loading')
    try {
      const res = await api.post<{ token: string; user: AuthUser }>('/auth/login', data)
      setAuth(res.data.token, res.data.user)
      setStatus('success')
      setTimeout(() => navigate('/dashboard'), 1200)
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 2000)
    }
  }

  return (
    <div className="relative h-screen w-screen bg-bg flex flex-col items-center justify-center overflow-hidden">
      {/* Fundo cinematográfico tático */}
      <div className="login-bg" />
      <ScanlineOverlay />

      {/* Moldura HUD */}
      <div className="hud-frame" aria-hidden="true">
        <span className="tl" /><span className="tr" /><span className="bl" /><span className="br" />
      </div>

      {/* Partículas */}
      <ParticlesProvider init={loadSlim}>
        <LoginParticles />
      </ParticlesProvider>
      {/* Hex grid de fundo */}
      <div className="absolute inset-0 hex-grid-bg opacity-10 z-0" />

      {/* Texto de boot */}
      <div className="relative z-10 mb-8 text-center px-4">
        <p className="font-mono text-xs text-gold/70 tracking-widest cursor-blink">
          {bootText}
        </p>
      </div>

      {/* Logo */}
      <AnimatePresence>
        {bootText.length > 5 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 mb-8"
          >
            <div className="logo-ring" style={{ width: 72, height: 72 }}>
              {logoData?.logo ? (
                <img src={logoData.logo} alt="Logo SWAT" className="logo-circle" />
              ) : (
                <span className="logo-fallback">PMC<br />SWAT</span>
              )}
            </div>
            <motion.div
              className="absolute -inset-3 rounded-full border border-gold/20 pointer-events-none"
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card de login */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 80, damping: 20 }}
            className="relative z-10 w-full max-w-sm px-4"
          >
            {/* Overlay de status */}
            <AnimatePresence>
              {status === 'success' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 rounded-xl flex flex-col items-center justify-center gap-3 bg-green/20 border border-green/50 backdrop-blur"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="w-12 h-12 rounded-full bg-green/20 border-2 border-green flex items-center justify-center"
                  >
                    <span className="text-green text-2xl">✓</span>
                  </motion.div>
                  <p className="font-orbitron text-sm text-green tracking-wider">ACESSO CONCEDIDO</p>
                </motion.div>
              )}
              {status === 'error' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, x: [0, -8, 8, -8, 8, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 z-20 rounded-xl flex flex-col items-center justify-center gap-3 bg-red/20 border border-red/50 backdrop-blur"
                >
                  <div className="w-12 h-12 rounded-full bg-red/20 border-2 border-red flex items-center justify-center">
                    <span className="text-red text-2xl">✕</span>
                  </div>
                  <p className="font-orbitron text-sm text-red tracking-wider">ACESSO NEGADO</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="hud-corners bg-card border border-bdr rounded-xl p-8">
              <h2 className="font-orbitron text-center text-gold text-lg tracking-widest mb-8">
                IDENTIFICAÇÃO
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                {/* Username */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-xs text-txt2 tracking-wider">USUÁRIO</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-txt3" />
                    <input
                      {...register('username', { required: 'Usuário obrigatório' })}
                      className="input-gold w-full bg-card2 border border-bdr2 rounded px-4 py-2.5 pl-9 text-sm font-mono text-txt placeholder-txt3 transition-all"
                      placeholder="seu.usuario"
                      autoComplete="username"
                    />
                  </div>
                  {errors.username && (
                    <p className="text-red text-xs font-mono">{errors.username.message}</p>
                  )}
                </div>

                {/* Senha */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-xs text-txt2 tracking-wider">SENHA</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-txt3" />
                    <input
                      {...register('password', { required: 'Senha obrigatória' })}
                      type={showPass ? 'text' : 'password'}
                      className="input-gold w-full bg-card2 border border-bdr2 rounded px-4 py-2.5 pl-9 pr-10 text-sm font-mono text-txt placeholder-txt3 transition-all"
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-txt3 hover:text-txt2 transition-colors"
                    >
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red text-xs font-mono">{errors.password.message}</p>
                  )}
                </div>

                <motion.button
                  type="submit"
                  disabled={status === 'loading'}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-2 w-full py-3 bg-gold/10 border border-gold text-gold font-orbitron text-sm tracking-widest rounded transition-colors hover:bg-gold/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'loading' ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border border-gold border-t-transparent rounded-full animate-spin" />
                      VERIFICANDO...
                    </span>
                  ) : 'ACESSAR SISTEMA'}
                </motion.button>
              </form>

              {params.get('reason') === 'desativada' && (
                <p className="mt-4 text-center text-xs font-mono text-red">
                  Conta desativada. Contate o administrador.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
