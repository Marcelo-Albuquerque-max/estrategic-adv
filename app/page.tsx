'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [modo, setModo] = useState<'login' | 'cadastro'>('login')
  const [nome, setNome] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      if (modo === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
        if (error) throw error
        router.push('/dashboard')
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: { data: { nome } },
        })
        if (error) throw error
        setErro('Verifique seu e-mail para confirmar o cadastro.')
        setModo('login')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      if (msg.includes('Invalid login')) setErro('E-mail ou senha incorretos.')
      else if (msg.includes('already registered')) setErro('Este e-mail já está cadastrado.')
      else setErro(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }}>
      <div className="w-full max-w-sm px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #1a56db, #3b82f6)' }}>
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
              <path d="M12 2L4 6v6c0 5 3.5 9.7 8 10.9C16.5 21.7 20 17 20 12V6l-8-4z" fill="white" fillOpacity="0.9"/>
              <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Estrategic ADV</h1>
          <p className="text-slate-400 text-sm mt-1">Gestão jurídica inteligente</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">
            {modo === 'login' ? 'Entrar na sua conta' : 'Criar conta'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {modo === 'cadastro' && (
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Nome completo</label>
                <input type="text" value={nome} onChange={e => setNome(e.target.value)} required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Dr. João Silva" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">E-mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="advogado@escritorio.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Senha</label>
              <input type="password" value={senha} onChange={e => setSenha(e.target.value)} required minLength={6}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="••••••••" />
            </div>

            {erro && (
              <div className={`text-xs px-3 py-2 rounded-lg ${erro.includes('Verifique') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {erro}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all"
              style={{ background: loading ? '#94a3b8' : 'linear-gradient(135deg, #1a56db, #3b82f6)' }}>
              {loading ? 'Aguarde...' : modo === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={() => { setModo(m => m === 'login' ? 'cadastro' : 'login'); setErro('') }}
              className="text-sm text-blue-600 hover:underline">
              {modo === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entrar'}
            </button>
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          Estrategic ADV © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
