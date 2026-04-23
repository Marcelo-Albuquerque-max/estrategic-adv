'use client'
import { useEffect, useState } from 'react'
import { Plus, X, Search, Mail, CheckCircle2, Archive, RefreshCw, ExternalLink } from 'lucide-react'
import { supabase } from 'A/lib/supabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Publicacao {
  id: string
  conteudo: string
  data_publicacao: string | null
  tribunal: string | null
  vara: string | null
  lida: boolean
  tipo: string
  processo_id: string | null
  processos?: { numero_cnj: string } | null
}

type FilterType = 'pendentes' | 'todas' | 'arquivadas'

export default function IntimacaoesPage() {
  const [publicacoes, setPublicacoes] = useState<Publicacao[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<FilterType>('pendentes')
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    conteudo: '', tribunal: '', vara: '', data_publicacao: '', tipo: 'intimacao'
  })

  useEffect(() => { loadPublicacoes() }, [])

  async function loadPublicacoes() {
    try {
      const { data: s } = await supabase.auth.getSession()
      if (!s.session?.user) return
      const { data } = await supabase
        .from('publicacoes')
        .select('id, conteudo, data_publicacao, tribunal, vara, lida, tipo, processo_id, processos(numero_cnj)')
        .eq('user_id', s.session.user.id)
        .order('data_publicacao', { ascending: false })
      setPublicacoes((data as unknown as Publicacao[]) || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function handleToggleLida(id: string, lida: boolean) {
    await supabase.from('publicacoes').update({ lida: !lida }).eq('id', id)
    setPublicacoes(prev => prev.map(p => p.id === id ? { ...p, lida: !lida } : p))
  }

  async function handleAddPublicacao(e: React.FormEvent) {
    e.preventDefault()
    try {
      const { data: s } = await supabase.auth.getSession()
      if (!s.session?.user) return
      const { error } = await supabase.from('publicacoes').insert({
        user_id: s.session.user.id,
        conteudo: formData.conteudo,
        tribunal: formData.tribunal || null,
        vara: formData.vara || null,
        data_publicacao: formData.data_publicacao
          ? new Date(formData.data_publicacao + 'T12:00:00').toISOString()
          : new Date().toISOString(),
        tipo: formData.tipo,
        lida: false,
      })
      if (error) throw error
      setFormData({ conteudo: '', tribunal: '', vara: '', data_publicacao: '', tipo: 'intimacao' })
      setShowAddForm(false)
      await loadPublicacoes()
    } catch (err) { console.error(err) }
  }

  const pendentes = publicacoes.filter(p => !p.lida)
  const arquivadas = publicacoes.filter(p => p.lida)

  const filtered = publicacoes.filter(p => {
    const matchSearch = !searchTerm ||
      p.conteudo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.tribunal || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.processos?.numero_cnj || '').includes(searchTerm)
    const matchFilter =
      filter === 'todas' ||
      (filter === 'pendentes' && !p.lida) ||
      (filter === 'arquivadas' && p.lida)
    return matchSearch && matchFilter
  })

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1a56db]" />
    </div>
  )

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Intima√ß√µes</h1>
          <p className="text-sm text-slate-500 mt-1">
            {pendentes.length} pendente(s) ¬∑ {publicacoes.length} total
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadPublicacoes}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition shadow-sm"
          >
            <RefreshCw size={14} /> Atualizar
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a56db] text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
          >
            <Plus size={16} /> Nova Intima√ß√£o
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Pendentes', value: pendentes.length, color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
          { label: 'Arquivadas', value: arquivadas.length, color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
          { label: 'Total', value: publicacoes.length, color: '#1a56db', bg: '#eff6ff', border: '#bfdbfe' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border px-5 py-4 shadow-sm"
            style={{ background: s.bg, borderColor: s.border }}>
            <p className="text-xs text-slate-500 font-semibold">{s.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-5 p-4 flex items-center gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por conte√∫do, tribunal ou n√∫mero CNJ..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]"
          />
        </div>
        <div className="flex gap-2">
          {([
            { value: 'pendentes', label: 'Pendentes' },
            { value: 'todas', label: 'Todas' },
            { value: 'arquivadas', label: 'Arquivadas' },
          ] as { value: FilterType; label: string }[]).map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === f.value ? 'bg-[#1a56db] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length > 0 ? filtered.map(pub => (
          <div
            key={pub.id}
            className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
              !pub.lida ? 'border-blue-200 shadow-blue-50' : 'border-slate-200'
            }`}
          >
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {!pub.lida && (
                    <div className="w-2 h-2 rounded-full bg-[#1a56db] mt-1.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {pub.tribunal && (
                        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {pub.tribunal}
                        </span>
                      )}
                      {pub.vara && (
                        <span className="text-xs text-slate-500">{pub.vara}</span>
                      ))}
                      {(pub.processos?.numero_cnj && (
                        <span className="text-xs font-mono text-[#1a56db] bg-blue-50 px-2 py-0.5 rounded-md">
                          {pub.processos.numero_cnj}
                        </span>
                      ))}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        pub.tipo === 'intimacao'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {pub.tipo === 'intimacao' ? 'Intima√ß√£o' : pub.tipo === 'djen' ? 'DJEN' : pub.tipo}
                      </span>
                      {pub.data_publicacao && (
                        <span className="text-xs text-slate-400">
                          {format(new Date(pub.data_publicacao), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed line-clamp-3">{pub.conteudo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                  <button
                    onClick={() => handleToggleLida(pub.id, pub.lida)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      pub.lida
                        ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {pub.lida
                      ? <><Archive size={12} /> Arquivada</>
                      : <><CheckCircle2 size={12} /> Marcar lida</>
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-20 text-slate-400">
            <Mail size={48} className="mb-3 opacity-20" />
            <p className="text-sm font-medium">
              {filter === 'pendentes' ? 'Nenhuma intima√ß√£o pendente' : 'Nenhuma intima√ß√£o encontrada'}
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 text-sm text-[#1a56db] font-semibold hover:underline"
            >
              + Adicionar intima√ß√£o manualmente
            </button>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800">Nova Intima√ß√£o</h2>
              <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddPublicacao} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tribunal</label>
                  <input type="text" value={formData.tribunal}
                    onChange={e => setFormData({ ...formData, tribunal: e.target.value })}
                    placeholder="TJPA, TRF1, TRT8..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Data de publica√ß√£o</label>
                  <input type="date" value={formData.data_publicacao}
                    onChange={e => setFormData({ ...formData, data_publicacao: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Vara</label>
                <input type="text" value={formData.vara}
                  onChange={e => setFormData({ ...formData, vara: e.target.value })}
                  placeholder="1¬® Vara C√≠ˆvel, Vara do Trabalho..."
                  className=ä7u-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tipo</label>
                <select value={formData.tipo}
                  onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                  className=ä7u-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]">
                  <option value="intimacao">Intima√ß√£o</option>
                  <option value="djen">DJEN</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Conte√∫do *</label>
                <textarea required value={formData.conteudo}
                  onChange={e => setFormData({ ...formData, conteudo: e.target.value })}
                  rows={4} placeholder="Descreva o conte√∫do da intima√ß√£o..."
                  className="ç›KYù[L»KLàõ‹ô\àõ‹ô\ã\€]KLåõ›[ôY[»^\€Hõÿ›\Œõ›][ôK[õ€ôHõÿ›\Œúö[ôÀLàõÿ›\Œúö[ôÀV»ÃXMMôóHô\⁄^ôK[õ€ôHàœÇàŸ]èÇà]à€\‹”ò[YOHôõ^ÿ\L»LàèÇàù]€à\OHòù]€àà€ê€X⁄œ^ 
HOàŸ]⁄›–Yõ‹õJò[ŸJ_Bà€\‹”ò[YOHôõ^LHMKLà^\€Hõ€ù\Ÿ[ZXõ€^\€]KMåôÀ\€]KLLõ›[ôY[»›ô\éòôÀ\€]KLåò[ú⁄][€àèÇàÿ[òŸ[\Çàÿù]€èÇàù]€à\OHú›XõZ]Çà€\‹”ò[YOHôõ^LHMKLà^\€Hõ€ù\Ÿ[ZXõ€^]⁄]HôÀV»ÃXMMôóHõ›[ôY[»›ô\éòôÀXõYKMÃò[ú⁄][€àèÇàYX⁄[€ò\Çàÿù]€èÇàŸ]èÇàŸõ‹õOÇàŸ]èÇàŸ]èÇàŸ]èÇà
_BàŸ]èÇà
BüB