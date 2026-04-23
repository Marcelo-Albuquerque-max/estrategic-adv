'use client'
import { useEffect, useState } from 'react'
import { Plus, X, Search, Users, Mail, Phone } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Cliente {
  id: string; nome: string; documento: string | null
  email: string | null; telefone: string | null; tipo: string
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({ nome: '', documento: '', email: '', telefone: '', tipo: 'pessoa_fisica' })

  useEffect(() => { loadClientes() }, [])

  async function loadClientes() {
    try {
      const { data: s } = await supabase.auth.getSession()
      if (!s.session?.user) return
      const { data } = await supabase.from('clientes').select('id, nome, documento, email, telefone, tipo').eq('user_id', s.session.user.id).order('nome')
      setClientes(data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function handleAddCliente(e: React.FormEvent) {
    e.preventDefault()
    try {
      const { data: s } = await supabase.auth.getSession()
      if (!s.session?.user) return
      const { error } = await supabase.from('clientes').insert({
        user_id: s.session.user.id,
        nome: formData.nome, documento: formData.documento || null,
        email: formData.email || null, telefone: formData.telefone || null, tipo: formData.tipo
      })
      if (error) throw error
      setFormData({ nome: '', documento: '', email: '', telefone: '', tipo: 'pessoa_fisica' })
      setShowAddForm(false)
      await loadClientes()
    } catch (err) { console.error(err) }
  }

  const filtered = clientes.filter(c =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.documento || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getInitials = (nome: string) => nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const colors = ['#1a56db','#7c3aed','#db2777','#ea580c','#059669','#dc2626','#0891b2','#d97706']
  const getColor = (s: string) => colors[s.charCodeAt(0) % colors.length]

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1a56db]" /></div>

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
          <p className="text-sm text-slate-500 mt-1">{clientes.length} cliente(s) cadastrado(s)</p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="flex items-center gap-2 px-4 py-2 bg-[#1a56db] text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition">
          <Plus size={16} /> Novo Cliente
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total', value: clientes.length, color: '#1a56db' },
          { label: 'Pessoa Física', value: clientes.filter(c => c.tipo === 'pessoa_fisica').length, color: '#7c3aed' },
          { label: 'Pessoa Jurídica', value: clientes.filter(c => c.tipo === 'pessoa_juridica').length, color: '#059669' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 px-5 py-4 shadow-sm">
            <p className="text-xs text-slate-500 font-semibold">{s.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-4 p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Buscar por nome, documento ou e-mail..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filtered.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-semibold">
                <th className="text-left px-6 py-3">CLIENTE</th>
                <th className="text-left px-6 py-3">TIPO</th>
                <th className="text-left px-6 py-3">DOCUMENTO</th>
                <th className="text-left px-6 py-3">E-MAIL</th>
                <th className="text-left px-6 py-3">TELEFONE</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const ini = getInitials(c.nome)
                const col = getColor(ini)
                return (
                  <tr key={c.id} className={`border-b border-slate-100 hover:bg-slate-50 transition ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: col }}>{ini}</div>
                        <span className="font-semibold text-slate-800">{c.nome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${c.tipo === 'pessoa_fisica' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {c.tipo === 'pessoa_fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">{c.documento || '—'}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {c.email ? <a href={`mailto:${c.email}`} className="flex items-center gap-1 hover:text-blue-600"><Mail size={13} />{c.email}</a> : '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {c.telefone ? <span className="flex items-center gap-1"><Phone size={13} />{c.telefone}</span> : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Users size={48} className="mb-3 opacity-20" />
            <p className="text-sm font-medium">Nenhum cliente encontrado</p>
            <button onClick={() => setShowAddForm(true)} className="mt-4 text-sm text-[#1a56db] font-semibold hover:underline">+ Adicionar primeiro cliente</button>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800">Novo Cliente</h2>
              <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddCliente} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nome *</label>
                <input type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} required placeholder="Nome completo" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tipo *</label>
                  <select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]">
                    <option value="pessoa_fisica">Pessoa Física</option>
                    <option value="pessoa_juridica">Pessoa Jurídica</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">{formData.tipo === 'pessoa_fisica' ? 'CPF' : 'CNPJ'}</label>
                  <input type="text" value={formData.documento} onChange={e => setFormData({...formData, documento: e.target.value})} placeholder={formData.tipo === 'pessoa_fisica' ? '000.000.000-00' : '00.000.000/0000-00'} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">E-mail</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="cliente@email.com" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Telefone</label>
                <input type="tel" value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} placeholder="(11) 9 0000-0000" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-[#1a56db] rounded-lg hover:bg-blue-700 transition">Adicionar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
