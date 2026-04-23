import { NextRequest, NextResponse } from 'next/server'
import { parseCNJInfo } from '@/lib/cnj-utils'

const DATAJUD_BASE = 'https://api-publica.datajud.cnj.jus.br'
// Chave pública oficial do DataJud — documentada em https://datajud-wiki.cnj.jus.br/api-publica/acesso
const DATAJUD_KEY = 'APIKey cDZHYzlZa0JadVREZDJCendFbXNpTnk6eTgyRVNNaTRmYVcyMElFQVFScUFZUQ=='

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const numeroCNJ = searchParams.get('processo')

  if (!numeroCNJ) {
    return NextResponse.json({ error: 'Parâmetro "processo" obrigatório' }, { status: 400 })
  }

  const info = parseCNJInfo(numeroCNJ)
  if (!info.datajudAlias) {
    return NextResponse.json({ error: 'Tribunal não identificado para este número CNJ' }, { status: 400 })
  }

  try {
    const response = await fetch(`${DATAJUD_BASE}/${info.datajudAlias}/_search`, {
      method: 'POST',
      headers: {
        Authorization: DATAJUD_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: { match: { numeroProcesso: numeroCNJ.replace(/\D/g, '') } },
        size: 1,
      }),
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      const txt = await response.text()
      console.error('DataJud error:', response.status, txt)
      return NextResponse.json({ error: `DataJud retornou ${response.status}` }, { status: 502 })
    }

    const data = await response.json()
    const source = data.hits?.hits?.[0]?._source

    if (!source) {
      return NextResponse.json({ error: 'Processo não encontrado no DataJud' }, { status: 404 })
    }

    return NextResponse.json({
      sucesso: true,
      tribunal: info.tribunalNome,
      segmento: info.segmento,
      processo: source,
    })
  } catch (err) {
    console.error('DataJud fetch error:', err)
    return NextResponse.json({ error: 'Erro ao consultar DataJud. Tente novamente.' }, { status: 500 })
  }
}
