'use client'
import { useEffect, useState } from 'react'
import { FileText, Download, BarChart3, Users, Clock, Scale, TrendingUp, FileSpreadsheet, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { format, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Cliente { id: string; nome: string }

interface StatsData {
  totalProcessos: number
  processosAtivos: number
  processosArquivados: number
  totalClientes: number
  clientesPF: number
  clientesPJ: number
  totalTarefas: number
  tarefasAtrasadas: number
  tarefasConcluidas: number
  totalPublicacoes: number
  pubNaoLidas: number
  processosPorTipo: { tipo: string; total: number }[]
  processosPorMes: { mes: string; total: number }[]
  tarefasPorPrioridade: { prioridade: string; total: number }[]
}

const TIPO_CORES: Record<string, string> = {
  civel: '#1a56db',
  bancario: '#7c3aed',
  familia: '#db2777',
  trabalhista: '#ea580c',
  criminal: '#dc2626',
  tributario: '#059669',
  outro: '#6b7280',
}

const PRIORIDADE_CORES: Record<string, string> = {
  baixa: '#a3e635',
  normal: '#1a56db',
  alta: '#ea580c',
  urgente: '#dc2626',
}

export default function RelatoriosPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteSel, setClienteSel] = useState('')
  const [exportando, setExportando] = useState(false)
  const [userId, setUserId] = useState('')

  useEffect(() => { loadStats() }, [])

  async function loadStats() {
    try {
      const { data: s } = await supabase.auth.getSession()
      if (!s.session?.user) return
      const uid = s.session.user.id
      setUserId(uid)

      // Carrega lista de clientes para o filtro
      const { data: cli } = await supabase.from('clientes').select('id, nome').eq('user_id', uid).order('nome')
      setClientes(cli || [])
      const today = format(new Date(), 'yyyy-MM-dd')

      const [procRes, clientRes, tarefaRes, pubRes] = await Promise.all([
        supabase.from('processos').select('id, tipo, status, created_at').eq('user_id', uid),
        supabase.from('clientes').select('id, tipo').eq('user_id', uid),
        supabase.from('tarefas').select('id, prioridade, status, data_vencimento').eq('user_id', uid),
        supabase.from('publicacoes').select('id, lida').eq('user_id', uid),
      ])

      const processos = procRes.data || []
      const clientes = clientRes.data || []
      const tarefas = tarefaRes.data || []
      const pubs = pubRes.data || []

      // Processos por tipo
      const tipoCount: Record<string, number> = {}
      processos.forEach(p => { tipoCount[p.tipo] = (tipoCount[p.tipo] || 0) + 1 })
      const processosPorTipo = Object.entries(tipoCount).map(([tipo, total]) => ({ tipo, total }))

      // Processos por mês (últimos 6 meses)
      const mesCount: Record<string, number> = {}
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(new Date(), i)
        mesCount[format(d, 'MMM/yy', { locale: ptBR })] = 0
      }
      processos.forEach(p => {
        if (p.created_at) {
          const key = format(new Date(p.created_at), 'MMM/yy', { locale: ptBR })
          if (key in mesCount) mesCount[key]++
        }
      })
      const processosPorMes = Object.entries(mesCount).map(([mes, total]) => ({ mes, total }))

      // Tarefas por prioridade
      const prioCount: Record<string, number> = {}
      tarefas.forEach(t => { prioCount[t.prioridade] = (prioCount[t.prioridade] || 0) + 1 })
      const tarefasPorPrioridade = Object.entries(prioCount).map(([prioridade, total]) => ({ prioridade, total }))

      setStats({
        totalProcessos: processos.length,
        processosAtivos: processos.filter(p => p.status === 'ativo').length,
        processosArquivados: processos.filter(p => p.status !== 'ativo').length,
        totalClientes: clientes.length,
        clientesPF: clientes.filter(c => c.tipo === 'pessoa_fisica').length,
        clientesPJ: clientes.filter(c => c.tipo === 'pessoa_juridica').length,
        totalTarefas: tarefas.length,
        tarefasAtrasadas: tarefas.filter(t =>
          t.data_vencimento && t.data_vencimento < today &&
          !['concluida', 'cancelada'].includes(t.status)
        ).length,
        tarefasConcluidas: tarefas.filter(t => t.status === 'concluida').length,
        totalPublicacoes: pubs.length,
        pubNaoLidas: pubs.filter(p => !p.lida).length,
        processosPorTipo,
        processosPorMes,
        tarefasPorPrioridade,
      })
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  function exportCSV(type: 'processos' | 'clientes' | 'tarefas') {
    alert(`Exportação de "${type}" — funcionalidade disponível em breve com dados completos.`)
  }

  async function exportTrabalhista() {
    if (!userId) return
    setExportando(true)
    try {
      const params = new URLSearchParams({ user_id: userId })
      if (clienteSel) params.set('cliente_id', clienteSel)
      const res = await fetch(`/api/relatorio-trabalhista?${params}`)
      if (!res.ok) { alert('Erro ao gerar relatório'); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `relatorio_trabalhista_${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) { console.error(err); alert('Erro ao gerar relatório') }
    finally { setExportando(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1a56db]" />
    </div>
  )
  if (!stats) return null

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Relatórios</h1>
          <p className="text-sm text-slate-500 mt-1">Visão geral da banca jurídica</p>
        </div>
      </div>

      {/* ─── Exportação Trabalhista ─── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
            <FileSpreadsheet size={16} className="text-green-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Relatório Trabalhista em Excel</h2>
            <p className="text-xs text-slate-500">Exporta processos trabalhistas com valor da causa, condenação e depósitos recursais (RO e RR)</p>
          </div>
        </div>
        <div className="p-6 flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Filtrar por cliente</label>
            <div className="relative">
              <select
                value={clienteSel}
                onChange={e => setClienteSel(e.target.value)}
                className="w-full px-3 py-2 pr-8 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db] appearance-none bg-white"
              >
                <option value="">Todos os clientes</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1.5">Campos exportados</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Nº Processo · Vara/Tribunal · Parte Contrária · Situação<br/>
              <strong className="text-slate-600">Valor da Causa</strong> · <strong className="text-slate-600">Valor da Condenação</strong><br/>
              <strong className="text-slate-600">Dep. Recursal RO</strong> · <strong className="text-slate-600">Dep. Recursal RR</strong> · Saldo
            </p>
          </div>
          <button
            onClick={exportTrabalhista}
            disabled={exportando}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            <FileSpreadsheet size={15} />
            {exportando ? 'Gerando...' : 'Exportar Excel'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Processos Ativos', value: stats.processosAtivos, total: stats.totalProcessos, color: '#1a56db', bg: '#eff6ff', icon: Scale },
          { label: 'Clientes', value: stats.totalClientes, total: null, color: '#059669', bg: '#ecfdf5', icon: Users },
          { label: 'Tarefas Atrasadas', value: stats.tarefasAtrasadas, total: stats.totalTarefas, color: '#dc2626', bg: '#fef2f2', icon: Clock },
          { label: 'Tarefas Concluídas', value: stats.tarefasConcluidas, total: stats.totalTarefas, color: '#7c3aed', bg: '#f5f3ff', icon: TrendingUp },
          { label: 'Intimações Pendentes', value: stats.pubNaoLidas, total: stats.totalPublicacoes, color: '#ea580c', bg: '#fff7ed', icon: FileText },
        ].map(({ label, value, total, color, bg, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-slate-200 p-5 shadow-sm" style={{ background: bg }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-slate-500 font-semibold">{label}</p>
              <Icon size={16} style={{ color }} />
            </div>
            <p className="text-3xl font-bold" style={{ color }}>{value}</p>
            {total !== null && (
              <p className="text-xs text-slate-400 mt-1">de {total} total</p>
            )}
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Processos por mês */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Processos Cadastrados</h2>
              <p className="text-xs text-slate-500">Últimos 6 meses</p>
            </div>
            <button onClick={() => exportCSV('processos')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-200 transition">
              <Download size={12} /> Exportar
            </button>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.processosPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: 12 }}
                  formatter={(v) => [`${v}`, 'Cadastrados']}
                />
                <Bar dataKey="total" fill="#1a56db" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Processos por tipo */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Processos por Tipo</h2>
              <p className="text-xs text-slate-500">Distribuição atual</p>
            </div>
          </div>
          <div className="p-6">
            {stats.processosPorTipo.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={stats.processosPorTipo}
                    dataKey="total"
                    nameKey="tipo"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {stats.processosPorTipo.map((entry, i) => (
                      <Cell key={i} fill={TIPO_CORES[entry.tipo] || '#6b7280'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, String(n)]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 flex items-center justify-center text-slate-400 text-sm">
                Sem processos cadastrados
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-3 gap-6">
        {/* Clientes */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-800">Clientes</h2>
            <button onClick={() => exportCSV('clientes')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-200 transition">
              <Download size={12} /> Exportar
            </button>
          </div>
          <div className="p-6 space-y-4">
            {[
              { label: 'Total de clientes', value: stats.totalClientes, color: '#1a56db' },
              { label: 'Pessoa Física (PF)', value: stats.clientesPF, color: '#7c3aed' },
              { label: 'Pessoa Jurídica (PJ)', value: stats.clientesPJ, color: '#059669' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{item.label}</span>
                <span className="text-lg font-bold" style={{ color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tarefas por prioridade */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-800">Tarefas por Prioridade</h2>
            <button onClick={() => exportCSV('tarefas')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-200 transition">
              <Download size={12} /> Exportar
            </button>
          </div>
          <div className="p-6 space-y-3">
            {stats.tarefasPorPrioridade.length > 0 ? stats.tarefasPorPrioridade.map(tp => (
              <div key={tp.prioridade} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: PRIORIDADE_CORES[tp.prioridade] || '#6b7280' }} />
                <span className="text-sm text-slate-600 capitalize flex-1">{tp.prioridade}</span>
                <span className="text-sm font-bold text-slate-800">{tp.total}</span>
              </div>
            )) : (
              <p className="text-sm text-slate-400">Sem tarefas cadastradas</p>
            )}
          </div>
        </div>

        {/* Processos status */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-800">Processos por Status</h2>
          </div>
          <div className="p-6 space-y-4">
            {[
              { label: 'Ativos', value: stats.processosAtivos, color: '#059669' },
              { label: 'Arquivados', value: stats.processosArquivados, color: '#6b7280' },
              { label: 'Total', value: stats.totalProcessos, color: '#1a56db' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{item.label}</span>
                <span className="text-lg font-bold" style={{ color: item.color }}>{item.value}</span>
              </div>
            ))}
            {stats.totalProcessos > 0 && (
              <div className="pt-2">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Taxa de atividade</span>
                  <span>{Math.round((stats.processosAtivos / stats.totalProcessos) * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-[#059669]"
                    style={{ width: `${(stats.processosAtivos / stats.totalProcessos) * 100}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
