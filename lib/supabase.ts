import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy singleton — only created when actually used (not during build/SSG)
let _client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (_client) return _client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('Supabase não configurado. Adicione NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local')
  }
  _client = createClient(url, key)
  return _client
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getClient() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; nome: string; email: string; oab: string | null; telefone: string | null; escritorio: string | null }
      }
      processos: {
        Row: { id: string; user_id: string; cliente_id: string | null; numero_cnj: string; tipo: string; fase: string | null; tribunal: string | null; vara: string | null; valor_causa: number | null; status: string; descricao: string | null; created_at: string }
      }
      clientes: {
        Row: { id: string; user_id: string; nome: string; documento: string | null; email: string | null; telefone: string | null; tipo: string }
      }
      tarefas: {
        Row: { id: string; user_id: string; processo_id: string | null; titulo: string; tipo: string; prioridade: string; status: string; data_vencimento: string | null; hora_vencimento: string | null }
      }
      publicacoes: {
        Row: { id: string; user_id: string; processo_id: string | null; conteudo: string; data_publicacao: string | null; tribunal: string | null; lida: boolean }
      }
    }
  }
}
