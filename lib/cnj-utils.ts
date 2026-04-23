// CNJ process number utilities
// Format: NNNNNNN-DD.AAAA.J.TT.OOOO
// J: Justice segment, TT: Tribunal code

export interface CNJInfo {
  datajudAlias: string | null
  tribunalNome: string
  segmento: string
}

const ESTADO_MAP: Record<number, { alias: string; nome: string }> = {
  1:  { alias: 'tjac',  nome: 'TJAC'  }, 2:  { alias: 'tjal',  nome: 'TJAL'  },
  3:  { alias: 'tjam',  nome: 'TJAM'  }, 4:  { alias: 'tjap',  nome: 'TJAP'  },
  5:  { alias: 'tjba',  nome: 'TJBA'  }, 6:  { alias: 'tjce',  nome: 'TJCE'  },
  7:  { alias: 'tjdft', nome: 'TJDFT' }, 8:  { alias: 'tjes',  nome: 'TJES'  },
  9:  { alias: 'tjgo',  nome: 'TJGO'  }, 10: { alias: 'tjma',  nome: 'TJMA'  },
  11: { alias: 'tjmt',  nome: 'TJMT'  }, 12: { alias: 'tjms',  nome: 'TJMS'  },
  13: { alias: 'tjmg',  nome: 'TJMG'  }, 14: { alias: 'tjpa',  nome: 'TJPA'  },
  15: { alias: 'tjpb',  nome: 'TJPB'  }, 16: { alias: 'tjpr',  nome: 'TJPR'  },
  17: { alias: 'tjpe',  nome: 'TJPE'  }, 18: { alias: 'tjpi',  nome: 'TJPI'  },
  19: { alias: 'tjrj',  nome: 'TJRJ'  }, 20: { alias: 'tjrn',  nome: 'TJRN'  },
  21: { alias: 'tjrs',  nome: 'TJRS'  }, 22: { alias: 'tjro',  nome: 'TJRO'  },
  23: { alias: 'tjrr',  nome: 'TJRR'  }, 24: { alias: 'tjsc',  nome: 'TJSC'  },
  25: { alias: 'tjse',  nome: 'TJSE'  }, 26: { alias: 'tjsp',  nome: 'TJSP'  },
  27: { alias: 'tjto',  nome: 'TJTO'  },
}

export function parseCNJInfo(numeroCNJ: string): CNJInfo {
  const digits = numeroCNJ.replace(/\D/g, '')
  if (digits.length !== 20) return { datajudAlias: null, tribunalNome: '', segmento: '' }

  const j = digits[13]
  const tt = parseInt(digits.substring(14, 16))

  if (j === '8') {
    const e = ESTADO_MAP[tt]
    if (e) return { datajudAlias: `api_publica_${e.alias}`, tribunalNome: e.nome, segmento: 'Estadual' }
  }
  if (j === '4') {
    if (tt >= 1 && tt <= 6)
      return { datajudAlias: `api_publica_trf${tt}`, tribunalNome: `TRF${tt}`, segmento: 'Federal' }
  }
  if (j === '5') {
    if (tt >= 1 && tt <= 24)
      return { datajudAlias: `api_publica_trt${tt}`, tribunalNome: `TRT${tt}`, segmento: 'Trabalhista' }
  }
  if (j === '1') {
    if (tt === 0)  return { datajudAlias: 'api_publica_stf', tribunalNome: 'STF', segmento: 'Superior' }
    if (tt === 99) return { datajudAlias: 'api_publica_stj', tribunalNome: 'STJ', segmento: 'Superior' }
  }
  if (j === '2') {
    if (tt === 0) return { datajudAlias: 'api_publica_cjf', tribunalNome: 'CJF/TRFs', segmento: 'Federal' }
  }

  return { datajudAlias: null, tribunalNome: '', segmento: '' }
}

export function formatCNJ(raw: string): string {
  const d = raw.replace(/\D/g, '')
  if (d.length !== 20) return raw
  return `${d.substring(0, 7)}-${d.substring(7, 9)}.${d.substring(9, 13)}.${d[13]}.${d.substring(14, 16)}.${d.substring(16, 20)}`
}

export function getSegmentoLabel(numeroCNJ: string): string {
  const info = parseCNJInfo(numeroCNJ)
  return info.tribunalNome || 'Tribunal não identificado'
}
