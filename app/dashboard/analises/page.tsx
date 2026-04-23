'use client'
import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { supabase } from '@/lib/supabase'
import { formatDate, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Publication {
  id: string
  conteudo: string
  data_publicacao: string
  tribunal: string | null
  lida: boolean
}

interface ChartData {
  mes: string
  processos: number
}

export default function AnalisesPage() {
  const [publications, setPublications] = useState<Publication[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session?.user) return

      const userId = sessionData.session.user.id

      // Load publications
      const { data: pubsData } = await supabase
        .from('publicacoes')
        .select('id, conteudo, data_publicacao, tribunal, lida')
        .eq('user_id', userId)
        .order('data_publicacao', { ascending: false })
        .limit(10)

      setPublications(pubsData || [])
      setUnreadCount(pubsData?.filter(p => !p.lida).length || 0)

      // Load chart data (last 6 months of process registrations)
      const { data: processosData } = await supabase
        .from('processos')
        .select('created_at')
        .eq('user_id', userId)

      // Group by month
      const monthCounts: { [key: string]: number } = {}
      const now = new Date()

      for (let i = 5; i >= 0; i--) {
        const date = subMonths(now, i)
        const monthKey = formatDate(date, 'MMM/yy', { locale: ptBR })
        monthCounts[monthKey] = 0
      }

      processosData?.forEach(p => {
        if (p.created_at) {
          const date = new Date(p.created_at)
          const monthKey = formatDate(date, 'MMM/yy', { locale: ptBR })
          if (monthKey in monthCounts) {
            monthCounts[monthKey]++
          }
        }
      })

      const data = Object.entries(monthCounts).map(([mes, processos]) => ({
        mes,
        processos
      }))

      setChartData(data)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSync() {
    try {
      // Simulated sync - in a real app this would call an API
      await new Promise(resolve => setTimeout(resolve, 1000))
      await loadData()
    } catch (error) {
      console.error('Error syncing:', error)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1a56db]" /></div>
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Análises</h1>
          <p className="text-sm text-slate-500 mt-1">Publicações e métricas da banca</p>
        </div>
        <button onClick={handleSync} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition shadow-sm">
          <RefreshCw size={15} /> Sincronizar
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Publications — 1/3 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Publicações</h2>
              <p className="text-xs text-slate-500 mt-0.5">DJEN / CNJ</p>
            </div>
            {unreadCount > 0 && (
              <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">{unreadCount} nova(s)</span>
            )}
          </div>
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {publications.length > 0 ? publications.map(pub => (
              <div key={pub.id} className={`p-4 ${!pub.lida ? 'bg-blue-50' : ''}`}>
                <div className="flex items-center gap-2 mb-1">
                  {!pub.lida && <div className="w-2 h-2 rounded-full bg-[#1a56db] flex-shrink-0" />}
                  <p className="text-xs font-bold text-slate-700">{pub.tribunal || 'CNJ'}</p>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2">{pub.conteudo}</p>
                {pub.data_publicacao && (
                  <p className="text-xs text-slate-400 mt-1">
                    {formatDate(new Date(pub.data_publicacao), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                )}
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <p className="text-sm">Nenhuma publicação</p>
              </div>
            )}
          </div>
        </div>

        {/* Chart — 2/3 */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-800">Processos cadastrados — últimos 6 meses</h2>
          </div>
          <div className="p-6">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                    formatter={(value) => [`${value} processo(s)`, 'Cadastrados']}
                    labelStyle={{ color: '#1e293b', fontWeight: 600 }}
                  />
                  <Bar dataKey="processos" fill="#1a56db" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-slate-400">
                <p className="text-sm">Nenhum processo nos últimos 6 meses</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
