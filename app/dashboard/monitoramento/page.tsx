'use client'
import { useEffect, useState } from 'react'
import { Search, RefreshCw, Activity, CheckCircle2, AlertCircle, Clock, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ProcessoMonitor {
  id: string
  numero_cnj: string
  tribunal: string | null
  tipo: string
  status: string
  updated_at: string
  clientes?: { nome: string } | null
  _syncStatus?: 'idle' | 'loading' | 'ok' | 'error' | 'not_found'
  _syncMsg?: string
  _lastSync?: string
}

export default function MonitoramentoPage() {
  const [processos, setProcessos] = useState<ProcessoMonitor[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [syncingAll, setSyncingAll] = useState(false)

  useEffect(() => { loadProcessos() }, [])

  async function loadProcessos() {
    try {
      const { data: s } = await supabase.auth.getSession()
      if (!s.session?.user) return
      const { data } = await supabase
        .from('processos')
        .select('id, numero_cnj, tribunal, tipo, status, updated_at, clientes(nome)')
        .eq('user_id', s.session.user.id)
        .eq('status', 'ativo')
        .order('updated_at', { ascending: false })
      setProcessos((data as unknown as ProcessoMonitor[]) || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function handleSync(processo: ProcessoMonitor) {
    setProcessos(prev => prev.map(p =>
      p.id === processo.id ? { ...p, _syncStatus: 'loading', _syncMsg: 'Consultando DataJud...' } : p
    ))

    try {
      const res = await fetch(`/api/datajud?processo=${encodeURIComponent(processo.numero_cnj)}`)
      const json = await res.json()

      if (!res.ok || !json.sucesso) {
        setProcessos(prev => prev.map(p =>
          p.id === processo.id
            ? { ...p, _syncStatus: res.status === 404 ? 'not_found' : 'error', _syncMsg: json.error || 'Erro', _lastSync: new Date().toISOString() }
            : p
        ))
        return
      }

      const movimentos = json.processo?.movimentos || []

      if (movimentos.length > 0) {
        const { data: sessionData } = await supabase.auth.getSession()
        if (sessionData.session?.user) {
          const toInsert = movimentos.slice(0, 50).map((m: { dataHora?: string; nome: string; complementosTabelados?: Array<{ descricao: string }> }) => ({
            user_id: sessionData.session!.user.id,
            processo_id: processo.id,
            descricao: `${m.nome}${m.complementosTabelados?.map((c: { descricao: string }) => ` — ${c.descricao}`).join('') || ''}`,
            data_andamento: m.dataHora ? m.dataHora.substring(0, 10) : new Date().toISOString().substring(0, 10),
            tipo: 'automatico',
            lido: false,
          }))
          await supabase.from('andamentos').upsert(toInsert, { onConflict: 'processo_id,data_andamento,descricao' })
        }
      }

      setProcessos(prev => prev.map(p =>
        p.id === processo.id
          ? { ...p, _syncStatus: 'ok', _syncMsg: `${movimentos.length} movimento(s) sincronizado(s) — ${json.tribunal}`, _lastSync: new Date().toISOString() }
          : p
      ))
    } catch (err) {
      console.error(err)
      setProcessos(prev => prev.map(p =>
        p.id === processo.id
          ? { ...p, _syncStatus: 'error', _syncMsg: 'Erro de conexão', _lastSync: new Date().toISOString() }
          : p
      ))
    }
  }

  async function handleSyncAll() {
    setSyncingAll(true)
    const ativos = processos.filter(p => p.status === 'ativo')
    for (const proc of ativos) {
      await handleSync(proc)
      await new Promise(r => setTimeout(r, 500)) // throttle
    }
    setSyncingAll(false)
  }

  const filtered = processos.filter(p =>
    !searchTerm ||
    p.numero_cnj.includes(searchTerm) ||
    (p.tribunal || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.clientes?.nome || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1a56db]" />
    </div>
  )

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Monitoramento</h1>
          <p className="text-sm text-slate-500 mt-1">{processos.length} processo(s) ativo(s) monitorados via DataJud CNJ</p>
        </div>
        <button
          onClick={handleSyncAll}
          disabled={syncingAll}
          className="flex items-center gap-2 px-4 py-2 bg-[#1a56db] text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50"
        >
          <RefreshCw size={14} className={syncingAll ? 'animate-spin' : ''} />
          {syncingAll ? 'Sincronizando...' : 'Sincronizar Todos'}
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Activity size={18} className="text-[#1a56db] flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-900">DataJud — API Pública CNJ</p>
          <p className="text-xs text-blue-700 mt-0.5">
            O monitoramento utiliza a API pública do DataJud (api-publica.datajud.cnj.jus.br) para buscar novos andamentos.
            Clique em "Sincronizar" por processo ou use "Sincronizar Todos" para atualizar todos os processos ativos de uma vez.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-5 p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por CNJ, tribunal ou cliente..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]"
          />
        </div>
      </div>

      {/* Process List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filtered.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-semibold">
                <th className="text-left px-6 py-3">PROCESSO</th>
                <th className="text-left px-6 py-3">TRIBUNAL</th>
                <th className="text-left px-6 py-3">CLIENTE</th>
                <th className="text-left px-6 py-3">STATUS SYNC</th>
                <th className="text-left px-6 py-3">AÇÁO</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((proc, i) => (
                <tr key={proc.id}
                  className={`border-b border-slate-100 hover:bg-slate-50 transition ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                  <td className="px-6 py-4 font-mono text-xs text-slate-700">{proc.numero_cnj}</td>
                  <td className="px-6 py-4 text-slate-600">{proc.tribunal || '—'}</td>
                  <td className="px-6 py-4 text-slate-600">{proc.clientes?.nome || '—'}</td>
                  <td className="px-6 py-4">
                    {!proc._syncStatus || proc._syncStatus === 'idle' ? (
                      <span className="text-xs text-slate-400">Aguardando sync</span>
                    ) : proc._syncStatus === 'loading' ? (
                      <span className="flex items-center gap-1.5 text-xs text-blue-600">
                        <RefreshCw size={11} className="animate-spin" /> Consultando...
                      </span>
                    ) : proc._syncStatus === 'ok' ? (
                      <span className="flex items-center gap-1.5 text-xs text-green-700">
                        <CheckCircle2 size={11} /> {proc._syncMsg}
                      </span>
                    ) : proc._syncStatus === 'not_found' ? (
                      <span className="flex items-center gap-1.5 text-xs text-amber-600">
                        <AlertCircle size={11} /> Não encontrado no DataJud
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-red-600">
                        <AlertCircle size={11} /> {proc._syncMsg}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleSync(proc)}
                      disabled={proc._syncStatus === 'loading' || syncingAll}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a56db] text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-40"
                    >
                      <RefreshCw size={11} className={proc._syncStatus === 'loading' ? 'animate-spin' : ''} />
                      Sincronizar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Activity size={48} className="mb-3 opacity-20" />
            <p className="text-sm font-medium">Nenhum processo ativo para monitorar</p>
          </div>
        )}
      </div>
    </div>
  )
}
