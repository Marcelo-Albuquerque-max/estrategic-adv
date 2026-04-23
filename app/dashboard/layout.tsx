'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Home, Calendar, FileText, Users, Scale, LogOut, Settings, ChevronDown, Mail, Clock, Activity, PieChart } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import '../globals.css'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [escritorioNome, setEscritorioNome] = useState<string | null>(null)
  const [intimacoesPendentes, setIntimacoesPendentes] = useState(0)
  const [andamentosNaoLidos, setAndamentosNaoLidos] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.push('/')
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('nome, escritorio')
          .eq('id', data.session.user.id)
          .single()
        if (profile?.nome) setUserName(profile.nome)
        if (profile?.escritorio) setEscritorioNome(profile.escritorio)

        // Badges de notificação
        const [pubsRes, andRes] = await Promise.all([
          supabase.from('publicacoes').select('id').eq('user_id', data.session.user.id).eq('lida', false),
          supabase.from('andamentos').select('id').eq('user_id', data.session.user.id).eq('lido', false),
        ])
        setIntimacoesPendentes(pubsRes.data?.length || 0)
        setAndamentosNaoLidos(andRes.data?.length || 0)

        setLoading(false)
      }
    })
  }, [router])

  // Carrega logo do localStorage (client-side only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('estrategic_logo')
      if (stored) setLogoUrl(stored)
    } catch { /* ignore */ }
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a56db]"></div>
      </div>
    )
  }

  const navItems = [
    { href: '/dashboard', label: 'INÍCIO', icon: Home },
    { href: '/dashboard/agenda', label: 'AGENDA', icon: Calendar },
    { href: '/dashboard/processos', label: 'PROCESSOS', icon: FileText },
    { href: '/dashboard/intimacoes', label: 'INTIMAÇÕES', icon: Mail, badge: intimacoesPendentes },
    { href: '/dashboard/andamentos', label: 'ANDAMENTOS', icon: Clock, badge: andamentosNaoLidos },
    { href: '/dashboard/monitoramento', label: 'MONITORAMENTO', icon: Activity },
    { href: '/dashboard/clientes', label: 'CLIENTES', icon: Users },
    { href: '/dashboard/relatorios', label: 'RELATÓRIOS', icon: PieChart },
  ]

  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AD'

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Top Navigation Bar */}
      <nav style={{ background: '#111827' }} className="flex items-center h-14 px-4 gap-3 flex-shrink-0 shadow-md">

        {/* Logo — mostra logo do cliente se configurada, senão marca do sistema */}
        <div className="flex items-center gap-2 mr-1 flex-shrink-0">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo do escritório"
              className="h-8 w-auto object-contain max-w-[130px]"
            />
          ) : (
            <>
              <Scale size={20} className="text-[#1a56db]" />
              <span className="text-white font-bold text-sm tracking-wide whitespace-nowrap">
                {escritorioNome || 'Estrategic ADV'}
              </span>
            </>
          )}
        </div>

        <div className="w-px h-5 bg-slate-700 flex-shrink-0" />

        {/* Nav items */}
        <div className="flex items-center gap-0.5 overflow-x-auto flex-1 min-w-0">
          {navItems.map(({ href, label, icon: Icon, badge }) => {
            const isActive = href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(href)
            return (
              <button
                key={href}
                onClick={() => router.push(href)}
                className={`relative flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold rounded transition-colors whitespace-nowrap flex-shrink-0 ${
                  isActive
                    ? 'text-white bg-[#1a56db]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Icon size={12} />
                {label}
                {badge !== undefined && badge > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-0.5 bg-red-500 rounded-full text-white text-[8px] font-bold flex items-center justify-center">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => router.push('/dashboard/configuracoes')}
            className="text-slate-400 hover:text-white transition p-1.5 rounded hover:bg-slate-700"
          >
            <Settings size={15} />
          </button>

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-1.5 text-slate-300 hover:text-white transition pl-2 border-l border-slate-700"
            >
              <div className="w-7 h-7 rounded-full bg-[#1a56db] flex items-center justify-center text-xs font-bold text-white">
                {initials}
              </div>
              <span className="text-xs font-medium hidden lg:block">{userName.split(' ')[0]}</span>
              <ChevronDown size={11} />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-800 truncate">{userName}</p>
                </div>
                <button
                  onClick={() => { setUserMenuOpen(false); router.push('/dashboard/configuracoes') }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Settings size={13} /> Configurações
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut size={13} /> Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
